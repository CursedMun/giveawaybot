import { PrefixCommandTransformPipe } from '@discord-nestjs/common';
import { PrefixCommand } from '@discord-nestjs/core';
import { Injectable, UsePipes } from '@nestjs/common';
import { Message } from 'discord.js';
import { config } from 'src/app/utils/config';
@Injectable()
export class Invite {
  constructor() {}

  @PrefixCommand({
    name: 'invite',
  })
  @UsePipes(PrefixCommandTransformPipe)
  onMessage(message: Message): any {
    message
      .reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            description:
              'Привет! Я **GiveawayBot.** Я помогаю делать розыгрыши легко и просто!\nДобавить меня на свой сервер вы можете по ссылке указанной ниже.\n\n🔗・**[Click me](https://discord.com/api/oauth2/authorize?client_id=1012088879379120148&permissions=11264&scope=bot)**\n\n***Напоминание*** Не забывайте, что у меня есть команда  !help ',
          },
        ],
      })
      .catch(() => {});
    return;
  }
}
