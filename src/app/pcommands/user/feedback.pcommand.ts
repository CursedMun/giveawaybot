import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { InjectDiscordClient, PrefixCommand } from '@discord-nestjs/core';
import { Injectable, UsePipes } from '@nestjs/common';
import { config } from '@utils/config';
import { Client, Message } from 'discord.js';
@Injectable()
export class FeedBack {
  constructor(@InjectDiscordClient() private readonly client: Client) {}

  @PrefixCommand({
    name: 'fb'
  })
  @UsePipes(PrefixCommandTransformPipe)
  onMessage(message: Message): any {
    const args = message.content.split(' ');
    const reason = args.join(' ');
    if (!reason) return;
    const guild = this.client.guilds.cache.get(config.ids.devGuild);
    if (!guild) return;
    const channel = guild.channels.cache.get(config.ids.feedbackChannel);
    if (!channel) return;
    if ('send' in channel)
      channel.send(
        `${message.author} отправил своё предложение.\nПредложение: ${reason}`
      );
    return {
      embeds: [
        {
          color: config.meta.defaultColor,
          description: `Ваше предложение будет рассмотрено в ближайшее время.`
        }
      ]
    };
  }
}
