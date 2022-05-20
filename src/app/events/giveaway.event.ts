import { On } from "@discord-nestjs/core";
import { Injectable, Logger, UseGuards } from "@nestjs/common";
import {
  ButtonInteraction,
  GuildMember,
  MessageReaction,
  User,
  VoiceState,
} from "discord.js";
import { GiveawayService } from "../providers/giveaway.service";
import { config } from "../utils/config";
import { IsButtonInteractionGuard } from "../utils/guards/is-button-interaction.guard";
import Book, { PageCallback } from "../utils/navigation/Book";

@Injectable()
export class ClientGateway {
  constructor(private readonly giveawayService: GiveawayService) {}
  private readonly logger = new Logger(ClientGateway.name);
  //on interaction create
  @On("interactionCreate")
  @UseGuards(IsButtonInteractionGuard)
  async onInteractionCreate(button: ButtonInteraction): Promise<void> {
    const [name, action, giveawayID] = button.customId.split(".") as [
      string,
      "join" | "list",
      string
    ];
    if (name != "giveaway") return;
    await button
      .deferReply({ ephemeral: true })
      .catch((err) => this.logger.error(err.message));
    if (action == "join") {
      const response = await this.giveawayService.onJoin(
        button.member as GuildMember,
        giveawayID
      );
      return await button.reply({
        embeds: [
          {
            title: response.reason,
            description: response.success.toString(),
          },
        ],
      });
    } else if (action == "list") {
      const list = await this.giveawayService.listMembers(giveawayID);
      const pageConstructor: PageCallback = (page: number) => {
        const documentsCount = list.length;
        const pageCount = Math.ceil(documentsCount / 10);
        const currentIndex = Math.max(0, Math.min(page, documentsCount - 1));
        const documents = list.slice(10 * (page - 1), 10 * page);
        const text = documents.length > 0 ? documents.join("\n") : "Пусто...";
        return {
          currentIndex,
          message: {
            embeds: [
              {
                title: "Забаненые пользователи",
                color: config.meta.defaultColor,
                fields: [
                  {
                    name: "Дата⠀⠀⠀ ⠀ | Время | ID⠀⠀⠀ ⠀⠀⠀⠀⠀⠀⠀ ⠀ | Тэг",
                    value: text,
                  },
                ],
                footer: {
                  text: `${button.user.tag} | Страница ${
                    currentIndex + 1
                  }/${pageCount}`,
                  icon_url:
                    button.user.avatarURL({ dynamic: true }) || undefined,
                },
              },
            ],
          },
          pageCount: pageCount,
        };
      };
      new Book(await pageConstructor(0), button, {
        pageCallback: pageConstructor,
        filter: () => true,
        collectorOptions: { time: 60_000 },
      });
    }
  }
  //on emoji add
  @On("messageReactionAdd")
  async onReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    const giveAway = await this.giveawayService.getGiveawayByChannel(
      reaction.message.channel.id
    );
    if (!giveAway) return;
    if (reaction.emoji.name == config.emojis.giveaway) {
      const member =
        reaction.message.guild!.members.cache.get(user.id) ??
        (await reaction.message.guild!.members.fetch(user.id));
      if (!member.voice.channel) {
        await reaction.users.remove(user.id);
        return;
      }
      const response = await this.giveawayService.onJoin(member, giveAway.ID);
      if (!response.success) await reaction.users.remove(user.id);
    }
  }
  //on channel enter
  @On("voiceStateUpdate")
  async onChannelEnter(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    //Join
    if (!oldState.channel && newState.channel) {
      const giveaways = await this.giveawayService.getServerGiveaways(
        newState.guild.id
      );
      if (!giveaways) return;
      const docs = await Promise.all(
        giveaways.map((id) => this.giveawayService.getGiveaway(id))
      );
      if (!docs.length) return;
      if (!docs.some((giveaway) => giveaway?.condition === "voice")) return;
      await newState.member!.send("hello");
      setTimeout(async () => {
        const member = await oldState.guild.members.fetch(newState.member!.id);
        if (member.voice.channel) return;
        //remove this user from all the giveaways
        await Promise.allSettled(
          docs.map(
            (giveaway) =>
              giveaway!.condition == "voice" &&
              this.giveawayService.onLeave(newState.member!, giveaway!.ID)
          )
        );
      }, config.ticks.tenSeconds);
    }
    //TODO Leave
    else if (oldState.channel && !newState.channel) {
    }
  }
}
