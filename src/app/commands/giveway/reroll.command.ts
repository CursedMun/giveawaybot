import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordTransformedCommand,
  Param,
  Payload,
  TransformedCommandExecutionContext,
  UsePipes
} from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { GiveawayService } from '@src/app/providers/giveaway.service';
import { config } from '@src/app/utils/config';
import { pluralNoun } from '@src/app/utils/utils';
import locale from '@src/i18n/i18n-node';
class RerollDto {
  // @Transform(({ value }) => value.toUpperCase())
  @Param({
    name: 'messageid',
    descriptionLocalizations: {
      'en-US': 'The message ID to reroll',
      ru: 'ID сообщения для реролла'
    },
    description: 'The message ID to reroll',
    required: true
  })
  messageID: string;
  @Param({
    name: 'count',
    descriptionLocalizations: {
      'en-US': 'Amount of users to reroll',
      ru: 'Количество пользователей для реролла'
    },
    description: 'Amount of users to reroll',
    required: false
  })
  count: string;
}
@Injectable()
@Command({
  name: 'reroll',
  dmPermission: false,
  descriptionLocalizations: {
    ru: 'Переигрывает указанный розыгрыш',
    'en-US': 'Reroll a giveaway'
  },
  defaultMemberPermissions: ['Administrator'],
  description: 'Reroll a giveaway'
})
@UsePipes(TransformPipe)
export class RerollCmd implements DiscordTransformedCommand<RerollDto> {
  private logger = new Logger(RerollCmd.name);
  constructor(private readonly giveawayService: GiveawayService) {}
  async handler(
    @Payload() dto: RerollDto,
    { interaction }: TransformedCommandExecutionContext
  ) {
    if (!interaction.isCommand()) return;

    const { messageID, count } = dto;

    const guild = interaction.guild;
    if (!guild) return;
    const reply = async (text: string) => {
      await interaction
        .deferReply({ ephemeral: true })
        .catch((err) => this.logger.error(err));
      try {
        return await interaction.editReply({
          embeds: [
            {
              color: config.meta.defaultColor,
              description: text
            }
          ]
        });
      } catch (err) {
        this.logger.warn(err);
      }
    };
    if (!messageID) {
      reply(locale.en.errors.noInput.messageID());
      return;
    }
    const giveaway = await this.giveawayService.getGiveawayByMessage(
      guild.id,
      messageID,
      true
    );
    if (!giveaway || !giveaway.ended) {
      reply(locale.en.errors.noFoundGiveaways());
      return;
    }

    if (giveaway.participants.length <= 1) {
      reply(locale.en.errors.notEnoughMembers());
      return;
    }
    await interaction.deferReply({}).catch((err) => this.logger.error(err));
    const winners = await this.giveawayService.getWinners(
      guild,
      giveaway,
      parseInt(count ?? giveaway.winnerCount)
    );
    await this.giveawayService.giveawayService.GiveawayModel.updateOne(
      { ID: giveaway.ID },
      { winners: winners }
    );
    await interaction.followUp({
      embeds: [
        {
          description: `${pluralNoun(
            giveaway.winnerCount,
            ...Object.values(locale.en.default.winnersNouns).map((x) => x())
          )}: ${
            winners.length > 0
              ? winners.map((w) => `<@${w.userID}>`).join(', ')
              : ` ${locale.en.default.error()}`
          }`
        }
      ]
    });
  }
}
