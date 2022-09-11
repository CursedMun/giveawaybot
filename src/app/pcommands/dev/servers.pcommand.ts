import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { ArgNum, Payload, PrefixCommand, UsePipes } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { config } from 'src/app/utils/config';
class ServersDto {
  @ArgNum(() => ({ position: 0 }))
  count?: string;
}
@Injectable()
export class Servers {
  private logger = new Logger(Servers.name);

  constructor() {}

  @PrefixCommand({
    name: 'servers',
    isRemoveCommandName: false,
    isRemovePrefix: false,
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onMessage(@Payload() dto: ServersDto, message: Message): Promise<any> {
    if (!message.guild || message.guild.id != config.ids.devGuild) return null;
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
    const args = message.content.split(' ');
    const count = parseInt(args[1] ?? 100) ?? 100;
    const awaitMessage = await reply('Ожидайте...');
    if (!awaitMessage) return;
    const list = await message.client.guilds.fetch();
    const guildsData = await Promise.all(list.map((x) => x.fetch()));
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
                name: 'Список серверов с меньше ' + count + ' участников',
                value:
                  guildsData
                    .filter((x) => x.memberCount < count)
                    .length.toString() ?? '0',
              },
            ],
          },
        ],
      })
      .catch(() => {});
  }
}
