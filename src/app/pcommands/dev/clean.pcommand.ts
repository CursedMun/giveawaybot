import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { ArgNum, Payload, PrefixCommand, UsePipes } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { config } from '@utils/config';
import { Message } from 'discord.js';
class EndDto {
  @ArgNum(() => ({ position: 0 }))
  count?: string;
}
@Injectable()
export class CleanMe {
  @PrefixCommand({
    name: 'cleanme'
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onMessage(@Payload() dto: EndDto, message: Message) {
    if (!message.guild || message.guild.id != config.ids.devGuild) return;
    const reply = async (text: string) => {
      return await message
        .reply({
          embeds: [
            {
              color: config.meta.defaultColor,
              description: text
            }
          ]
        })
        .catch(() => null);
    };
    const args = message.content.split(' ');
    const count = parseInt(args[1] ?? 10) ?? 10;
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
