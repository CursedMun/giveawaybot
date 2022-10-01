import { Command, DiscordCommand, On } from '@discord-nestjs/core';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { config } from '@src/app/utils/config';
import { IsButtonInteractionGuard } from '@src/app/utils/guards/is-button-interaction.guard';
import {
  ButtonInteraction,
  CacheType,
  CommandInteraction,
  ComponentType,
  MessageComponentInteraction
} from 'discord.js';
@Injectable()
@Command({
  name: 'help',
  dmPermission: true,
  descriptionLocalizations: {
    ru: 'Помощь по командам',
    'en-US': 'Help Command'
  },
  description: 'Help Command'
})
export class HelpCmd implements DiscordCommand {
  private logger = new Logger(HelpCmd.name);
  constructor(private readonly usersService: MongoUserService) {}
  async handler(command: CommandInteraction) {
    await command.deferReply({}).catch((err) => this.logger.error(err));
    const message = await command
      .editReply({
        embeds: [
          {
            color: config.meta.defaultColor,
            image: {
              url: 'https://cdn.discordapp.com/attachments/980765606364205056/980765731966832640/3.png'
            }
          },
          {
            color: config.meta.defaultColor,
            image: {
              url: 'https://cdn.discordapp.com/attachments/980765606364205056/980765983155318805/222.png'
            },
            fields: [
              {
                name: 'Другие команды',
                value:
                  '` /help ` — это сообщение.\n` /info ` — показать, информацию о боте.\n` /invite ` — показать, ссылку для приглашения бота.\n ` /fb ` — оставить своё предложение.',
                inline: false
              },
              {
                name: 'Розыгрыш',
                value:
                  '` /gs ` \n<:background:980765434414522398>┗ Запустить розыгрыш\n\n` /notify `\n<:background:980765434414522398>┗ Включить \\ Выключить уведомления о розыгрыше в \n<:background:980765434414522398><:background:980765434414522398>личных сообщениях\n\n` /end ` **+** ` messageID `\n<:background:980765434414522398>┗ Завершает (выбирает победителя) указанную или \n<:background:980765434414522398><:background:980765434414522398>последний розыгрыш в текущем канале.\n\n` /reroll ` **+** ` messageID `\n<:background:980765434414522398>┗ Переигрывает указанный или последний розыгрыш в \n<:background:980765434414522398><:background:980765434414522398>текущем канале.\n\nРазработчиком бота является <@423946555872116758> `[423946555872116758]`',
                inline: false
              }
            ]
          }
        ],
        components: config.embeds.helpEmbed.components
      })
      .catch(() => null);
    if (!message) return;
    const response = await message
      .awaitMessageComponent({
        filter: (interaction: MessageComponentInteraction<CacheType>) => {
          if (interaction.message.id != message.id) return false;
          if (interaction.member?.user.id != command.user.id) return false;
          return true;
        },
        componentType: ComponentType.Button,
        time: config.ticks.oneMinute * 10
      })
      .catch(() => null);
    if (!response) return;
    //TODO buttons
    return;
  }
  @On('interactionCreate')
  @UseGuards(IsButtonInteractionGuard)
  async onModuleSubmit(button: ButtonInteraction) {
    // const action = button.customId;
    // const availableActions =
    //   (config.embeds.helpEmbed as any).components[0].components.map((x) => x.customId);
  }
}
