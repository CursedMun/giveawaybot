import { InjectDiscordClient } from "@discord-nestjs/core";
import { Injectable, Logger } from "@nestjs/common";
import {
  Client,
  Guild,
  GuildMember,
  Message,
  MessageEmbedOptions,
  SnowflakeUtil,
  TextChannel,
} from "discord.js";
import fetch from "node-fetch";
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
  private readonly timers = new Map<string, Timer>();
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    public readonly giveawayService: MongoGiveawayService
  ) {}
  //global
  async check() {
    const docs = await this.giveawayService.find({ ended: false }, 10);
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
        var interval = setInterval(() => {
          this.updateTimer(message, doc.endDate, doc.ID);
        }, config.ticks.tenSeconds);
        this.timers.set(
          message.id,
          new Timer(
            doc.endDate,
            () => {
              clearInterval(interval);
              this.endGiveaway(doc.ID);
            },
            config.ticks.oneHour
          )
        );
      } catch (err) {
        this.logger.error(err);
      } finally {
        continue;
      }
    }
  }

  //funcs
  async getWinners(guild: Guild, doc: Giveaway, winnerCount: number) {
    const fetchRandomApi = async (
      min: number,
      max: number,
      count: number
    ): Promise<number[]> => {
      const request = await fetch(
        `http://www.randomnumberapi.com/api/v1.0/random?min=${min}&max=${max}&count=${count}`,
        { method: "GET" }
      );
      const response = await request.json();
      return response;
    };
    const winners: string[] = [];
    const usersSet = new Set(doc.participants);
    if (this.client.user) usersSet.delete(this.client.user.id);
    const users = Array.from(usersSet).filter(async (id) => {
      const member =
        guild.members.cache.get(id) ?? (await guild.members.fetch(id));
      return member && doc.condition === "voice"
        ? member.voice.channel != null
        : false;
    });
    const tempNum = Math.min(users.length, winnerCount);
    if (users.length < winnerCount) return users;
    for (let i = 0; i < tempNum; i++) {
      const randomUsers = await fetchRandomApi(1, users.length, 1);
      const winner = users.splice(randomUsers[i] - 1, 1)[0];
      winners.push(winner);
    }
    return winners;
  }
  //messages
  async updateTimer(message: Message, endTime: number, docID: string) {
    const guildGiveaways = await this.getServerGiveaways(message.guildId ?? "");
    if (!guildGiveaways.includes(docID)) return;
    if (!message || !message.editable) {
      const func = this.timers.get(message.id);
      try {
        if (func) func.destroy();
        const giveaway = await this.giveawayService.GiveawayModel.findOne({
          messageID: message.id,
        }).lean();
        if (!giveaway) return;
        const prevValuesFromCache = ((await this.giveawayService.getCache(
          message.guild!.id
        )) || "") as string;
        let prevValues = prevValuesFromCache.split("|") as string[];
        const newValues = prevValues
          .filter(Boolean)
          .filter((x) => x != giveaway.ID);
        Promise.all([
          this.giveawayService.setCacheForGuild(
            message.guild!.id,
            newValues.join("|")
          ),
          this.giveawayService.GiveawayModel.updateOne(
            { ID: giveaway.ID },
            { ended: true }
          ),
        ]);
      } catch (err) {
        this.logger.error(err);
      }
      return;
    }
    try {
      const fields = message.embeds[0].fields;
      fields[0].value = `\`\`\`\n${parseFilteredTimeArray(
        endTime - Date.now()
      ).join(" ")}\`\`\``;
      const newEmbed = {
        ...message.embeds[0],
        fields: fields,
      };
      message.edit({
        embeds: [newEmbed as MessageEmbedOptions],
      });
    } catch (err) {
      this.logger.error(err);
    }
  }
  async endGiveaway(ID: string) {
    try {
      const doc = await this.giveawayService.findOne({ ID }, true);
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
      const winners = await this.getWinners(
        message.guild!,
        doc,
        doc.winnerCount
      );
      const fields = [
        {
          name: "Основная информация",
          value: [
            `<a:tochka:980106660733399070>Участвовало: **${doc.participants.length}**`,
            `<a:tochka:980106660733399070>Длительность: **${parseFilteredTimeArray(
              Date.now() - doc.createdTick
            ).join(" ")}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "ᅠ",
          value: [
            `<a:tochka:980106660733399070>Организатор: <@${doc.creatorID}>`,
            `<a:tochka:980106660733399070>Победител${
              doc.winnerCount > 1 ? "и" : "ь"
            }: ${
              winners.length == 0
                ? "Нет победителя"
                : winners.map((id) => `<@${id}>`).join("\n")
            }`,
          ].join("\n"),
          inline: true,
        },
      ];
      const prevValuesFromCache = ((await this.giveawayService.getCache(
        message.guild!.id
      )) || "") as string;
      let prevValues = prevValuesFromCache.split("|") as string[];
      const newValues = prevValues.filter(Boolean).filter((x) => x != doc.ID);
      await Promise.allSettled([
        winners.map((winner) =>
          message.guild?.members.cache
            .get(winner)
            ?.send({
              embeds: [
                {
                  title: "Удача на вашей стороне",
                  color: config.meta.defaultColor,
                  description: [
                    `Вы выиграли в розыгрыше на **${doc.prize}**, отпишите в лс организатору`,
                    `розыгрыша за получением награды.`,
                  ].join("\n"),
                },
              ],
            })
            .catch(() =>
              this.logger.log(
                `Не удалось отправить сообщение победителю у ${winner} оказался закрытый дм`
              )
            )
        ),
        this.giveawayService.GiveawayModel.updateOne(
          { ID },
          { winners: winners }
        ),
        this.giveawayService.setCacheForGuild(
          message.guild!.id,
          newValues.join("|")
        ),
        message.edit({
          embeds: [
            {
              title: `Розыгрыш закончен.  Приз: ${doc.prize}`,
              color: config.meta.defaultColor,
              description:
                "Победитель выбран с помощью \n||https://www.randomnumberapi.com/||",
              url: "https://www.randomnumberapi.com/",
              fields: fields,
              thumbnail: {
                url: "https://cdn.discordapp.com/attachments/974125927946665995/974185386056249404/1.png",
              },
            },
          ],
          components: [],
        }),
        doc.accessCondition == "reaction"
          ? message.reactions.removeAll()
          : null,
      ]);
    } catch (err) {
      this.logger.error(err);
    } finally {
      await this.giveawayService.GiveawayModel.updateOne(
        { ID },
        { ended: true }
      );
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
      prize,
      accessCondition: access_condition,
      condition,
      channelID: channel.id,
      messageID: "",
      creatorID,
      endDate: endTime,
      participants: [],
      guildID: channel.guild.id,
      winnerCount: winnersCount,
      createdTick: Date.now(),
    };
    const message = await channel.send({
      embeds: [
        {
          title: `Приз: ${prize}`,
          color: config.meta.defaultColor,
          description: `> Для участия нужно нажать ${
            doc.accessCondition == "reaction"
              ? `на реакцию \"${config.emojis.giveaway}\"`
              : 'на кнопку "**Участвовать**"'
          } ${doc.condition == "voice" ? "\n> и зайти в голосовой канал" : ""}`,
          fields: [
            {
              name: "Длительность:",
              value: `\`\`\`\n${parseFilteredTimeArray(
                doc.endDate - Date.now()
              ).join(" ")}\`\`\``,
              inline: true,
            },
          ],
          url: `https://www.randomnumberapi.com/`,
          thumbnail: {
            url: "https://cdn.discordapp.com/attachments/974125927946665995/974185386056249404/1.png",
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
                    style: "SUCCESS",
                  },
                  {
                    customId: `giveaway.list.${id}`,
                    type: "BUTTON",
                    label: "Участники - 0",
                    style: "PRIMARY",
                  },
                ],
              },
            ]
          : undefined,
    });
    if (access_condition === "reaction")
      await message.react(config.emojis.giveaway);
    doc = {
      ...doc,
      messageID: message.id,
    };
    const prevValuesFromCache = ((await this.giveawayService.getCache(
      message.guild!.id
    )) || "") as string;
    let prevValues = [...prevValuesFromCache.split("|"), doc.ID] as string[];
    await Promise.allSettled([
      access_condition === "reaction"
        ? message.react(config.emojis.giveaway)
        : undefined,
      this.giveawayService.setCacheForGuild(
        channel.guild.id,
        prevValues.filter(Boolean).join("|")
      ),
      this.giveawayService.create(doc),
    ]);
    var interval = setInterval(() => {
      this.updateTimer(message, doc.endDate, doc.ID);
    }, config.ticks.tenSeconds);
    new Timer(
      doc.endDate,
      () => {
        clearInterval(interval);
        this.endGiveaway(doc.ID);
      },
      config.ticks.oneHour
    );
  }
  //DataBase communication
  async getGiveaway(
    ID: string,
    force?: boolean,
    ttl?: number
  ): Promise<Giveaway | null> {
    const giveaway = await this.giveawayService.findOne({ ID }, force, ttl);
    return giveaway;
  }
  async getGiveawayByChannel(
    guildID: string | null,
    channelID: string,
    force?: boolean,
    ttl?: number
  ): Promise<Giveaway | null> {
    const giveaways = await this.giveawayService.findOne(
      { channelID, guildID: guildID ?? "" },
      force,
      ttl
    );
    return giveaways ? giveaways : null;
  }
  async getGiveawayByMessage(
    guildID: string | null,
    messageID: string,
    force?: boolean,
    ttl?: number
  ): Promise<Giveaway | null> {
    const giveaways = await this.giveawayService.findOne(
      { messageID, guildID: guildID ?? "" },
      force,
      ttl
    );
    return giveaways ? giveaways : null;
  }
  async getServerGiveaways(guildID: string): Promise<string[]> {
    return (await this.giveawayService.getCache(guildID))?.split("|") ?? [];
  }

  //Giveaway handler
  async onJoin(
    member: GuildMember,
    ID: string
  ): Promise<{
    reason: string;
    success: boolean;
    condition?: GiveawayCondition;
    totalParticipants?: number;
  }> {
    let doc = await this.getGiveaway(ID, true);
    if (!doc) return { reason: "Розыгрыш не найден", success: false };
    if (doc.condition === "voice" && !member.voice.channel)
      return {
        reason:
          "**Условие участия:** Зайдите в любой голосовой канал на сервере",
        success: false,
      };
    console.log(doc.participants);
    if (doc.participants.includes(member.id))
      return { reason: "Вы уже участвуете", success: false };
    await this.giveawayService.GiveawayModel.updateOne(
      { ID },
      { $addToSet: { participants: member } }
    );
    doc.participants.push(member.id);
    return {
      reason:
        doc.condition === "voice"
          ? [
              "При выходе из голосового канала, **вам придет уведомление** и вы ",
              "автоматические будете сняты с участия в розыгрыше",
            ].join("\n")
          : "Пусть удача будет на вашей стороне",
      success: true,
      condition: doc.condition,
      totalParticipants: doc.participants.length,
    };
  }
  async onLeave(
    member: GuildMember,
    ID: string
  ): Promise<{ reason: string; success: boolean }> {
    let doc = await this.getGiveaway(ID, true);
    console.log(doc);
    if (!doc) return { reason: "", success: false };
    if (!doc.participants.includes(member.id))
      return { reason: "", success: false };
    //update model and remove member from participants

    doc.participants.splice(doc.participants.indexOf(member.id), 1);
    console.log(doc.participants);
    await this.giveawayService.GiveawayModel.updateOne(
      { ID },
      { $pull: { participants: member.id } }
    );
    return { reason: "", success: true };
  }
  async listMembers(ID: string) {
    const doc = await this.getGiveaway(ID, true);
    if (!doc) return [];
    return doc.participants;
  }
}
