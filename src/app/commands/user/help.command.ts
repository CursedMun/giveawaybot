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
    private readonly giveawayService: GiveawayService
  ) {}
  async handler(command: CommandInteraction) {
    await command.deferReply().catch((err) => this.logger.error(err));
    await command
      .editReply({
        embeds: [
          config.embeds.defaultHelpEmbed,
          (await this.getEmbed('commands')) ?? {}
        ],
        components: config.embeds.helpEmbed(command.user.id).components
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
      try {
        // await button.deferUpdate().catch((err) => this.logger.error('two'));
        const embed = await this.getEmbed(action, button.guild?.id);
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
            embeds: [config.embeds.defaultHelpEmbed, embed],
            components: [
              {
                type: ComponentType.ActionRow,
                components: newComponents as any
              }
            ]
          })
          .catch((err) => this.logger.error(err));
      } catch (e) {
        console.error('five');
      }
    }
    // const action = button.customId;
    // const availableActions =
    //   (config.embeds.helpEmbed as any).components[0].components.map((x) => x.customId);
  }
  async getEmbed(
    action: string,
    guildID?: string
  ): Promise<APIEmbed | JSONEncodable<APIEmbed> | undefined> {
    switch (action) {
      case 'commands': {
        return {
          color: config.meta.defaultColor,
          description: locale.en.help.commands.embed.description({
            botID: this.client.user?.id ?? ''
          }),
          image: {
            url: 'https://cdn.discordapp.com/attachments/980765606364205056/980765983155318805/222.png'
          },
          fields: [
            {
              name: locale.en.help.others.title(),
              value:
                this.client.application?.commands.cache
                  .filter((x) =>
                    Object.keys(
                      locale.en.help.commands.descriptions.others
                    ).some((k) => k === x.name)
                  )
                  .map((x) => {
                    console.log(x.name);

                    return locale.en.help.commands.descriptions.others[x.name]({
                      commandID: `${x.name}:${x.applicationId}`
                    });
                  })
                  .join('\n') ?? '',
              inline: false
            },
            {
              name: locale.en.help.giveaway.title(),
              value:
                this.client.application?.commands.cache
                  .filter((x) =>
                    Object.keys(
                      locale.en.help.commands.descriptions.giveaway
                    ).some((k) => k === x.name)
                  )
                  .map((x) => {
                    console.log(x.name);
                    return (
                      '<:background:980765434414522398>' +
                      locale.en.help.commands.descriptions.giveaway[x.name]({
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
        const developerTag =
          this.client.users.cache.get('423946555872116758')?.tag ??
          (await this.client.users
            .fetch('423946555872116758')
            .then((x) => x.tag));
        const info = {
          'Название:': `${this.client.user?.tag}`,
          'Сервера:': `${this.client.guilds.cache.size}`,
          'Пользователи:': `${this.client.guilds.cache.reduce(
            (a, b) => a + b?.memberCount,
            0
          )}`,
          'Node.js:': `${process.version}`,
          'Платформа:': `${process.platform} ${process.arch}`,
          'Память:': `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
            2
          )} MB / ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(
            2
          )} MB`,
          'Онлайн:': `${parseFilteredTimeArray(process.uptime() * 1000).join(
            ':'
          )}`
        };
        return {
          color: config.meta.defaultColor,
          title: 'Информация',
          description: [
            '\n\nРазработчик <@423946555872116758>',
            '[`423946555872116758`]',
            developerTag ?? ''
          ].join('\n'),
          fields: Object.entries(info).map(([key, value]) => {
            return {
              name: key,
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
          false
        );
        return {
          color: config.meta.defaultColor,
          title: `Активные розыгрыши`,
          description: `Количество розыгрешей: ${documents.length}\n\n`,
          fields: !documents.length
            ? [
                {
                  name: 'Пусто',
                  value:
                    'Активных розгрышей нет начните новой с помощью команды /gs'
                }
              ]
            : documents.map((document) => {
                return {
                  name: `Приз ${document.prize}`,
                  value: [
                    `Количество участников: ${document.participants.length}`,
                    `Организатор: <@${document.creatorID}>`,
                    `Окончание: <t:${Math.round(document.endDate / 1000)}:R>`
                  ].join('\n'),
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
