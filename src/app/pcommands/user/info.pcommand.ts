import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { InjectDiscordClient, PrefixCommand } from '@discord-nestjs/core';
import { Injectable, UsePipes } from '@nestjs/common';
import {
  ButtonStyle,
  Client,
  ComponentType,
  Message,
  TextChannel,
} from 'discord.js';
import { GiveawayService } from 'src/app/providers/giveaway.service';
import { config } from 'src/app/utils/config';
import Book, { PageCallbackAsync } from 'src/app/utils/navigation/Book';
import { parseFilteredTimeArray } from 'src/app/utils/utils';
@Injectable()
export class Info {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
    private readonly giveawayService: GiveawayService,
  ) {}

  @PrefixCommand({
    name: 'info',
  })
  @UsePipes(PrefixCommandTransformPipe)
  onMessage(message: Message): any {
    //all the info about my discord bot in an embed
    const info = {
      'Название:': `${this.client.user?.tag}`,
      'Сервера:': `${this.client.guilds.cache.size}`,
      'Пользователи:': `${this.client.guilds.cache.reduce(
        (a, b) => a + b?.memberCount,
        0,
      )}`,
      'Node.js:': `${process.version}`,
      'Платформа:': `${process.platform} ${process.arch}`,
      'Память:': `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
        2,
      )} MB / ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      'Онлайн:': `${parseFilteredTimeArray(process.uptime() * 1000).join(':')}`,
    };
    message
      .reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            title: 'Информация',
            description:
              'Разработчик: <@423946555872116758>\nᅠᅠᅠᅠᅠᅠ`423946555872116758`',
            fields: Object.entries(info).map(([key, value]) => {
              return {
                name: key,
                value: value,
                inline: true,
              };
            }),
          },
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: `https://cursedmun.com`,
                label: `Website`,
              },
            ],
          },
        ],
      })
      .catch(() => {});
    return;
  }

  @PrefixCommand({
    name: 'server',
    isRemoveCommandName: false,
    isRemovePrefix: false,
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onServer(message: Message): Promise<any> {
    const reply = async (text: string) => {
      try {
        return await message.reply({
          embeds: [
            {
              color: config.meta.defaultColor,
              description: text,
            },
          ],
        });
      } catch {}
    };
    const awaitMessage = await reply('Ожидайте...');
    if (!awaitMessage) return;
    const args = message.content.split(' ');
    console.log(args);
    const ended = args.length > 2 ? args[1] === 'true' : false;
    const guildID = config.ids.devs.includes(message.author.id)
      ? (args.length > 2 ? args[2] : args[1]) ?? message.guildId
      : message.guildId;
    if (!guildID) return;
    console.log(guildID);
    await awaitMessage.delete().catch(() => {});
    const guild =
      guildID === 'all'
        ? null
        : this.client.guilds.cache.get(guildID) ??
          (await this.client.guilds.fetch(guildID).catch(() => null));
    const pageConstructor: PageCallbackAsync = async (page: number) => {
      const args =
        guildID === 'all'
          ? { ended }
          : {
              guildID,
              ended,
            };
      const documentsCount =
        await this.giveawayService.giveawayService.countDocuments(args);
      const pageCount = Math.ceil(documentsCount / 4);
      const currentIndex = Math.max(0, Math.min(page, documentsCount - 1));
      const documents =
        await this.giveawayService.giveawayService.GiveawayModel.find(args)
          .skip(currentIndex * 4)
          .limit(4)
          .lean();
      return {
        currentIndex,
        message: {
          embeds: [
            {
              color: config.meta.defaultColor,
              thumbnail: {
                url: guild?.iconURL() ?? message.author.avatarURL() ?? '',
              },
              footer: {
                text: `${message.author.tag} | Страница ${
                  pageCount === 0 ? 0 : currentIndex + 1
                }/${pageCount} | Параметры поиска: Окочен: ${ended} Сервер: ${guildID}`,
              },
              title: `Сервер: ${
                guildID === 'all' ? 'Все' : guild?.name ?? 'Неизветсно'
              }`,
              description: `Количество ${
                ended ? 'оконченных' : 'текущих'
              } розыгрешей: ${documentsCount}\n\n`,
              fields: documents.map((document) => {
                const winners = document.winners
                  .map((winner) => `<@${winner}>`)
                  .join(', ');
                return {
                  name: `${document.guildID} | Приз ${document.prize} | ${
                    ended ? 'Окончен' : 'Активнен'
                  } (${new Date(document.endDate).toLocaleString('en-GB', {
                    timeZone: 'UTC',
                  })})`,
                  value: [
                    `Количество участников: ${document.participants.length}`,
                    `Победител${winners.length > 1 ? 'и' : 'ь'}: ${winners}`,
                    `Организатор: <@${document.creatorID}>`,
                    `Длительность: ${document.endDate}`,
                  ].join('\n'),
                  inline: false,
                };
              }),
            },
          ],
        },
        pageCount: pageCount,
      };
    };
    new Book(await pageConstructor(0), message.channel as TextChannel, {
      pageCallback: pageConstructor,
      filter: (m) => m.user.id === message.author.id,
      collectorOptions: { time: config.ticks.oneMinute * 5 },
    });
  }
}
