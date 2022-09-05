import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { ArgNum, Payload, PrefixCommand } from '@discord-nestjs/core';
import { Injectable, UsePipes } from '@nestjs/common';
import { Message } from 'discord.js';
import { config } from 'src/app/utils/config';
class EndDto {
  @ArgNum(() => ({ position: 0 }))
  count?: number;
}
@Injectable()
export class Servers {
  constructor() {}

  @PrefixCommand({
    name: 'servers',
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onMessage(@Payload() dto: EndDto, message: Message): Promise<any> {
    console.log('test');
    if (!message.guild || message.guild.id != config.ids.devGuild) return null;
    console.log('test');
    const list = await message.client.guilds.fetch();
    const guilds = list.map((x) => x.fetch());
    const reply = async (text: string) => {
      return await message
        .reply({
          embeds: [
            {
              color: config.meta.defaultColor,
              description: text,
            },
          ],
        })
        .catch(() => {});
    };
    const awaitMessage = await reply('Ожидайте...');
    if (!awaitMessage) return;
    const guildsData = await Promise.all(guilds);
    await awaitMessage.delete().catch();

    message
      .reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            title: 'Информация о серверах',
            fields: [
              {
                name: 'Количество серверов',
                value: guildsData.length.toString() ?? '0',
              },
              {
                name: 'Список серверов',
                value:
                  guildsData
                    .filter((x) => x.memberCount > (dto?.count ?? 100))
                    .length.toString() ?? '0',
              },
            ],
          },
        ],
      })
      .catch(() => {});
  }
}
