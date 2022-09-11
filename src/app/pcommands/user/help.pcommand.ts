import { PrefixCommandTransformPipe } from "@discord-nestjs/common";
import { InjectDiscordClient, PrefixCommand } from "@discord-nestjs/core";
import { Injectable, UsePipes } from "@nestjs/common";
import { Message } from "discord.js";
import { config } from "src/app/utils/config";
@Injectable()
export class Help {
  constructor(@InjectDiscordClient() private readonly client: any) {}

  @PrefixCommand({
    name: "help",
    prefix: '??'
  })
  @UsePipes(PrefixCommandTransformPipe)
  onMessage(message: Message): any {
    message
      .reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            image: {
              url: "https://cdn.discordapp.com/attachments/980765606364205056/980765731966832640/3.png",
            },
          },
          {
            color: config.meta.defaultColor,
            image: {
              url: "https://cdn.discordapp.com/attachments/980765606364205056/980765983155318805/222.png",
            },
            fields: [
              {
                name: "Другие команды",
                value:
                  "` !help ` — это сообщение.\n` !info ` — показать, информацию о боте.\n` !invite ` — показать, ссылку для приглашения бота.\n ` !fb ` — оставить своё предложение.",
                inline: false,
              },
              {
                name: "Розыгрыш",
                value:
                  "` /gs ` \n<:background:980765434414522398>┗ Запустить розыгрыш\n\n` /notify `\n<:background:980765434414522398>┗ Включить \\ Выключить уведомления о розыгрыше в \n<:background:980765434414522398><:background:980765434414522398>личных сообщениях\n\n` !end ` **+** ` messageID `\n<:background:980765434414522398>┗ Завершает (выбирает победителя) указанную или \n<:background:980765434414522398><:background:980765434414522398>последний розыгрыш в текущем канале.\n\n` !reroll ` **+** ` messageID `\n<:background:980765434414522398>┗ Переигрывает указанный или последний розыгрыш в \n<:background:980765434414522398><:background:980765434414522398>текущем канале.\n\nРазработчиком бота является <@423946555872116758> `[423946555872116758]`",
                inline: false,
              },
            ],
          },
        ],
      })
      .catch(() => {});
      return;
  }
}
