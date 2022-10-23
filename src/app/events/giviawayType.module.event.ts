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
    if (!message.guildId) return;
    if (
      this.messagesTimeout[message.author.id] &&
      this.messagesTimeout[message.author.id] > Date.now()
    )
      return;
    else
      this.messagesTimeout[message.author.id] =
        Date.now() + config.ticks.oneMinute / 2;
    const giveaways = await this.giveawayService.getServerGiveaways(
      message.guildId
    );
    if (!giveaways.length) return;
    const docs = (
      await Promise.all(
        giveaways.map((id) =>
          this.giveawayService.giveawayService.findOne({
            ID: id,
            ended: false
          })
        )
      )
    ).filter((x) => x?.additionalCondition === 'type');
    if (!docs.length) return;
    if (
      !docs.some((x) => x?.participants.find((x) => x.ID === message.author.id))
    )
      return;

    this.tempMessages[message.author.id] =
      this.tempMessages[message.author.id] + 1 || 1;
    if (this.tempMessageTimeout) clearTimeout(this.tempMessageTimeout);
    this.tempMessageTimeout = setTimeout(async () => {
      const updates = Object.entries(this.tempMessages)
        .filter(Boolean)
        .map(([k, v]) => {
          return this.giveawayService.giveawayService.GiveawayModel.updateMany(
            {
              ID: { $in: giveaways },
              participants: {
                $elemMatch: { ID: k }
              }
            },
            { $inc: { 'participants.$.number': v } }
          );
        });
      const resp = await Promise.allSettled(updates);
      this.tempMessages = {};
    }, 2000);
  }
}
