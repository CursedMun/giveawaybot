import { Command, DiscordCommand, On } from '@discord-nestjs/core';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  CacheType,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  Modal,
  ModalSubmitInteraction,
  TextChannel,
} from 'discord.js';
import { TextInputStyles } from 'discord.js/typings/enums';
import { GiveawayService } from 'src/app/providers/giveaway.service';
import { config } from 'src/app/utils/config';
import { IsModalInteractionGuard } from 'src/app/utils/guards/is-modal-interaction.guard';
import { msConvert } from 'src/app/utils/utils';
import {
  GiveawayAccessСondition,
  GiveawayCondition,
} from 'src/schemas/mongo/giveaway/giveaway.schema';

@Injectable()
@Command({
  name: 'gs',
  description: 'Начать розыгрыш?',
})
export class GiveawayStartCommand implements DiscordCommand {
  private readonly logger = new Logger(GiveawayStartCommand.name);
  private readonly gsModalID = 'giveawaystartmodal';
  private readonly prizeModalID = 'prize';
  private readonly timeModalID = 'time';
  private readonly winnerscountModalID = 'winnerscount';
  private readonly channelModalID = 'channel';
  constructor(private readonly giveawayService: GiveawayService) {}

  async handler(interaction: CommandInteraction): Promise<any> {
    try {
      if (!interaction.memberPermissions?.has('ADMINISTRATOR')) {
        return {
          embeds: [
            {
              color: config.meta.defaultColor,
              description: 'Недостаточно прав для использования команды',
              fields: [
                {
                  name: 'Нужные права',
                  value: '` ⚪ Администратор ` ` Вкл `',
                },
              ],
            },
          ],
          ephemeral: true,
        };
      }
      const modal = new Modal({
        customId: this.gsModalID,
        title: 'Запрос на участие',
        components: [
          {
            type: 'ACTION_ROW',
            components: [
              {
                type: 'TEXT_INPUT',
                customId: this.prizeModalID,
                label: 'Приз',
                style: TextInputStyles.SHORT,
                required: true,
                maxLength: 250,
              },
            ],
          },
          {
            type: 'ACTION_ROW',
            components: [
              {
                type: 'TEXT_INPUT',
                customId: this.timeModalID,
                label: 'Длительность розыгрыша (1d|1h|1m|1s)',
                style: TextInputStyles.SHORT,
                required: true,
                maxLength: 10,
              },
            ],
          },
          {
            type: 'ACTION_ROW',
            components: [
              {
                type: 'TEXT_INPUT',
                customId: this.winnerscountModalID,
                label: 'Кол-во победителей (максимум 20)',
                style: TextInputStyles.SHORT,
                required: true,
                maxLength: 20,
              },
            ],
          },
          {
            type: 'ACTION_ROW',
            components: [
              {
                type: 'TEXT_INPUT',
                customId: this.channelModalID,
                label: 'Название или id канала',
                value:
                  (interaction.channel as TextChannel)?.name ??
                  interaction.channelId,
                style: TextInputStyles.SHORT,
                required: true,
                maxLength: 100,
              },
            ],
          },
        ],
      });

      await interaction.showModal(modal);
    } catch (err) {
      this.logger.error(err);
    } finally {
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
              iconURL: modal.user.avatarURL({ dynamic: true }) || undefined,
            },
          },
        ],
      });
    };
    const [prize, time, winnersCount, channel] = [
      modal.fields.getTextInputValue(this.prizeModalID),
      modal.fields.getTextInputValue(this.timeModalID),
      parseInt(modal.fields.getTextInputValue(this.winnerscountModalID)) ?? 0,
      modal.fields.getTextInputValue(this.channelModalID),
    ];
    const msduration = msConvert(time.toLowerCase());
    if (typeof msduration !== 'number' || msduration > config.ticks.oneWeek * 2)
      return await reply('Неверно указано время');
    const giveawayChannel = (modal.guild.channels.cache.get(channel) ||
      modal.guild.channels.cache.find((x) => x.name == channel)) as TextChannel;
    if (!giveawayChannel) return await reply('Неверно указан канал');
    if (
      !giveawayChannel
        .permissionsFor(modal.client.user?.id ?? '')
        ?.has('SEND_MESSAGES')
    )
      return await reply('Недостаточно прав для отправки сообщений в канал');
    if (typeof winnersCount !== 'number' || winnersCount > 20)
      return await reply('Неверно указано кол-во победителей');
    let message: Message;
    try {
      message = (await modal.reply({
        embeds: [
          {
            title: 'Уточним...',
            color: config.meta.defaultColor,
            description: [
              `Приз: **${prize}**`,
              `Время: **${time}**`,
              `Кол-во победителей: **${winnersCount}**`,
              `Канал: ${giveawayChannel}`,
            ].join('\n'),
            thumbnail: {
              url: 'https://media.discordapp.net/attachments/980765606364205056/980766567069528104/1.png',
            },
          },
        ],
        components: config.embeds.confirmEmbed.components,
        fetchReply: true,
      })) as Message;
      const response = await message.awaitMessageComponent({
        filter: (interaction: MessageComponentInteraction<CacheType>) => {
          if (interaction.message.id != message.id) return false;
          if (interaction.member?.user.id != modal.user.id) return false;
          return true;
        },
        componentType: 'BUTTON',
        time: config.ticks.oneMinute * 10,
      });
      if (!response || response.customId === 'reject') return;
      const options = [
        'Нажатие реакции',
        'Нажатие реакции + зайти в войс',
        'Нажатие кнопки',
        'Нажатие кнопки + зайти в войс',
      ];
      const emojis = [
        '980134978190983188',
        '980135630803726346',
        '980136293012996106',
        '980136291767320606',
      ];
      const optionsJson: {
        access_condition: GiveawayAccessСondition;
        condition: GiveawayCondition;
      }[] = [
        { access_condition: 'reaction', condition: 'novoice' },
        { access_condition: 'reaction', condition: 'voice' },
        { access_condition: 'button', condition: 'novoice' },
        { access_condition: 'button', condition: 'voice' },
      ];
      await response.update({
        embeds: [
          {
            title: 'Для начала',
            color: config.meta.defaultColor,
            thumbnail: {
              url: response.user.avatarURL({ dynamic: true, size: 1024 }) || '',
            },
            description:
              'Чтобы продолжить **создание розыгрыша** выберите ниже **одно** из **условий**.',
          },
        ],
        components: [
          {
            type: 'ACTION_ROW',
            components: [
              {
                customId: 'select.condition',
                type: 'SELECT_MENU',
                placeholder: 'Варианты условий',
                emoji: '1014108607098404925',
                options: options.map((option, index) => {
                  return {
                    label: `${index + 1} вариант`,
                    value: index.toString(),
                    description: option,
                    emoji: emojis[index],
                  };
                }),
              },
            ],
          },
        ],
      });
      const conditionResponse = await message.awaitMessageComponent({
        filter: (interaction: MessageComponentInteraction<CacheType>) => {
          if (interaction.message.id != message.id) return false;
          if (interaction.member?.user.id != modal.user.id) return false;
          return true;
        },
        componentType: 'SELECT_MENU',
        time: config.ticks.oneMinute * 10,
      });
      if (!conditionResponse) return;
      this.giveawayService.createGiveaway({
        prize,
        endTime: Date.now() + msduration,
        winnersCount,
        creatorID: modal.user.id,
        channel: giveawayChannel,
        ...optionsJson[conditionResponse.values[0]],
      });
    } catch (err) {
      this.logger.error(err);
    } finally {
      message!?.delete().catch((err) => {
        this.logger.error('Не удалось удалить сообщение');
      });
    }
  }
}
