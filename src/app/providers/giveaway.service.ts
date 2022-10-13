import { InjectDiscordClient } from '@discord-nestjs/core';
import {
  Giveaway,
  GiveawayAccessСondition,
  GiveawayCondition
} from '@mongo/giveaway/giveaway.schema';
import { MongoGiveawayService } from '@mongo/giveaway/giveaway.service';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  ButtonStyle,
  Client,
  ComponentType,
  Guild,
  GuildMember,
  Message,
  SnowflakeUtil,
  TextChannel
} from 'discord.js';
import fetch from 'node-fetch';
import { config } from '../utils/config';
import Timer from '../utils/timer';
import { parseFilteredTimeArray } from '../utils/utils';
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
  private readonly timers = new Map<
    string,
    { giveawayTimer: Timer; updateMessageInterval: NodeJS.Timer }
  >();
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    public readonly userService: MongoUserService,
    public readonly giveawayService: MongoGiveawayService
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
        const interval = setInterval(() => {
          this.updateTimer(message, doc.endDate, doc.ID);
        }, config.ticks.tenSeconds * 3);
        this.timers.set(message.id, {
          giveawayTimer: new Timer(
            doc.endDate,
            () => {
              clearInterval(interval);
              this.endGiveaway(doc.ID);
            },
            config.ticks.oneHour
          ),
          updateMessageInterval: interval
        });
      } catch (err) {
        const deleted = await this.giveawayService.deleteOne({ ID: doc.ID });
        if (deleted) this.logger.warn(err);
        this.logger.error(err);
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
    const winners: string[] = [];
    const usersSet = new Set(doc.participants);
    if (this.client.user) usersSet.delete(this.client.user.id);
    const users = Array.from(usersSet).filter(async (id) => {
      try {
        const member =
          guild.members.cache.get(id) ?? (await guild.members.fetch(id));
        return member && doc.condition === 'voice'
          ? member.voice.channel != null
          : false;
      } catch (err) {
        return false;
      }
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
    const guildGiveaways = await this.getServerGiveaways(message.guildId ?? '');
    if (!guildGiveaways.includes(docID)) return;
    if (!message || !message.editable) {
      const timer = this.timers.get(message.id);
      try {
        if (timer) {
          timer.giveawayTimer.destroy();
          clearInterval(timer.updateMessageInterval);
        }
        await this.endGiveaway(docID);
        //TODO verify if this works in future
        // const giveaway = await this.giveawayService.GiveawayModel.findOne({
        //   messageID: message.id
        // }).lean();
        // if (!giveaway) return;
        // const prevValuesFromCache = ((await this.giveawayService.getCache(
        //   message.guild?.id ?? ''
        // )) || '') as string;
        // const prevValues = prevValuesFromCache.split('|') as string[];
        // const newValues = prevValues
        //   .filter(Boolean)
        //   .filter((x) => x != giveaway.ID);
        // Promise.all([
        //   this.giveawayService.setCacheForGuild(
        //     message.guild?.id ?? '',
        //     newValues.join('|')
        //   ),
        //   this.giveawayService.GiveawayModel.updateOne(
        //     { ID: giveaway.ID },
        //     { ended: true }
        //   )
        // ]);
      } catch (err) {
        this.logger.error(err);
      }
      return;
    }
    try {
      const fields = message.embeds[0].fields;
      fields[0].value = `\`\`\`\n${parseFilteredTimeArray(
        endTime - Date.now()
      ).join(' ')}\`\`\``;
      const newEmbed = {
        ...message.embeds[0].data,
        fields: fields
      };
      message
        .edit({
          embeds: [newEmbed]
        })
        .catch(async () => {});
    } catch (err) {
      const timer = this.timers.get(message.id);
      if (timer) {
        timer.giveawayTimer.destroy();
        clearInterval(timer.updateMessageInterval);
      }
      await this.endGiveaway(docID);
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
        message.guild,
        doc,
        doc.winnerCount
      );
      const fields = [
        {
          name: 'Основная информация',
          value: [
            `<a:tochka:980106660733399070>Участвовало: **${doc.participants.length}**`,
            `<a:tochka:980106660733399070>Длительность: **${parseFilteredTimeArray(
              Date.now() - doc.createdTick
            ).join(' ')}**`
          ].join('\n'),
          inline: true
        },
        {
          name: 'ᅠ',
          value: [
            `<a:tochka:980106660733399070>Организатор: <@${doc.creatorID}>`,
            `<a:tochka:980106660733399070>Победител${
              doc.winnerCount > 1 ? 'и' : 'ь'
            } \n${
              winners.length == 0
                ? 'Нет победителя'
                : winners
                    .map((id) => `<:background:980765434414522398><@${id}>`)
                    .join('\n')
            }`
          ].join('\n'),
          inline: true
        }
      ];
      const prevValuesFromCache = ((await this.giveawayService.getCache(
        message.guild.id
      )) || '') as string;
      const prevValues = prevValuesFromCache.split('|') as string[];
      const newValues = prevValues.filter(Boolean).filter((x) => x != doc.ID);
      await Promise.allSettled([
        winners.map(async (winner) => {
          const user = await this.userService.get(winner);
          if (user && user.settings.winNotifications)
            message.guild?.members.cache
              .get(winner)
              ?.send({
                embeds: [
                  {
                    title: 'Удача на вашей стороне',
                    color: config.meta.defaultColor,
                    description: [
                      `Вы выиграли в розыгрыше на **${doc.prize}**, отпишите в лс организатору`,
                      `розыгрыша за получением награды.`
                    ].join('\n')
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
              title: `Розыгрыш закончен.  `,
              color: config.meta.defaultColor,
              description: `Приз: **${doc.prize}** \nПобедитель выбран с помощью \n||https://www.random.org||`,
              url: 'https://www.random.org',
              fields: fields,
              thumbnail: {
                url: 'https://media.discordapp.net/attachments/980765606364205056/992518849171816588/d9b3274479f17669.png'
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
  async createGiveaway(data: GiveawayCreationData) {
    const {
      prize,
      endTime,
      winnersCount,
      channel,
      access_condition,
      condition,
      creatorID
    } = data;
    const id = SnowflakeUtil.generate().toString();
    let doc = {
      ID: id,
      prize,
      accessCondition: access_condition,
      condition,
      channelID: channel.id,
      messageID: '',
      creatorID,
      endDate: endTime,
      participants: [],
      guildID: channel.guild.id,
      winnerCount: winnersCount,
      createdTick: Date.now()
    };

    const message = await channel
      .send({
        embeds: [
          {
            title: `Приз: ${prize}`,
            color: config.meta.defaultColor,
            description: `> Для участия нужно нажать ${
              doc.accessCondition == 'reaction'
                ? `на реакцию \"${config.emojis.giveaway}\"`
                : 'на кнопку "**Участвовать**"'
            }`,
            fields: [
              {
                name: 'Длительность:',
                value: `\`\`\`\n${parseFilteredTimeArray(
                  doc.endDate - Date.now()
                ).join(' ')}\`\`\``,
                inline: true
              }
            ],
            footer: {
              text: 'Включить уведомления /notify'
            },
            url: `https://www.random.org`,
            thumbnail: {
              url: 'https://media.discordapp.net/attachments/980765606364205056/992518848974696488/838fa81d4869b0fb.png'
            }
          }
        ],
        components:
          access_condition == 'button'
            ? [
                {
                  type: ComponentType.ActionRow,
                  components: [
                    {
                      customId: `giveaway.join.${id}`,
                      type: ComponentType.Button,
                      label: 'Участвовать',
                      style: ButtonStyle.Success
                    },
                    {
                      customId: `giveaway.list.${id}`,
                      type: ComponentType.Button,
                      label: 'Участники - 0',
                      style: ButtonStyle.Primary
                    }
                  ]
                }
              ]
            : undefined
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
        console.log(err);
      });
    if (!message) return;
    if (access_condition === 'reaction') {
      const reaction = await message
        .react(config.emojis.giveaway)
        .catch(async () => {
          await message.delete().catch(() => null);
          await message.channel
            .send({
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
    await Promise.allSettled([
      access_condition === 'reaction'
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
                `Приз: **${doc.prize}**`,
                `Время: **${new Date(doc.endDate)}**`,
                `Доступ: **${access_condition}**/${condition}`,
                `Количество победителей: **${doc.winnerCount}**`,
                `Создатель: <@${doc.creatorID}>`,
                `Ссылка: https://discordapp.com/channels/${channel.guild.id}/${channel.id}/${message.id}`
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
    //HERE
    const interval = setInterval(() => {
      this.updateTimer(message, doc.endDate, doc.ID);
    }, config.ticks.tenSeconds * 3);
    this.timers.set(doc.messageID, {
      giveawayTimer: new Timer(
        doc.endDate,
        () => {
          clearInterval(interval);
          this.endGiveaway(doc.ID);
        },
        config.ticks.oneHour
      ),
      updateMessageInterval: interval
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
    ended?: boolean
  ): Promise<Giveaway[]> {
    const giveaways = await this.giveawayService.find({ guildID, ended });
    return giveaways;
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
    const doc = await this.getGiveaway(ID, true);
    if (!doc) return { reason: 'Розыгрыш не найден', success: false };
    if (doc.condition === 'voice' && !member.voice.channel)
      return {
        reason:
          '**Условие участия:** Зайдите в любой голосовой канал на сервере',
        success: false
      };
    if (doc.participants.includes(member.id))
      return { reason: 'Вы уже участвуете', success: false };
    await this.giveawayService.GiveawayModel.updateOne(
      { ID },
      { $addToSet: { participants: member } }
    );
    doc.participants.push(member.id);
    return {
      reason:
        doc.condition === 'voice'
          ? [
              'При выходе из голосового канала, **вам придет уведомление** и вы ',
              'автоматические будете сняты с участия в розыгрыше'
            ].join('\n')
          : 'Пусть удача будет на вашей стороне',
      success: true,
      condition: doc.condition,
      totalParticipants: doc.participants.length
    };
  }
  async onLeave(
    member: GuildMember,
    ID: string
  ): Promise<{ reason: string; success: boolean }> {
    const doc = await this.getGiveaway(ID, true);
    if (!doc) return { reason: '', success: false };
    if (!doc.participants.includes(member.id))
      return { reason: '', success: false };
    //update model and remove member from participants

    doc.participants.splice(doc.participants.indexOf(member.id), 1);
    console.log(doc.participants);
    await this.giveawayService.GiveawayModel.updateOne(
      { ID },
      { $pull: { participants: member.id } }
    );
    return { reason: '', success: true };
  }
  async listMembers(ID: string) {
    const doc = await this.getGiveaway(ID, true);
    if (!doc) return [];
    return doc.participants;
  }
}
