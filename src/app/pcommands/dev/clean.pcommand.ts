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
export class CleanMe {
  constructor() {}

  @PrefixCommand({
    name: 'cleanme',
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onMessage(@Payload() dto: EndDto, message: Message): Promise<any> {
    if (!message.guild || message.guild.id != config.ids.devGuild) return;
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
    const list = await message.client.guilds.fetch();
    const guilds = list.map((x) => x.fetch());
    const guildsData = await Promise.all(guilds);
    const guildToLeave = guildsData.filter(
      (x) => x.memberCount < (dto?.count ?? 100),
    );
    await Promise.allSettled(guildToLeave);
    await awaitMessage.delete();
    await reply('Количество серверов: ' + guildToLeave.length);
  }
}
