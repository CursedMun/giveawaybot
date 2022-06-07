import { PrefixCommandTransformPipe } from "@discord-nestjs/common";
import { PrefixCommand } from "@discord-nestjs/core";
import { Injectable, UsePipes } from "@nestjs/common";
import { Message } from "discord.js";
import { config } from "src/app/utils/config";
@Injectable()
export class Invite {
  constructor() {}

  @PrefixCommand({
    name: "invite",
    prefix: "!",
  })
  @UsePipes(PrefixCommandTransformPipe)
  onMessage(message: Message): any {
    message
      .reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            description:
              "Привет! Я **GiveawayBot.** Я помогаю делать розыгрыши легко и просто!\nДобавить меня на свой сервер вы можете по ссылке указанной ниже.\n\n🔗・**[Click me](https://discord.com/api/oauth2/authorize?client_id=982320645918560407&permissions=3136&scope=bot%20applications.commands)**\n\n***Напоминание*** Не забывайте, что у меня есть команда  !help ",
          },
        ],
      })
      .catch(() => {});
    return;
  }
}
