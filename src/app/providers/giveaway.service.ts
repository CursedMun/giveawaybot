import { InjectDiscordClient } from '@discord-nestjs/core';
import { MongoGiveawayService } from '@mongo/giveaway/giveaway.service';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import locale from '@src/i18n/i18n-node';
import { Locales } from '@src/i18n/i18n-types';
import { Giveaway } from '@src/schemas/mongo/giveaway/giveaway.schema';
import { MongoGuildService } from '@src/schemas/mongo/guild/guild.service';
import {
  GiveawayAccessСondition,
  GiveawayAdditionalCondition,
  GiveawayVoiceCondition,
  JsonComponents
} from '@src/types/global';
import {
  ButtonStyle,
  Client,
  ComponentType,
  Guild,
  GuildMember,
  SnowflakeUtil,
  TextChannel
} from 'discord.js';
import fetch from 'node-fetch';
import { config } from '../utils/config';
import Timer from '../utils/timer';
export type GiveawayCreationData = {
  creatorID: string;
  prize: string;
  endTime: number;
  winnersCount: number;
  channel: TextChannel;
  voiceCondition: GiveawayVoiceCondition;
  accessCondition: GiveawayAccessСondition;
  additionalCondition?: GiveawayAdditionalCondition;
  number?: string;
  prompt?: string;
};
@Injectable()
export class GiveawayService {
  private readonly logger = new Logger(GiveawayService.name);
  private readonly timers = new Map<string, { giveawayTimer: Timer }>();
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    public readonly userService: MongoUserService,
    public readonly giveawayService: MongoGiveawayService,
    private readonly guildService: MongoGuildService
  ) {}
  //global
  async check() {
    const docs = await this.giveawayService.find({ ended: false }, true);
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
        if (!message) {
          await this.giveawayService.deleteOne({ ID: doc.ID });
          continue;
        }
        this.timers.set(message.id, {
          giveawayTimer: new Timer(
            doc.endDate,
            () => {
              this.endGiveaway(doc.ID);
            },
            config.ticks.oneHour
          )
        });
      } catch (err) {
        const deleted = await this.giveawayService.deleteOne({ ID: doc.ID });
        if (deleted) this.logger.warn(err);
        else this.logger.error(err);
      }
    }
  }
  async checkNotEndedGiveaways(guildID: string) {
    const docs = await this.giveawayService.find(
      { guildID, ended: false },
      true
    );
    const guild =
      this.client.guilds.cache.get(guildID) ??
      (await this.client.guilds.fetch(guildID));
    if (!guild) {
      await this.giveawayService.deleteMany({ guildID: guild });
    }

    for (const doc of docs) {
      const channel =
        (guild.channels.cache.get(doc.channelID) as TextChannel) ??
        ((await guild.channels.fetch(doc.channelID)) as TextChannel);
      if (!channel) {
        docs.slice(docs.indexOf(doc), 1);
        await this.giveawayService.deleteOne({ ID: doc.ID });
        continue;
      }
      const message =
        channel.messages.cache.get(doc.messageID) ??
        (await channel.messages.fetch(doc.messageID));
      if (!message) {
        docs.slice(docs.indexOf(doc), 1);
        await this.giveawayService.deleteOne({ ID: doc.ID });
        continue;
      }
    }
    return docs;
  }
  //funcs
  async getWinners(guild: Guild, doc: Giveaway, winnerCount: number) {
    const fetchRandomApi = async (
      min: number,
      max: number,
      count: number
    ): Promise<number[]> => {
      if (min == max) return [min];
      const request = await fetch(
        `https://www.random.org/integers/?num=${count}&min=${min}&max=${max}&col=1&base=10&format=plain&rnd=new`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer 1d7d7744-cfd9-4746-bb45-52d118209528`
          }
        }
      );
      const response = await request.text();
      return response.split('\n').filter(Boolean).map(Number);
    };
    const winners: {
      userID: string;
      number?: number;
      randomApiNumber?: number;
    }[] = [];
    const usersSet = new Set(
      doc.participants.filter((x) => x.ID != this.client.user?.id).map((x) => x)
    );
    const users = Array.from(usersSet).filter(async ({ ID, number: count }) => {
      try {
        if (doc.additionalCondition && count && count < parseInt(doc.number)) {
          return false;
        }
        const member =
          guild.members.cache.get(ID) ?? (await guild.members.fetch(ID));
        return member && doc.voiceCondition === 'voice'
          ? member.voice.channel != null
          : false;
      } catch (err) {
        return false;
      }
    });
    const tempNum = Math.min(users.length, winnerCount);
    if (users.length < winnerCount)
      return users.map((x) => {
        return { userID: x.ID, number: x.number, randomApiNumber: undefined };
      });
    for (let i = 0; i < tempNum; i++) {
      const randomUsers = await fetchRandomApi(1, users.length, 1);
      const winner = users.splice(randomUsers[i] - 1, 1)[0];
      winners.push({
        userID: winner.ID,
        number: winner.number,
        randomApiNumber: randomUsers[i]
      });
    }
    return winners;
  }

  async endGiveaway(ID: string, winner?: string) {
    try {
      const doc = await this.giveawayService.findOne({ ID }, true);
      if (!doc || doc.ended) return;

      const channel =
        (this.client.channels.cache.get(doc.channelID) as TextChannel) ??
        ((await this.client.channels.fetch(doc.channelID)) as TextChannel);
      if (!channel) return;

      const message =
        channel.messages.cache.get(doc.messageID) ??
        (await channel.messages.fetch(doc.messageID));
      if (!message || !message.guild) return;

      const [embed] = message.embeds;
      if (!embed) return;
      if (embed.fields) delete embed.fields[0];
      const winners = winner
        ? [{ userID: winner, number: doc.number, randomApiNumber: undefined }]
        : await this.getWinners(message.guild, doc, doc.winnerCount);
      const prevValuesFromCache = ((await this.giveawayService.getCache(
        message.guild.id
      )) || '') as string;
      const prevValues = prevValuesFromCache.split('|') as string[];
      const newValues = prevValues.splice(prevValues.indexOf(doc.ID), 1);
      const guildDoc = await this.guildService.getLocalization(doc.guildID);
      const region = guildDoc
        ? guildDoc
        : channel.guild?.preferredLocale == 'ru'
        ? 'ru'
        : 'en';
      await Promise.allSettled([
        winners.map(async (winner) => {
          const user = await this.userService.get(winner.userID);
          if (user && user.settings.winNotifications)
            message.guild?.members.cache
              .get(winner.userID)
              ?.send({
                embeds: [
                  {
                    title: locale[region].endGiveaway.winnersMessage.title(),
                    color: config.meta.defaultColor,
                    description: locale[
                      region
                    ].endGiveaway.winnersMessage.description({
                      prize: doc.prize
                    })
                  }
                ]
              })
              .catch(() =>
                this.logger.log(
                  `Не удалось отправить сообщение победителю у ${winner} оказался закрытый дм`
                )
              );
        }),
        this.giveawayService.GiveawayModel.updateOne(
          { ID },
          { winners: winners }
        ),
        this.giveawayService.setCacheForGuild(
          message.guild.id,
          newValues.join('|')
        ),
        message.edit({
          embeds: [
            {
              title: locale[region].endGiveaway.title(),
              color: config.meta.defaultColor,
              description: locale[region].endGiveaway.description({
                creatorID: doc.creatorID,
                prize: doc.prize,
                winners: !winners.length
                  ? locale[region].default.missing()
                  : winners.map((x) => `<@${x.userID}>`).join(' ')
              }),
              url: 'https://www.random.org',
              thumbnail: {
                url: 'https://media.discordapp.net/attachments/980765606364205056/992518849171816588/d9b3274479f17669.png'
              },
              footer: {
                text: locale[region].endGiveaway.footer(),
                icon_url:
                  'https://is5-ssl.mzstatic.com/image/thumb/Purple114/v4/4c/b0/fe/4cb0fed2-2dd1-6813-1dbf-c397d2f9700e/AppIcon-1x_U007emarketing-0-5-0-0-85-220.png/400x400.png'
              }
            }
          ],
          components: []
        }),
        doc.accessCondition == 'reaction'
          ? await message.reactions.removeAll()
          : null
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
  async createGiveaway(data: GiveawayCreationData, region: Locales) {
    const {
      prize,
      endTime,
      winnersCount,
      channel,
      accessCondition,
      additionalCondition,
      voiceCondition,
      creatorID,
      prompt,
      number
    } = data;
    const id = SnowflakeUtil.generate().toString();
    let doc = {
      ID: id,
      prize,
      accessCondition,
      additionalCondition,
      voiceCondition,
      channelID: channel.id,
      messageID: '',
      creatorID,
      endDate: Date.now() + endTime,
      participants: [],
      guildID: channel.guild.id,
      winnerCount: winnersCount,
      createdTick: Date.now(),
      prompt,
      number
    };
    const components =
      accessCondition == 'button'
        ? ([
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  customId: `giveaway.join.${id}`,
                  type: ComponentType.Button,
                  label: locale[region].giveaway.updateEmbed.participate(),
                  style: ButtonStyle.Success
                },
                additionalCondition !== 'guess'
                  ? {
                      customId: `giveaway.list.${id}`,
                      type: ComponentType.Button,
                      label: locale[region].giveaway.updateEmbed.participants({
                        count: 0
                      }),
                      style: ButtonStyle.Primary
                    }
                  : undefined,
                additionalCondition == 'type'
                  ? {
                      customId: `giveaway.verify.${id}`,
                      type: ComponentType.Button,
                      label: locale[region].giveaway.updateEmbed.verify(),
                      style: ButtonStyle.Primary
                    }
                  : undefined
              ].filter(Boolean)
            }
          ] as JsonComponents)
        : undefined;

    const message = await channel
      .send({
        embeds: [
          {
            title: locale[region].createGiveaway.title({ prize }),
            color: config.meta.defaultColor,
            description: locale[region].createGiveaway.description.default({
              rest: `${locale[region].createGiveaway.description.access[
                doc.accessCondition
              ]({
                emoji: config.emojis.giveaway
              })}${locale[region].createGiveaway.description[
                doc.voiceCondition
              ]()}${
                doc.additionalCondition
                  ? locale[region].createGiveaway.description.additional[
                      doc.additionalCondition
                    ]({ count: number ?? '0' })
                  : ''
              }${locale[region].createGiveaway.description.time({
                time: Math.round(doc.endDate / 1000)
              })} `
            }),
            footer: {
              text: locale[region].createGiveaway.footer()
            },
            url: `https://www.random.org`,
            thumbnail: {
              url: 'https://media.discordapp.net/attachments/980765606364205056/992518848974696488/838fa81d4869b0fb.png'
            }
          }
        ],
        components
      })
      .catch(async (err) => {
        await channel
          .send({
            embeds: [
              {
                title: 'Ошибка',
                color: config.meta.defaultColor,
                description: JSON.stringify(err).slice(0, 2000)
              }
            ]
          })
          .catch(() => null);
        this.logger.error(err);
      });
    if (!message || !message.guild) return;
    if (accessCondition === 'reaction') {
      const reaction = await message
        .react(config.emojis.giveaway)
        .catch(async () => {
          await message.delete().catch(() => null);
          const creator = await this.client.users.fetch(creatorID);
          await creator.send({
              embeds: [
                {
                  title: 'Ошибка',
                  color: config.meta.defaultColor,
                  description: 'Не удалось добавить реакцию к сообщению'
                }
              ]
            })
            .catch(() => null);
          return null;
        });
      if (!reaction) return;
    }
    doc = {
      ...doc,
      messageID: message.id
    };
    const prevValuesFromCache = ((await this.giveawayService.getCache(
      message.guild.id
    )) || '') as string;
    const prevValues = [...prevValuesFromCache.split('|'), doc.ID] as string[];
    const guild = channel.guild;
    await Promise.allSettled([
      accessCondition === 'reaction'
        ? message.react(config.emojis.giveaway)
        : undefined,
      this.giveawayService.setCacheForGuild(
        channel.guild.id,
        prevValues.filter(Boolean).join('|')
      ),
      this.giveawayService.create(doc),
      (
        this.client.guilds.cache
          .get(config.ids.devGuild)
          ?.channels.cache.get(config.ids.giveawayChannel) as TextChannel
      )
        ?.send({
          embeds: [
            {
              title: 'Новый розыгрыш',
              color: config.meta.defaultColor,
              description: [
                `Название сервера: **${channel.guild.name}**`,
                `Приглашение: ${
                  guild.vanityURLCode
                    ? `https://discord.gg/${guild.vanityURLCode}`
                    : `${
                        (
                          guild.invites.cache.find(
                            (x) => x.maxUses === null && x.maxAge === null
                          ) ??
                          guild.invites.cache.find(
                            (x) => x.maxUses === null || x.maxUses > 10
                          ) ??
                          guild.invites.cache.first() ??
                          (await guild.invites
                            .fetch()
                            .then((x) => x.first())
                            .catch(() => null))
                        )?.url ?? ''
                      }` ?? 'Неизвестно'
                }`,
                `Владелец: <@${channel.guild.ownerId}>`,
                `Приз: **${doc.prize}**`,
                `Время: <t:${Math.round(doc.endDate / 1000)}:R>`,
                `Доступ: **${accessCondition}**/**${voiceCondition}**/**${additionalCondition}**`,
                `Количество победителей: **${doc.winnerCount}**`,
                `Создатель: <@${doc.creatorID}>`,
                `Ссылка: [тыкни](https://discordapp.com/channels/${channel.guild.id}/${channel.id}/${message.id})`
              ].join('\n'),
              timestamp: new Date().toISOString(),
              thumbnail: {
                url: channel.guild.iconURL() || ''
              }
            }
          ]
        })
        .catch((err) => this.logger.error(err.message))
    ]);
    this.timers.set(doc.messageID, {
      giveawayTimer: new Timer(
        doc.endDate,
        () => {
          this.endGiveaway(doc.ID);
        },
        config.ticks.oneHour
      )
    });
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
      { channelID, guildID: guildID ?? '' },
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
      { messageID, guildID: guildID ?? '' },
      force,
      ttl
    );
    return giveaways ? giveaways : null;
  }
  async getServerGiveaways(guildID: string): Promise<string[]> {
    return (await this.giveawayService.getCache(guildID))?.split('|') ?? [];
  }
  async getServerGiveawayObjects(
    guildID: string,
    force?: boolean,
    ended?: boolean
  ): Promise<Giveaway[]> {
    const giveaways = await this.giveawayService.find({
      guildID,
      ended,
      force
    });
    return giveaways;
  }
  //Giveaway handler
  async onJoin(
    member: GuildMember,
    ID: string,
    region: Locales = 'en'
  ): Promise<{
    reason: string;
    success: boolean;
    number?: number | string;
    prompt?: string;
    condition?: GiveawayVoiceCondition;
    totalParticipants?: number;
    alreadyParticipant?: boolean;
  }> {
    const doc = await this.getGiveaway(ID, true);
    if (!doc)
      return {
        reason: locale[region].errors.noFoundGiveaways(),
        success: false
      };
    if (doc.voiceCondition === 'voice' && !member.voice.channel)
      return {
        reason: locale[region].onJoinGiveaway.noVoice(),
        success: false
      };
    if (
      doc.additionalCondition === 'category' &&
      (!member.voice.channel?.parent ||
        member.voice.channel.parent.id !== doc.number)
    )
      return {
        reason: locale[region].onJoinGiveaway.noCategory({
          category: doc.number ?? ''
        }),
        success: false
      };
    if (doc.participants.find((x) => x.ID == member.id))
      return {
        reason: locale[region].onJoinGiveaway.alreadyParticipate(),
        alreadyParticipant: true,
        success: false
      };
    if (doc.additionalCondition === 'guess') {
      return {
        reason: locale[region].onJoinGiveaway.alreadyParticipate(),
        number: doc.number,
        prompt: doc.prompt,
        success: true
      };
    }
    await this.giveawayService.GiveawayModel.updateOne(
      { ID },
      { $addToSet: { participants: { ID: member.id, number: 0 } } }
    );
    doc.participants.push({ ID: member.id });
    return {
      reason: `${
        locale[region].createGiveaway.reason.additional[
          doc.additionalCondition
        ]({
          count: doc.number
        }) ?? ''
      }${
        doc.voiceCondition === 'voice'
          ? locale[region].onJoinGiveaway.voiceCondition.voice()
          : locale[region].onJoinGiveaway.joined()
      }`,
      success: true,
      condition: doc.voiceCondition,
      totalParticipants: doc.participants.length
    };
  }
  async onLeave(
    userID: string,
    IDs: string[]
  ): Promise<{ reason: string; success: boolean }> {
    await this.giveawayService.GiveawayModel.updateOne(
      { ID: { $in: IDs } },
      { $pull: { participants: { ID: userID } } }
    );

    return { reason: '', success: true };
  }
  async listMembers(ID: string) {
    const doc = await this.getGiveaway(ID, true);
    if (!doc) return [];
    return doc.participants.map((x) => ({
      ID: x.ID,
      number:
        doc.additionalCondition && doc.additionalCondition != 'category'
          ? x.number
          : null,
      need: doc.additionalCondition ? doc.number : null
    }));
  }
  async verify(giveawayID: string, userID: string) {
    const doc = await this.giveawayService.findOne({ ID: giveawayID }, true);
    if (!doc) return null;
    const parcipant = doc.participants.find((x) => x.ID === userID);
    return {
      current: parcipant ? parcipant.number : null,
      need: doc.number
    };
  }
}
