import { Command, DiscordCommand } from '@discord-nestjs/core';
import { UserSettings } from '@mongo/user/user.schema';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import locale from '@src/i18n/i18n-node';
import { MongoGuildService } from '@src/schemas/mongo/guild/guild.service';
import { config } from '@utils/config';
import { CommandInteraction, ComponentType, Message } from 'discord.js';
@Injectable()
@Command({
  name: 'notify',
  dmPermission: true,
  defaultMemberPermissions: ['SendMessages'],
  descriptionLocalizations: {
    ru: 'Включить/Выключить уведомления о розыгрышах',
    'en-US': 'Turn on/off giveaway notifications'
  },
  description: 'Turn on/off giveaway notifications'
})
export class NotificationsCmd implements DiscordCommand {
  private logger = new Logger(NotificationsCmd.name);
  constructor(
    private readonly usersService: MongoUserService,
    private readonly guildService: MongoGuildService
  ) {}
  async handler(command: CommandInteraction) {
    await command.deferReply({}).catch((err) => this.logger.error(err));
    const guildDoc = await this.guildService.getLocalization(command.guildId);
    const region = guildDoc
      ? guildDoc
      : command.guild?.preferredLocale == 'ru'
      ? 'ru'
      : 'en';
    const user = await this.usersService.get({ ID: command.user.id });
    const options = locale[region].notification.options;

    const message = await command
      .editReply({
        embeds: [
          {
            color: config.meta.defaultColor,
            title: locale[region].notification.title(),
            thumbnail: {
              url: command.user.displayAvatarURL() || ''
            },
            description: locale[region].notification.description()
          }
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                customId: 'notifications',
                type: ComponentType.SelectMenu,
                label: locale[region].default.notification(),
                placeholder: locale[region].notification.placeholder(),
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
            title: locale[region].notification.response.description.text(),
            fields: [
              {
                name: locale[region].notification.response.description.was(),
                value: selected
                  .map(
                    (v) =>
                      `${options[v]()}: **${
                        user.settings[v]
                          ? locale[region].default.on()
                          : locale[region].default.off()
                      }**`
                  )
                  .join('\n')
              },
              {
                name: locale[region].notification.response.description.is(),
                value: selected
                  .map(
                    (v) =>
                      `**${options[v]()}: ${
                        items[v]
                          ? locale[region].default.on()
                          : locale[region].default.off()
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
