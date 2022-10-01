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
  dmPermission: true,
  descriptionLocalizations: {
    ru: 'Включить/Выключить уведомления о розыгрышах',
    'en-US': 'Turn on/off giveaway notifications'
  },
  description: 'Turn on/off giveaway notifications'
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
            color: config.meta.defaultColor,
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
      .catch((err) => {
        this.logger.error(err);
        return null;
      });

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

    await response
      .editReply({
        embeds: [
          {
            thumbnail: {
              url: command.user.displayAvatarURL() || ''
            },
            color: config.meta.defaultColor,
            title: locale.en.notification.response.description.text(),
            fields: [
              {
                name: locale.en.notification.response.description.was(),
                value: selected
                  .map(
                    (v) =>
                      `${options[v]()}: **${
                        user.settings[v]
                          ? locale.en.default.on()
                          : locale.en.default.off()
                      }**`
                  )
                  .join('\n')
              },
              {
                name: locale.en.notification.response.description.is(),
                value: selected
                  .map(
                    (v) =>
                      `**${options[v]()}: ${
                        items[v]
                          ? locale.en.default.on()
                          : locale.en.default.off()
                      }**`
                  )
                  .join('\n')
              }
            ]
          }
        ],
        components: []
      })
      .catch((err) => this.logger.error(err));
  }
}
