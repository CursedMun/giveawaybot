import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { ArgNum, Payload, PrefixCommand, UsePipes } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { GiveawayService } from 'src/app/providers/giveaway.service';
import { config } from 'src/app/utils/config';
class RerollDto {
  @ArgNum(() => ({ position: 0 }))
  messageID?: string;
}
@Injectable()
export class RerollGiveaway {
  private logger = new Logger(RerollGiveaway.name);
  constructor(private readonly giveawayService: GiveawayService) {}

  @PrefixCommand({
    name: 'reroll',
    isRemoveCommandName: false,
    isRemovePrefix: false,
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onMessage(@Payload() dto: RerollDto, message: Message): Promise<any> {
    if (!message.member?.permissions.has('Administrator')) {
      message
        .reply({
          embeds: [
            {
              color: config.meta.defaultColor,
              description: 'Недостаточно прав для использования команды',
              fields: [
                {
                  name: 'Нужные права',
                  value: '` ⚪ Администратор ` ` Вкл `',
                },
              ],
            },
          ],
        })
        .catch(() => {});
      return;
    }
    // let { messageID } = dto || { messageID: null };
    const args = message.content.split(' ');
    const messageID = args[1];
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
    if (!messageID) {
      reply('Не указали ID сообщение');
      return;
    }
    const awaitMessage = await reply('Ожидайте...');
    if (!awaitMessage) return;
    const giveaway = await this.giveawayService.getGiveawayByMessage(
      message.guildId,
      messageID,
      true,
    );
    if (!giveaway || !giveaway.ended) {
      await awaitMessage?.delete().catch(() => {});

      reply('Розыгрыш не найден или ещё не закончен');
      return;
    }

    if (giveaway.participants.length <= 1) {
      await awaitMessage?.delete().catch(() => {});

      reply('Недостаточно участников');
      return;
    }

    const winners = await this.giveawayService.getWinners(
      message.guild!,
      giveaway,
      giveaway.winnerCount,
    );
    await this.giveawayService.giveawayService.GiveawayModel.updateOne(
      { ID: giveaway.ID },
      { winners: winners },
    );
    await awaitMessage?.delete().catch(() => {});
    reply(
      `Победител${giveaway.winnerCount > 1 ? 'и' : 'ь'}: ${
        winners.length > 0
          ? winners.map((w) => `<@${w}>`).join(', ')
          : ' Ошибка'
      }`,
    );
    return;
  }
}
