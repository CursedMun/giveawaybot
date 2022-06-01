import { PrefixCommandTransformPipe } from "@discord-nestjs/common";
import { InjectDiscordClient, PrefixCommand } from "@discord-nestjs/core";
import { Injectable, UsePipes } from "@nestjs/common";
import { Client, Message } from "discord.js";
import { config } from "src/app/utils/config";
@Injectable()
export class FeedBack {
  constructor(@InjectDiscordClient() private readonly client: Client) {}

  @PrefixCommand({
    name: "fb",
    prefix: "!",
  })
  @UsePipes(PrefixCommandTransformPipe)
  onMessage(message: Message): any {
    const args = message.content.split(" ");
    const reason = args.join(" ");
    console.log(args,reason)
    console.log('test')
    if (!reason) return;
    const guild = this.client.guilds.cache.get(config.ids.devGuild);
    console.log('test')
    if (!guild) return;
    const channel = guild.channels.cache.get(config.ids.feedbackChannel);
    console.log('test')
    if (!channel) return;
    console.log('test')
    if ("send" in channel)
      channel.send(
        `${message.author} отправил своё предложение.\nПредложение: ${reason}`
      );
    return {
      embeds: [{
        color: config.meta.defaultColor,
        description: `Ваше предложение будет рассмотрено в ближайшее время.`,
      }],
    };
  }
}