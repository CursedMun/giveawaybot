import { On } from '@discord-nestjs/core';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  ButtonInteraction,
  ComponentType,
  GuildMember,
  MessageReaction,
  User,
  VoiceState
} from 'discord.js';
import { GiveawayService } from '../providers/giveaway.service';
import { UserService } from '../providers/user.service';
import { config } from '../utils/config';
import { IsButtonInteractionGuard } from '../utils/guards/is-button-interaction.guard';
import Book, { PageCallback } from '../utils/navigation/Book';

@Injectable()
export class GiveawayEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tempItems = [] as any;
  private tempTimeout: NodeJS.Timeout | undefined;
  constructor(
    private readonly giveawayService: GiveawayService,
    private readonly userService: UserService
  ) {}
  private readonly logger = new Logger(GiveawayEvents.name);
  @On('interactionCreate')
  @UseGuards(IsButtonInteractionGuard)
  async onInteractionCreate(button: ButtonInteraction): Promise<void> {
    if (!button.customId) return;
    const [name, action, giveawayID] = button.customId.split('.') as [
      string,
      'join' | 'list',
      string
    ];
    if (name != 'giveaway') return;
    if (action == 'join') {
      await button
        .deferUpdate({})
        .catch((err) => this.logger.error(err.message));
      const response = await this.giveawayService.onJoin(
        button.member as GuildMember,
        giveawayID
      );

      await button
        .followUp({
          embeds: [
            {
              title: response.success
                ? 'Теперь вы участвуете в конкурсе'
                : 'Ой что-то не так',
              color: config.meta.defaultColor,
              description: response.reason
            }
          ],
          ephemeral: true
        })
        .catch((err) => this.logger.error(err.message));

      if (response.totalParticipants) {
        const newComponents = button.message.components?.[0].components?.map(
          (component) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, action, __] = (component.customId ?? '1.1.1').split('.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tempComponent = component as any;
            return {
              label:
                action == 'list'
                  ? `Участников - ${response.totalParticipants}`
                  : tempComponent.label,
              customId: tempComponent.customId,
              type: tempComponent.type,
              style: tempComponent.style,
              disabled: tempComponent.disabled
            };
          }
        );
        this.tempItems.push({
          components: [
            {
              type: ComponentType.ActionRow,
              components: newComponents
            }
          ]
        });
        if (this.tempTimeout) clearTimeout(this.tempTimeout);
        this.tempTimeout = setTimeout(async () => {
          await Promise.allSettled([
            button.editReply(this.tempItems[this.tempItems.length - 1])
          ]);
          this.tempItems = [];
        }, 2000);
      }
    } else if (action == 'list') {
      await button
        .deferReply({ ephemeral: true })
        .catch((err) => this.logger.error(err.message));
      const list = await this.giveawayService.listMembers(giveawayID);
      const pageConstructor: PageCallback = (page: number) => {
        const documentsCount = list.length;
        const pageCount = Math.ceil(documentsCount / 10);
        const currentIndex = Math.max(0, Math.min(page, documentsCount - 1));
        const documents = list.slice(10 * page, 10 * (page + 1));
        const text =
          documents.length > 0
            ? documents
                .map((doc, index) => `**${index + 1}.**<@${doc}>`)
                .join('\n')
            : 'Пусто...';
        return {
          currentIndex,
          message: {
            embeds: [
              {
                title: 'Участники розыгрыша',
                color: config.meta.defaultColor,
                description: text,
                thumbnail: {
                  url: 'https://cdn.discordapp.com/attachments/974125927946665995/974185386056249404/1.png'
                },
                footer: {
                  text: `${button.user.tag} | Страница ${
                    currentIndex + 1
                  }/${pageCount}`
                },
                fields: []
              }
            ]
          },
          pageCount: pageCount
        };
      };
      new Book(await pageConstructor(0), button, {
        pageCallback: pageConstructor,
        filter: () => true,
        collectorOptions: { time: 60_000 }
      });
    }
  }
  //on emoji add
  @On('messageReactionAdd')
  async onReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot) return;
    try {
      if (reaction?.emoji.name == config.emojis.giveaway) {
        let giveaway = await this.giveawayService.getGiveawayByMessage(
          reaction.message.guildId,
          reaction.message.id
        );
        if (!giveaway) {
          const tempGiveaway = await this.giveawayService.getGiveawayByMessage(
            reaction.message.guildId,
            reaction.message.id,
            true
          );
          if (tempGiveaway)
            giveaway = await this.giveawayService.getGiveawayByMessage(
              reaction.message.guildId,
              reaction.message.id,
              false,
              (tempGiveaway.endDate - Date.now()) / 1e3
            );
        }
        if (!giveaway) return;

        const member =
          reaction.message.guild?.members.cache.get(user.id) ??
          (await reaction.message.guild?.members.fetch(user.id));
        if (!member) return;
        if (giveaway.condition == 'voice' && !member.voice.channel) {
          await reaction.users.remove(user.id);
          return;
        }
        const response = await this.giveawayService.onJoin(member, giveaway.ID);
        if (response.reason == 'Вы уже участвуете') return;
        if (!response.success) await reaction.users.remove(user.id);
      }
    } catch (err) {
      this.logger.log(err);
    }
  }
  //on channel enter
  @On('voiceStateUpdate')
  async onChannelEnter(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    if (oldState.channel && !newState.channel) {
      const giveaways = await this.giveawayService.getServerGiveaways(
        newState.guild.id
      );
      if (!giveaways) return;
      const docs = await Promise.all(
        giveaways.map((id) =>
          this.giveawayService.giveawayService.findOne({
            ID: id,
            ended: false
          })
        )
      );
      if (!docs.length) return;
      if (!docs.some((giveaway) => giveaway?.condition === 'voice')) return;
      if (!oldState.member) return;
      const user = await this.userService.getUser(
        oldState.member.id,
        false,
        20
      );
      if (user && user.settings.voiceNotifications)
        await oldState.member
          .send({
            embeds: [
              {
                title: 'Участие в розыгрыше',
                color: config.meta.defaultColor,
                description:
                  'Покидая **голосовой канал**, вы отказываетесь от участия в розыгрыше\nУ вас есть **20 секунд** чтобы вернуться.'
              }
            ]
          })
          .catch((reason) => this.logger.log(reason));
      setTimeout(async () => {
        const member = await oldState.guild.members.fetch(
          oldState.member?.id ?? ''
        );
        if (
          user &&
          user.settings.voiceNotifications &&
          member &&
          member.voice.channel
        ) {
          await member
            .send({
              embeds: [
                {
                  title: 'Участие в розыгрыше',
                  color: config.meta.defaultColor,
                  description:
                    'О, вы вернулись, значит оставляем запись на участие в розыгрыше'
                }
              ]
            })
            .catch((reason) => this.logger.log(reason));
          return;
        }
        //remove this user from all the giveaways
        await Promise.allSettled(
          docs
            .filter(Boolean)
            .map(
              (giveaway) =>
                giveaway?.condition == 'voice' &&
                oldState.member &&
                this.giveawayService.onLeave(oldState.member, giveaway.ID)
            )
        );
      }, config.ticks.tenSeconds * 2);
    }
  }
}
