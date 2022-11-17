import { On } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, Message } from 'discord.js';
import { GiveawayService } from '../providers/giveaway.service';
import { config } from '../utils/config';

@Injectable()
export class GiveawayInviteModule {
  private tempMessages = {} as Record<string, number>;
  private tempMessageTimeout: NodeJS.Timeout | undefined;
  private messagesTimeout = {} as Record<string, number>;
  constructor(private readonly giveawayService: GiveawayService) {}
  private readonly logger = new Logger(GiveawayInviteModule.name);
  @On('messageCreate')
  async onMessage(message: Message): Promise<void> {
    if (message.author.bot || message.channel.type === ChannelType.DM) return;
    if (!message.guild) return;
    if (!this.giveawayService.verifyGuild(message.guild.id)) return;
    if (
      this.messagesTimeout[message.author.id] &&
      this.messagesTimeout[message.author.id] > Date.now()
    )
      return;
    else
      this.messagesTimeout[message.author.id] =
        Date.now() + config.ticks.oneMinute / 2;
    const docs = await this.giveawayService.getServerGiveaways({
      guildID: message.guild.id,
      ended: false,
      additionalCondition: 'type',
      'participants.ID': message.author.id
    });
    if (!docs.length) return;

    this.tempMessages[message.author.id] =
      this.tempMessages[message.author.id] + 1 || 1;
    if (this.tempMessageTimeout) clearTimeout(this.tempMessageTimeout);
    this.tempMessageTimeout = setTimeout(async () => {
      const updates = Object.entries(this.tempMessages)
        .filter(Boolean)
        .map(([k, v]) => {
          return this.giveawayService.giveawayService.updateMany(
            {
              ID: { $in: docs.map((x) => x.ID) },
              participants: {
                $elemMatch: { ID: k }
              }
            },
            { $inc: { 'participants.$.number': v } }
          );
        });
      await Promise.allSettled(updates);
      this.tempMessages = {};
    }, 2000);
  }
}
