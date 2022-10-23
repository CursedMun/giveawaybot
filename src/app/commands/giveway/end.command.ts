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
import locale from '@src/i18n/i18n-node';
class EndDto {
  // @Transform(({ value }) => value.toUpperCase())
  @Param({
    name: 'messageid',
    descriptionLocalizations: {
      'en-US': 'The message ID to end the giveaway',
      ru: 'ID сообщения для завершения розыгрыша'
    },
    description: 'The message ID to end the giveaway',
    required: false
  })
  messageID: string;
}
@Injectable()
@Command({
  name: 'end',
  dmPermission: false,
  descriptionLocalizations: {
    ru: 'Закончить указанный розыгрыш',
    'en-US': 'End a giveaway'
  },
  defaultMemberPermissions: ['Administrator'],
  description: 'End a giveaway'
})
@UsePipes(TransformPipe)
export class EndCmd implements DiscordTransformedCommand<EndDto> {
  private logger = new Logger(EndCmd.name);
  constructor(private readonly giveawayService: GiveawayService) {}
  async handler(
    @Payload() dto: EndDto,
    { interaction }: TransformedCommandExecutionContext
  ) {
    await interaction
      .deferReply({ ephemeral: true })
      .catch((err) => this.logger.error(err));
    const messageID = dto.messageID;
    const guild = interaction.guild;
    if (!guild) return;
    const reply = async (text: string) => {
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
    const guildGiveaways = await this.giveawayService.giveawayService.find(
      {
        guildID: guild.id,
        ended: false
      },
      true
    );
    if (!guildGiveaways.length) {
      reply(locale.en.errors.noServerGiveaways());
      return;
    }
    const giveaway = messageID
      ? guildGiveaways.find((g) => g.messageID === messageID) ??
        guildGiveaways.find((g) => g.channelID === messageID)
      : guildGiveaways[0];

    if (!giveaway || giveaway.ended) {
      reply(locale.en.errors.noFoundGiveaways());
      return;
    }

    await this.giveawayService.endGiveaway(giveaway.ID);
    await interaction.followUp({
      embeds: [
        {
          description: locale.en.giveaway.end.response()
        }
      ],
      ephemeral: false
    });
  }
}
