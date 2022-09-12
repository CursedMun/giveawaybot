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
      'Онлайн:': `${parseFilteredTimeArray(process.uptime() * 1000)}`,
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
    const guildID = config.ids.devs.includes(message.author.id)
      ? message.content.split(' ')[1] ?? message.guildId
      : message.guildId;
    if (!guildID) return;
    await awaitMessage.delete().catch(() => {});
    const pageConstructor: PageCallbackAsync = async (page: number) => {
      const documentsCount =
        await this.giveawayService.giveawayService.countDocuments({ guildID });
      const pageCount = Math.ceil(documentsCount / 4);
      const currentIndex = Math.max(0, Math.min(page, documentsCount - 1));
      const documents =
        await this.giveawayService.giveawayService.GiveawayModel.find({
          guildID,
        })
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
                url: message.guild?.iconURL() ?? '',
              },
              footer: {
                text: `${message.author.tag} | Страница ${
                  currentIndex + 1
                }/${pageCount}`,
              },
              title: `Сервер: ${this.client.guilds.cache.get(guildID)?.name}`,
              description: `Количество розыгрешей: ${documentsCount}\n\n`,
              fields: documents.map((document) => {
                const winners = document.winners
                  .map((winner) => `<@${winner}>`)
                  .join(' | ');
                return {
                  name: `${document.prize} | ${new Date(document.endDate)
                    .toISOString()
                    .substring(0, 10)} | ${new Date(document.endDate)
                    .toISOString()
                    .substring(0, 10)}`,
                  value: [
                    `Количество участников: ${document.participants.length}`,
                    `Победител${winners.length > 1 ? 'и' : 'ь'}: ${winners}`,
                    `Организатор: <@${document.creatorID}>`,
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
