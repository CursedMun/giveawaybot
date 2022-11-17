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
import { MongoGuildService } from '@src/schemas/mongo/guild/guild.service';
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
  constructor(
    private readonly giveawayService: GiveawayService,
    private readonly guildService: MongoGuildService
  ) {}
  async handler(
    @Payload() dto: RerollDto,
    { interaction: command }: TransformedCommandExecutionContext
  ) {
    if (!command.isCommand()) return;
    const guildDoc = await this.guildService.getLocalization(command.guildId);
    const region = guildDoc
      ? guildDoc
      : command.guild?.preferredLocale == 'ru'
      ? 'ru'
      : 'en';

    const { messageID, count } = dto;

    const guild = command.guild;
    if (!guild) return;
    const reply = async (text: string) => {
      await command
        .deferReply({ ephemeral: true })
        .catch((err) => this.logger.error(err));
      try {
        return await command.editReply({
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
      reply(locale[region].errors.noInput.messageID());
      return;
    }
    const giveaway = await this.giveawayService.getGiveawayByMessage(
      guild.id,
      messageID
    );
    if (!giveaway || !giveaway.ended) {
      reply(locale[region].errors.noFoundGiveaways());
      return;
    }

    if (giveaway.participants.length <= 1) {
      reply(locale[region].errors.notEnoughMembers());
      return;
    }
    await command.deferReply({}).catch((err) => this.logger.error(err));
    const winners = await this.giveawayService.getWinners(
      guild,
      giveaway,
      parseInt(count ?? giveaway.winnerCount)
    );
    await this.giveawayService.giveawayService.updateOne(
      { ID: giveaway.ID },
      { winners: winners }
    );
    await command.followUp({
      embeds: [
        {
          description: `${pluralNoun(
            giveaway.winnerCount,
            ...Object.values(locale[region].default.winnersNouns).map((x) =>
              x()
            )
          )}: ${
            winners.length > 0
              ? winners.map((w) => `<@${w.userID}>`).join(', ')
              : ` ${locale[region].default.error()}`
          }`
        }
      ]
    });
  }
}
