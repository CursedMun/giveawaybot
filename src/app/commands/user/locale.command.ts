import { TransformPipe } from '@discord-nestjs/common';
import { Command, DiscordCommand, UsePipes } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import locale from '@src/i18n/i18n-node';
import { MongoGuildService } from '@src/schemas/mongo/guild/guild.service';
import { CommandInteraction } from 'discord.js';

@Injectable()
@Command({
  name: 'locale',
  dmPermission: false,
  descriptionLocalizations: {
    ru: 'Изменить язык бота ru/en',
    'en-US': 'Change the bot language ru/en'
  },
  defaultMemberPermissions: ['Administrator'],
  description: 'Change the bot language ru/en'
})
@UsePipes(TransformPipe)
export class EndCmd implements DiscordCommand {
  private logger = new Logger(EndCmd.name);
  constructor(private readonly guildService: MongoGuildService) {}
  async handler(command: CommandInteraction) {
    await command
      .deferReply({ ephemeral: true })
      .catch((err) => this.logger.error(err));
    if (!command.guild) return;
    let newRegion = 'ru';
    const guildDoc = await this.guildService.GuildModel.findOne({
      guildID: command.guild.id
    });
    if (!guildDoc) {
      await this.guildService.GuildModel.create({
        guildID: command.guild.id,
        localization: newRegion
      });
    } else {
      newRegion = guildDoc.localization === 'ru' ? 'en' : 'ru';
      const smth = await this.guildService.GuildModel.updateOne(
        { guildID: command.guild.id },
        { localization: newRegion }
      );
      console.log(smth, newRegion);
    }
    await command.followUp({
      embeds: [
        {
          title: locale[newRegion].locale.title(),
          description: locale[newRegion].locale.description(),
          thumbnail: {
            url: command.user.displayAvatarURL()
          }
        }
      ],
      ephemeral: false
    });
  }
}
