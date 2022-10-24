import {
  Command,
  DiscordCommand,
  InjectDiscordClient,
  On
} from '@discord-nestjs/core';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { GiveawayService } from '@src/app/providers/giveaway.service';
import { config } from '@src/app/utils/config';
import { IsButtonInteractionGuard } from '@src/app/utils/guards/is-button-interaction.guard';
import { parseFilteredTimeArray } from '@src/app/utils/utils';
import locale from '@src/i18n/i18n-node';
import { TranslationFunctions } from '@src/i18n/i18n-types';
import { MongoGuildService } from '@src/schemas/mongo/guild/guild.service';
import {
  APIEmbed,
  ButtonInteraction,
  ButtonStyle,
  Client,
  CommandInteraction,
  ComponentType,
  JSONEncodable
} from 'discord.js';
@Injectable()
@Command({
  name: 'help',
  dmPermission: true,
  descriptionLocalizations: {
    ru: 'Помощь по командам',
    'en-US': 'Help Command'
  },
  description: 'Help Command'
})
export class HelpCmd implements DiscordCommand {
  private logger = new Logger(HelpCmd.name);
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly giveawayService: GiveawayService,
    private readonly guildService: MongoGuildService
  ) {}
  async handler(command: CommandInteraction) {
    await command.deferReply().catch((err) => this.logger.error(err));
    const guildDoc = await this.guildService.getLocalization(command.guildId);
    const region = guildDoc
      ? guildDoc
      : command.guild?.preferredLocale == 'ru'
      ? 'ru'
      : 'en';
    const userID = command.user.id;
    await command
      .editReply({
        embeds: [
          {
            ...config.embeds.defaultHelpEmbed,
            image: {
              url:
                region === 'ru'
                  ? 'https://cdn.discordapp.com/attachments/980765606364205056/1027880626466070578/give_bot_ru.png'
                  : 'https://cdn.discordapp.com/attachments/980765606364205056/1027880626046640128/give_bot_en.png'
            }
          },
          {
            ...(await this.getEmbed('commands', locale[region])),
            footer: {
              text: locale[region].help.commands.embed.footer()
            },
            image: {
              url: 'https://cdn.discordapp.com/attachments/980765606364205056/980765983155318805/222.png'
            }
          } ?? {}
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                label: locale[region].help.buttons.commands(),
                customId: `help.commands.${userID}`,
                type: ComponentType.Button,
                style: ButtonStyle.Primary
              },
              {
                label: locale[region].help.buttons.information(),
                customId: `help.information.${userID}`,
                type: ComponentType.Button,
                style: ButtonStyle.Secondary
              },
              {
                label: locale[region].help.buttons.activeGiveaways(),
                customId: `help.giveaways.${userID}`,
                type: ComponentType.Button,
                style: ButtonStyle.Secondary
              }
            ]
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                label: locale[region].help.buttons.feedback(),
                customId: `help.feedback.${userID}`,
                type: ComponentType.Button,
                style: ButtonStyle.Danger,
                disabled: true
              },
              {
                label: 'Ko-fi (Support me)',
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: 'https://ko-fi.com/giveawaybot'
              }
            ]
          }
        ]
      })
      .catch((err) => this.logger.error(err));
    return;
  }
  @On('interactionCreate')
  @UseGuards(IsButtonInteractionGuard)
  async onModuleSubmit(button: ButtonInteraction) {
    if (!button.customId?.startsWith('help.')) return;
    const [_, action, userID] = button.customId.split('.');
    if (userID !== button.user.id) return;
    const actions = [
      'commands',
      'information',
      'giveaways',
      'feedback',
      'support'
    ];
    const currentlySelected = button.message.components
      .at(0)
      ?.components.find(
        (x) =>
          x.type === ComponentType.Button && x.style === ButtonStyle.Primary
      );
    if (currentlySelected?.customId?.split('.')[1] === action) return;
    if (actions.includes(action)) {
      const guildDoc = await this.guildService.getLocalization(button.guildId);
      const region = guildDoc
        ? guildDoc
        : button.guild?.preferredLocale == 'ru'
        ? 'ru'
        : 'en';
      try {
        const embed = await this.getEmbed(
          action,
          locale[region],
          button.guild?.id
        );
        if (!embed) return;
        const newComponents = button.message.components[0].components.map(
          (component) => {
            if (component.type !== ComponentType.Button) return;
            const tempComponent = component;
            return {
              label: tempComponent.label,
              customId:
                tempComponent.style === ButtonStyle.Link
                  ? undefined
                  : tempComponent.customId,
              type: tempComponent.type,
              style:
                action === tempComponent.customId?.split('.')[1]
                  ? ButtonStyle.Primary
                  : tempComponent.style === ButtonStyle.Link
                  ? ButtonStyle.Link
                  : ButtonStyle.Secondary,
              disabled: tempComponent.disabled,
              url: tempComponent.url
            };
          }
        );
        await button
          .update({
            embeds: [
              {
                ...config.embeds.defaultHelpEmbed,
                image: {
                  url:
                    region === 'ru'
                      ? 'https://cdn.discordapp.com/attachments/980765606364205056/1027880626466070578/give_bot_ru.png'
                      : 'https://cdn.discordapp.com/attachments/980765606364205056/1027880626046640128/give_bot_en.png'
                }
              },
              {
                ...embed,
                footer: {
                  text: locale[region].help.commands.embed.footer()
                },
                image: {
                  url: 'https://cdn.discordapp.com/attachments/980765606364205056/980765983155318805/222.png'
                }
              }
            ],
            components: [
              {
                type: ComponentType.ActionRow,
                components: newComponents as any
              },
              button.message.components[1]
            ]
          })
          .catch((err) => this.logger.error(err));
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
  async getEmbed(
    action: string,
    locale: TranslationFunctions,
    guildID?: string
  ): Promise<APIEmbed | JSONEncodable<APIEmbed> | undefined> {
    switch (action) {
      case 'commands': {
        return {
          color: config.meta.defaultColor,
          description: locale.help.commands.embed.description({
            botID: this.client.user?.id ?? ''
          }),
          fields: [
            {
              name: locale.help.others.title(),
              value:
                this.client.application?.commands.cache
                  .filter((x) =>
                    Object.keys(locale.help.commands.descriptions.others).some(
                      (k) => k === x.name
                    )
                  )
                  .map((x) => {
                    return locale.help.commands.descriptions.others[x.name]({
                      commandID: `${x.name}:${x.applicationId}`
                    });
                  })
                  .join('\n') ?? '',
              inline: false
            },
            {
              name: locale.help.giveaway.title(),
              value:
                this.client.application?.commands.cache
                  .filter((x) =>
                    Object.keys(
                      locale.help.commands.descriptions.giveaway
                    ).some((k) => k === x.name)
                  )
                  .map((x) => {
                    return (
                      '<:background:980765434414522398>' +
                      locale.help.commands.descriptions.giveaway[x.name]({
                        commandID: `${x.name}:${x.applicationId}`
                      })
                    );
                  })
                  .join('\n\n') ?? '',
              inline: false
            }
          ]
        };
      }
      case 'information': {
        const devID = '423946555872116758';
        const developerTag =
          this.client.users.cache.get(devID)?.tag ??
          (await this.client.users.fetch(devID).then((x) => x.tag));
        const info = {
          [locale.help.information.embed.fields.name()]: `${this.client.user?.tag}`,
          [locale.help.information.embed.fields.servers()]: `${this.client.guilds.cache.size}`,
          [locale.help.information.embed.fields.users()]: `${this.client.guilds.cache.reduce(
            (a, b) => a + b?.memberCount,
            0
          )}`,
          'Node.js': `${process.version}`,
          [locale.help.information.embed.fields.platform()]: `${process.platform} ${process.arch}`,
          [locale.help.information.embed.fields.memory()]: `**${(
            process.memoryUsage().heapUsed /
            1024 /
            1024
          ).toFixed(2)}** MB / **${(
            process.memoryUsage().heapTotal /
            1024 /
            1024
          ).toFixed(2)}** MB`,
          [locale.help.information.embed.fields.active()]: `${parseFilteredTimeArray(
            process.uptime() * 1000,
            { bold: true }
          ).join('. ')}`
        };
        return {
          color: config.meta.defaultColor,
          title: locale.help.information.embed.title(),
          description: locale.help.information.embed.description({
            devID,
            devTag: developerTag ?? ''
          }),
          footer: {
            text: locale.help.information.embed.footer()
          },
          fields: Object.entries(info).map(([key, value]) => {
            return {
              name: key + ':',
              value: value,
              inline: true
            };
          })
        };
      }
      case 'giveaways': {
        if (!guildID) return;
        const documents = await this.giveawayService.getServerGiveawayObjects(
          guildID ?? '',
          true,
          false
        );
        return {
          color: config.meta.defaultColor,
          title: locale.help.giveaways.title(),
          description: locale.help.giveaways.description({
            count: documents.length
          }),

          fields: !documents.length
            ? [
                {
                  name: locale.help.giveaways.fields.noGiveaways.name(),
                  value: locale.help.giveaways.fields.noGiveaways.value()
                }
              ]
            : documents.map((document) => {
                return {
                  name: locale.help.giveaways.fields.activeGiveaways.name({
                    prize: document.prize
                  }),
                  value: locale.help.giveaways.fields.activeGiveaways.value({
                    accessCondition: document.accessCondition,
                    count: document.participants.length,
                    creatorID: document.creatorID,
                    ending: Math.round(document.endDate / 1000)
                  }),
                  inline: false
                };
              })
        };
      }
      default:
        undefined;
    }
  }
}
