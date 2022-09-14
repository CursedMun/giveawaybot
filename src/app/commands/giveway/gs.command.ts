import { Command, DiscordCommand, On } from '@discord-nestjs/core';
import {
  GiveawayAccessСondition,
  GiveawayCondition
} from '@mongo/giveaway/giveaway.schema';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { GiveawayService } from '@providers/giveaway.service';
import { config } from '@utils/config';
import { IsModalInteractionGuard } from '@utils/guards/is-modal-interaction.guard';
import { msConvert } from '@utils/utils';
import {
  CacheType,
  CommandInteraction,
  ComponentType,
  Message,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  TextChannel,
  TextInputStyle
} from 'discord.js';
import locale from 'src/i18n/i18n-node';

@Injectable()
@Command({
  name: 'gs',
  description: 'Начать розыгрыш?/Start a giveaway?'
})
export class GiveawayStartCommand implements DiscordCommand {
  private readonly logger = new Logger(GiveawayStartCommand.name);
  private readonly gsModalID = 'giveawaystartmodal';
  private readonly prizeModalID = 'prize';
  private readonly timeModalID = 'time';
  private readonly winnerscountModalID = 'winnerscount';
  private readonly channelModalID = 'channel';
  constructor(private readonly giveawayService: GiveawayService) {}

  async handler(interaction: CommandInteraction) {
    try {
      if (!interaction.memberPermissions?.has('Administrator')) {
        return {
          embeds: [
            {
              color: config.meta.defaultColor,
              description: locale.en.errors.noPerms.description(),
              fields: [
                {
                  name: locale.en.errors.noPerms.field(),
                  value: locale.en.errors.noPerms.value({
                    perm: locale.en.admin()
                  })
                }
              ]
            }
          ],
          ephemeral: true
        };
      }

      await interaction.showModal({
        customId: this.gsModalID,
        title: locale.en.giveaway.modal.title(),
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.prizeModalID,
                label: locale.en.giveaway.modal.prize(),
                style: TextInputStyle.Short,
                required: true,
                maxLength: 250
              }
            ]
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.timeModalID,
                label: locale.en.giveaway.modal.duration(),
                style: TextInputStyle.Short,
                required: true,
                maxLength: 10
              }
            ]
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.winnerscountModalID,
                label: locale.en.giveaway.modal.winnersCount(),
                style: TextInputStyle.Short,
                required: true,
                maxLength: 20
              }
            ]
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.channelModalID,
                label: locale.en.giveaway.modal.channel(),
                value:
                  (interaction.channel as TextChannel)?.name ??
                  interaction.channelId,
                style: TextInputStyle.Short,
                required: true,
                maxLength: 100
              }
            ]
          }
        ]
      });
    } catch (err) {
      this.logger.error(err);
    }
  }
  @On('interactionCreate')
  @UseGuards(IsModalInteractionGuard)
  async onModuleSubmit(modal: ModalSubmitInteraction) {
    this.logger.log(`Modal ${modal.customId} submit`);

    if (modal.customId !== this.gsModalID || !modal.guild) return;
    const reply = async (text: string) => {
      return await modal.reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            author: {
              name: text,
              icon_url: modal.user.avatarURL() || ''
            }
          }
        ]
      });
    };
    const [prize, time, winnersCount, channel] = [
      modal.fields.getTextInputValue(this.prizeModalID),
      modal.fields.getTextInputValue(this.timeModalID),
      parseInt(modal.fields.getTextInputValue(this.winnerscountModalID)) ?? 0,
      modal.fields.getTextInputValue(this.channelModalID)
    ];
    const msduration = msConvert(time.toLowerCase());
    if (typeof msduration !== 'number' || msduration > config.ticks.oneWeek * 2)
      return await reply(locale.en.errors.noInput.time());
    const giveawayChannel = (modal.guild.channels.cache.get(channel) ||
      modal.guild.channels.cache.find((x) => x.name == channel)) as TextChannel;
    if (!giveawayChannel)
      return await reply(locale.en.errors.noInput.channel());
    if (
      !giveawayChannel
        .permissionsFor(modal.client.user?.id ?? '')
        ?.has('SendMessages')
    )
      return await reply(locale.en.errors.noSendMessagePerm());
    if (
      typeof winnersCount !== 'number' ||
      winnersCount > 20 ||
      isNaN(winnersCount)
    )
      return await reply(locale.en.errors.noInput.winnersCount());
    const message = (await modal
      .reply({
        embeds: [
          {
            title: 'Уточним...',
            color: config.meta.defaultColor,
            description: [
              locale.en.giveaway.modalReply.description({
                type: 'Приз',
                description: `**${prize}**`
              }),
              locale.en.giveaway.modalReply.description({
                type: 'Время',
                description: `**${time}**`
              }),
              locale.en.giveaway.modalReply.description({
                type: 'Кол-во победителей',
                description: `**${winnersCount}**`
              }),
              locale.en.giveaway.modalReply.description({
                type: 'Канал',
                description: `${giveawayChannel}`
              })
            ].join('\n'),
            thumbnail: {
              url: 'https://media.discordapp.net/attachments/980765606364205056/980766567069528104/1.png'
            }
          }
        ],
        components: config.embeds.confirmEmbed.components,
        fetchReply: true
      })
      .catch(() => null)) as Message | null;
    if (!message) return;
    try {
      const response = await message.awaitMessageComponent({
        filter: (interaction: MessageComponentInteraction<CacheType>) => {
          if (interaction.message.id != message.id) return false;
          if (interaction.member?.user.id != modal.user.id) return false;
          return true;
        },
        componentType: ComponentType.Button,
        time: config.ticks.oneMinute * 10
      });
      if (!response || response.customId === 'reject') return;
      const options = Object.values(locale.en.giveaway.conditions).map((x) =>
        x()
      );
      const emojis = [
        '980134978190983188',
        '980135630803726346',
        '980136293012996106',
        '980136291767320606'
      ];
      const optionsJson: {
        access_condition: GiveawayAccessСondition;
        condition: GiveawayCondition;
      }[] = [
        { access_condition: 'reaction', condition: 'novoice' },
        { access_condition: 'reaction', condition: 'voice' },
        { access_condition: 'button', condition: 'novoice' },
        { access_condition: 'button', condition: 'voice' }
      ];
      await response.update({
        embeds: [
          {
            title: locale.en.giveaway.response.title(),
            color: config.meta.defaultColor,
            thumbnail: {
              url: response.user.displayAvatarURL() || ''
            },
            description: locale.en.giveaway.response.description()
          }
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                customId: 'select.condition',
                type: ComponentType.SelectMenu,
                placeholder: locale.en.giveaway.response.options(),
                emoji: '<:point:1014108607098404925>',
                options: options.map((option, index) => {
                  return {
                    label: `${index + 1} ${locale.en.default.option()}`,
                    value: index.toString(),
                    description: option,
                    emoji: emojis[index]
                  };
                })
              }
            ]
          }
        ]
      });
      const conditionResponse = await message.awaitMessageComponent({
        filter: (interaction: MessageComponentInteraction<CacheType>) => {
          if (interaction.message.id != message.id) return false;
          if (interaction.member?.user.id != modal.user.id) return false;
          return true;
        },
        componentType: ComponentType.SelectMenu,
        time: config.ticks.oneMinute * 10
      });
      if (!conditionResponse) return;
      this.giveawayService.createGiveaway({
        prize,
        endTime: Date.now() + msduration,
        winnersCount,
        creatorID: modal.user.id,
        channel: giveawayChannel,
        ...optionsJson[conditionResponse.values[0]]
      });
    } catch (err) {
      this.logger.error(err);
    } finally {
      message?.delete().catch(() => {
        this.logger.error('Не удалось удалить сообщение');
      });
    }
  }
}
