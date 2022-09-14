import { Command, DiscordCommand } from '@discord-nestjs/core';
import { UserSettings } from '@mongo/user/user.schema';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import locale from '@src/i18n/i18n-node';
import { config } from '@utils/config';
import { CommandInteraction, ComponentType, Message } from 'discord.js';
@Injectable()
@Command({
  name: 'notify',
  description: 'Включить/Выключить уведомления о розыгрышах'
})
export class NotificationsCmd implements DiscordCommand {
  private logger = new Logger(NotificationsCmd.name);
  constructor(private readonly usersService: MongoUserService) {}
  async handler(command: CommandInteraction) {
    await command.deferReply({}).catch((err) => this.logger.error(err));
    const user = await this.usersService.get(command.user.id, 0);
    const options = locale.en.notification.options;

    const message = await command
      .editReply({
        embeds: [
          {
            title: locale.en.notification.title(),
            thumbnail: {
              url: command.user.displayAvatarURL() || ''
            },
            description: locale.en.notification.description()
          }
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                customId: 'notifications',
                type: ComponentType.SelectMenu,
                label: locale.en.default.notification(),
                placeholder: locale.en.notification.placeholder(),
                emoji: '<:point:1014108607098404925>',
                options: Object.entries(options).map((item) => {
                  return {
                    label: item[1](),
                    value: item[0]
                  };
                }),
                minValues: 1,
                maxValues: 2
              }
            ]
          }
        ]
      })
      .catch((err) => this.logger.error(err));
    if (!message || !(message instanceof Message)) return;

    const response = await (message as Message)
      .awaitMessageComponent({
        filter: (interaction) => {
          if (interaction.message.id !== message.id) return false;
          if (interaction.user.id != command.user.id) return false;
          return true;
        },
        time: config.ticks.oneMinute,
        componentType: ComponentType.SelectMenu
      })
      .catch((err) => this.logger.error(err));
    if (!response) return;
    await response.deferUpdate({}).catch((err) => this.logger.error(err));
    const selected = response.values;
    const items = selected.reduce(
      (a, v) => ({ ...a, [v]: !user.settings[v] }),
      {} as UserSettings
    );
    await this.usersService.UserModel.updateOne(
      { ID: command.user.id },
      { settings: items }
    );
    response
      .update({
        embeds: [
          {
            description: [
              locale.en.notification.response.description.text(),
              `${locale.en.notification.response.description.was()}:`,
              selected
                .map(
                  (v) =>
                    `${options[v]}: ${
                      user.settings[v]
                        ? locale.en.default.on()
                        : locale.en.default.off()
                    }`
                )
                .join('\n'),
              `${locale.en.notification.response.description.is()}:`,
              selected
                .map(
                  (v) =>
                    `${options[v]}: ${
                      items[v]
                        ? locale.en.default.on()
                        : locale.en.default.off()
                    }`
                )
                .join('\n')
            ].join('\n')
          }
        ],
        components: []
      })
      .catch((err) => this.logger.error(err));
  }
}
