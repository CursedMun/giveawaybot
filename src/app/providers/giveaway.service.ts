import { InjectDiscordClient } from "@discord-nestjs/core";
import { Injectable, Logger } from "@nestjs/common";
import {
  Client,
  Guild,
  Message,
  MessageEmbedOptions,
  SnowflakeUtil,
  TextChannel,
} from "discord.js";
import {
  Giveaway,
  GiveawayAccessСondition,
  GiveawayCondition,
} from "src/schemas/mongo/giveaway/giveaway.schema";
import { MongoGiveawayService } from "src/schemas/mongo/giveaway/giveaway.service";
import { config } from "../utils/config";
import Timer from "../utils/timer";
import { parseFilteredTimeArray } from "../utils/utils";
export interface GiveawayCreationData {
  prize: string;
  endTime: number;
  winnersCount: number;
  channel: TextChannel;
  access_condition: GiveawayAccessСondition;
  condition: GiveawayCondition;
  creatorID: string;
}
@Injectable()
export class GiveawayService {
  private readonly logger = new Logger(GiveawayService.name);
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly giveawayService: MongoGiveawayService
  ) {}
  async check() {
    const docs = await this.giveawayService.find({});
    for (const doc of docs) {
      try {
        const guild =
          this.client.guilds.cache.get(doc.guildID) ??
          (await this.client.guilds.fetch(doc.guildID));
        if (!guild) {
          await this.giveawayService.deleteOne({ ID: doc.ID });
          continue;
        }
        const channel =
          (guild.channels.cache.get(doc.channelID) as TextChannel) ??
          ((await guild.channels.fetch(doc.channelID)) as TextChannel);
        if (!channel) {
          await this.giveawayService.deleteOne({ ID: doc.ID });
          continue;
        }
        const message =
          channel.messages.cache.get(doc.messageID) ??
          (await channel.messages.fetch(doc.messageID));
        new Timer(
          doc.end_date * 1e3,
          () => {
            this.updateTimer(message, doc.end_date * 1e3);
          },
          config.ticks.tenSeconds / 2
        );
        new Timer(
          doc.end_date * 1e3,
          () => {
            this.endGiveaway(doc.ID);
          },
          config.ticks.oneHour
        );
      } catch (err) {
        this.logger.error(err);
      } finally {
        continue;
      }
    }
  }
  updateTimer(message: Message, endTime: number) {
    if (!message || message.editable) return;
    const fields = message.embeds[0].fields;
    fields[2].value = `\`\`\`\n${parseFilteredTimeArray(
      endTime - Date.now()
    )}\`\`\``;
    const newEmbed = {
      ...message.embeds[0],
      fields: fields,
    };
    return message.edit({
      embeds: [newEmbed as MessageEmbedOptions],
    });
  }
  async endGiveaway(ID: string) {
    const getWinners = async (
      message: Message,
      doc: Giveaway,
      winnerCount: number
    ) => {
      const guild = message.guild as Guild;
      const winners: string[] = [];
      const usersSet = new Set(doc.participants);
      if (this.client.user) usersSet.delete(this.client.user.id);
      const users = Array.from(usersSet).filter((id) => {
        const member = guild.members.cache.get(id);
        return member && doc.condition === "voice"
          ? member.voice.channel != null
          : true;
      });
      for (let i = 0; i < winnerCount; i++) {
        const winner = users.splice(Math.random() * users.length, 1)[0];
        winners.push(winner);
      }
      return winners;
    };
    try {
      const doc = await this.giveawayService.findOne({ ID });
      if (!doc) return;

      const channel =
        (this.client.channels.cache.get(doc.channelID) as TextChannel) ??
        ((await this.client.channels.fetch(doc.channelID)) as TextChannel);
      if (!channel) return;

      const message =
        channel.messages.cache.get(doc.messageID) ??
        (await channel.messages.fetch(doc.messageID));
      if (!message) return;

      const [embed] = message.embeds;
      if (!embed) return;
      if (embed.fields) delete embed.fields[0];
      const winners = await getWinners(message, doc, doc.winnerCount);
      const fields = [
        {
          name: `Победител${doc.winnerCount > 1 ? "и" : "ь"}:`,
          value: winners.map((id) => `<@${id}>`).join("\n"),
          inline: true,
        },
        {
          name: "Организатор",
          value: `<@${doc.creatorID}>`,
          inline: true,
        },
      ];
      //TODO send message to the winner's dm
      await Promise.allSettled([
        message.delete(),
        message.channel.send({
          content: `**РОЗЫГРЫШ ЗАКОНЧЕН!**`,
          embeds: [
            Object.assign({}, embed, {
              description: undefined,
              fields,
              footer: { text: "Розыгрыш закончен" },
              timestamp: new Date(),
              thumbnail: {
                url: "https://cdn.discordapp.com/attachments/877327839022710894/917855988479062026/1.png",
              },
            }),
          ],
        }),
      ]);
    } catch (err) {
      this.logger.error(err);
    } finally {
      await this.giveawayService.deleteOne({ ID });
    }
  }
  async createGiveaway(data: GiveawayCreationData) {
    const {
      prize,
      endTime,
      winnersCount,
      channel,
      access_condition,
      condition,
      creatorID,
    } = data;
    const id = SnowflakeUtil.generate();
    let doc = {
      ID: id,
      accessCondition: access_condition,
      condition,
      channelID: channel.id,
      messageID: '',
      creatorID,
      endDate: Math.floor(endTime / 1e3),
      participants: [],
      guildID: channel.guild.id,
      winnerCount: winnersCount,    
    }
    
    const message = await channel.send({
      embeds: [
        {
          title: `Розыгрыш: ${prize}`,
          description: `До конца розыгрыша осталось:`,
          fields: [
            {
              name: "Победители:",
              value: `\`\`\`\n${parseFilteredTimeArray(
                doc.endDate - Date.now()
              )}\`\`\``,
              inline: true,
            },
            {
              name: "Организатор",
              value: `<@${this.client.user?.id}>`,
              inline: true,
            },
          ],
          footer: { text: "Розыгрыш начался" },
          timestamp: new Date(),
          thumbnail: {
            url: "https://cdn.discordapp.com/attachments/877327839022710894/917855988479062026/1.png",
          },
        },
      ],
      components:
        access_condition == "button"
          ? [
              {
                type: "ACTION_ROW",
                components: [
                  {
                    customId: `giveaway.join.${id}`,
                    type: "BUTTON",
                    label: "Участвовать",
                    style: "PRIMARY",
                  },
                  {
                    customId: `giveaway.list.${id}`,
                    type: "BUTTON",
                    label: "Участвовать",
                    style: "PRIMARY",
                  }
                ],
              },
            ]
          : undefined,
    });
    if(access_condition === 'reaction')
      await message.react(config.emojis.giveaway);
    doc = {
      ...doc,
      messageID: message.id,
    }
    await this.giveawayService.create(doc);
  }
  // actions: SponsorActions = {
  //   add: (data: SponsorActionsData) =>
  //     this.add(data.interaction as ButtonInteraction),
  //   delete: (data: SponsorActionsData) =>
  //     this.remove(data.interaction as ButtonInteraction),
  //   edit: (data: SponsorActionsData) =>
  //     this.editRole(data.interaction as ButtonInteraction),
  //   select: (data: SponsorActionsData) =>
  //     this.genProfile(
  //       data.interaction as CommandInteraction | SelectMenuInteraction,
  //       data.target!
  //     ),
  // };
}
