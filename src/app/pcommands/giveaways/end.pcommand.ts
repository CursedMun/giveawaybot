import { PrefixCommandTransformPipe } from "@discord-nestjs/common";
import { ArgNum, Payload, PrefixCommand } from "@discord-nestjs/core";
import { Injectable, Logger, UsePipes } from "@nestjs/common";
import { Message } from "discord.js";
import { GiveawayService } from "src/app/providers/giveaway.service";
import { config } from "src/app/utils/config";
class EndDto {
  @ArgNum(() => ({ position: 0 }))
  messageID?: string;
}
@Injectable()
export class EndGiveaway {
  private logger = new Logger(EndGiveaway.name);
  constructor(private readonly giveawayService: GiveawayService) {}

  @PrefixCommand({
    name: "end",
    prefix: "!",
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onMessage(@Payload() dto: EndDto, message: Message): Promise<any> {
    if (!message.member?.permissions.has("ADMINISTRATOR")) {
      message
        .reply({
          embeds: [
            {
              color: config.meta.defaultColor,
              description: "Недостаточно прав для использования команды",
              fields: [
                {
                  name: "Нужные права",
                  value: "` ⚪ Администратор ` ` Вкл `",
                },
              ],
            },
          ],
        })
        .catch(() => {});
      return;
    }
    let { messageID } = dto || { messageID: null };
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
    const guildGiveaways = await this.giveawayService.getServerGiveaways(
      message.guildId ?? ""
    );
    let giveawayID = "";
    if (!guildGiveaways.length) {
      reply("На сервере нет активных розыгрышей");
      return;
    }
    if (!messageID) giveawayID = guildGiveaways[0];
    const giveaway = messageID
      ? await this.giveawayService.getGiveawayByMessage(
          message.guildId,
          messageID,
          true
        )
      : await this.giveawayService.getGiveaway(giveawayID);
    if (!giveaway || giveaway.ended) {
      reply("Розыгрыш не найден или уже закончен");
      return;
    }
    await this.giveawayService.endGiveaway(giveaway.ID);
    reply("Розыгрыш успешно закончен");
    return;
  }
}
