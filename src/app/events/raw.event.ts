import { InjectDiscordClient, On } from "@discord-nestjs/core";
import { Injectable, Logger } from "@nestjs/common";
import { Client, DMChannel, TextChannel } from "discord.js";

@Injectable()
export class RawEvent {
  constructor(
    @InjectDiscordClient()
    private readonly client: Client
  ) {}
  private readonly logger = new Logger(RawEvent.name);
  private readonly events = {
    MESSAGE_REACTION_ADD: "messageReactionAdd",
    MESSAGE_REACTION_REMOVE: "messageReactionRemove",
  };
  @On("raw")
  async onRaw(event: any): Promise<void> {
    // `event.t` is the raw event name
    if (!this.events.hasOwnProperty(event.t)) return;

    const { d: data } = event;
    const user = this.client.users.cache.get(data.user_id);
    if (!user) return;
    const channel =
      (this.client.channels.cache.get(data.channel_id) as TextChannel) ||
      ((await user.createDM().catch(() => {})) as DMChannel);
    if (!channel) return;
    // if the message is already in the cache, don't re-emit the event
    if (channel.messages.cache.has(data.message_id)) return;

    // if you're on the master/v12 branch, use `channel.messages.fetch()`
    const message = await channel.messages
      .fetch(data.message_id)
      .catch(() => {});
    if (!message) return;
    // custom emojis reactions are keyed in a `name:ID` format, while unicode emojis are keyed by names
    // if you're on the master/v12 branch, custom emojis reactions are keyed by their ID
    const emojiKey = data.emoji.id
      ? `${data.emoji.name}:${data.emoji.id}`
      : data.emoji.name;
    const reaction = message.reactions.cache.get(emojiKey);

    this.client.emit(this.events[event.t], reaction, user);
  }
}
