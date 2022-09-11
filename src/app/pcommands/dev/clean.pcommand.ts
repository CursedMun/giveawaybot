import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { ArgNum, Payload, PrefixCommand, UsePipes } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';
import { config } from 'src/app/utils/config';
class EndDto {
  @ArgNum(() => ({ position: 0 }))
  count?: string;
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
    const args = message.content.split(' ');
    const count = parseInt(args[1] ?? 100) ?? 100;
    const awaitMessage = await reply('Ожидайте...');
    if (!awaitMessage) return;
    const list = await message.client.guilds.fetch();
    const guilds = list.map((x) => x.fetch());
    const guildsData = await Promise.all(guilds);
    const guildToLeave = guildsData
      .filter((x) => x.id != config.ids.devGuild)
      .filter((x) => x.memberCount < count);
    await Promise.allSettled(guildToLeave.map((x) => x.leave()));
    await awaitMessage.delete();
    await reply('Количество серверов: ' + guildToLeave.length);
  }
}
