import { PrefixCommandTransformPipe } from "@discord-nestjs/common";
import { InjectDiscordClient, PrefixCommand } from "@discord-nestjs/core";
import { Injectable, UsePipes } from "@nestjs/common";
import { ButtonStyle, Client, ComponentType, Message } from "discord.js";
import { config } from "src/app/utils/config";
@Injectable()
export class Info {
  constructor(@InjectDiscordClient() private readonly client: Client) {}

  @PrefixCommand({
    name: "info",
  })
  @UsePipes(PrefixCommandTransformPipe)
  onMessage(message: Message): any {
    //all the info about my discord bot in an embed
    const info = {
      "Название:": `${this.client.user?.tag}`,
      "Сервера:": `${this.client.guilds.cache.size}`,
      "Пользователи:": `${this.client.guilds.cache.reduce(
        (a, b) => a + b?.memberCount,
        0
      )}`,
      "Node.js:": `${process.version}`,
      "Платформа:": `${process.platform} ${process.arch}`,
      "Память:": `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
        2
      )} MB / ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
    };
    message
      .reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            title: "Информация",
            description:
              "Разработчик: <@423946555872116758>\nᅠᅠᅠᅠᅠᅠ`423946555872116758`",
            fields: Object.entries(info).map(([key, value]) => {
              return {
                name: key,
                value: value,
                inline: true,
              };
            }),
          },
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: `https://cursedmun.com`,
                label: `Website`,
              },
            ],
          },
        ],
      })
      .catch(() => {});
    return;
  }
}
