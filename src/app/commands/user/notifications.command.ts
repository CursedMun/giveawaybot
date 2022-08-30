import { Command, DiscordCommand } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { CommandInteraction, Message } from 'discord.js';
import { config } from 'src/app/utils/config';
import { UserSettings } from 'src/schemas/mongo/user/user.schema';
import { MongoUserService } from 'src/schemas/mongo/user/user.service';
@Injectable()
@Command({
  name: 'notify',
  description: 'Включить/Выключить уведомления о розыгрышах',
})
export class NotificationsCmd implements DiscordCommand {
  private logger = new Logger(NotificationsCmd.name);
  constructor(private readonly usersService: MongoUserService) {}
  async handler(command: CommandInteraction): Promise<any> {
    await command.deferReply({}).catch((err) => this.logger.error(err));
    const user = await this.usersService.get(command.user.id, 0);
    const options = {
      voiceNotifications: 'Войс оповещение',
      winNotifications: 'Оповещение о выигрыше',
    };
    const message = await command
      .editReply({
        embeds: [
          {
            title: 'Управление уведомлениями',
            thumbnail: {
              url: command.user.avatarURL({ dynamic: true, size: 1024 }) || '',
            },
            description: `Выберите нужный пункт для **включения** или **отключения** уведомления о розыгрыше`,
          },
        ],
        components: [
          {
            type: 'ACTION_ROW',
            components: [
              {
                customId: 'notifications',
                type: 'SELECT_MENU',
                label: 'Уведомления',
                placeholder: 'Нажимать сюда!',
                emoji: '<:point:1014108607098404925>',
                options: Object.entries(options).map((item, index) => {
                  return {
                    label: item[1],
                    value: item[0],
                  };
                }),
                minValues: 1,
                maxValues: 2,
              },
            ],
          },
        ],
      })
      .catch((err) => this.logger.error(err));
    if (!message) return;

    const response = await (message as Message)
      .awaitMessageComponent({
        filter: (interaction) => {
          if (interaction.message.id !== message.id) return false;
          if (interaction.user.id != command.user.id) return false;
          return true;
        },
        time: config.ticks.oneMinute,
        componentType: 'SELECT_MENU',
      })
      .catch((err) => this.logger.error(err));
    if (!response) return;
    await response.deferUpdate({}).catch((err) => this.logger.error(err));
    const selected = response.values;
    console.log(selected);
    const items = selected.reduce(
      (a, v) => ({ ...a, [v]: !user.settings[v] }),
      {} as UserSettings,
    );
    console.log(items);
    await this.usersService.UserModel.updateOne(
      { ID: command.user.id },
      { settings: items },
    );
    response
      .update({
        embeds: [
          {
            description: [
              `Вы успешно изменили ваши настройки`,
              `Было:`,
              selected
                .map(
                  (v) => `${options[v]}: ${user.settings[v] ? 'вкл' : 'выкл'}`,
                )
                .join('\n'),
              `Стало:`,
              selected
                .map((v) => `${options[v]}: ${items[v] ? 'вкл' : 'выкл'}`)
                .join('\n'),
            ].join('\n'),
          },
        ],
        components: [],
      })
      .catch((err) => this.logger.error(err));
  }
}
