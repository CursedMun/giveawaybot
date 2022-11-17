import { On, Once } from '@discord-nestjs/core';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import locale from '@src/i18n/i18n-node';
import { MongoGuildService } from '@src/schemas/mongo/guild/guild.service';
import { ModalComponents } from '@src/types/global';
import {
  ButtonInteraction,
  ComponentType,
  GuildMember,
  MessageReaction,
  ModalSubmitInteraction,
  TextInputStyle,
  User,
  VoiceState
} from 'discord.js';
import { GiveawayService } from '../providers/giveaway.service';
import { UserService } from '../providers/user.service';
import { config } from '../utils/config';
import { fetchableGuilds } from '../utils/GlobalVar';
import { IsButtonInteractionGuard } from '../utils/guards/is-button-interaction.guard';
import Book, { PageCallback } from '../utils/navigation/Book';

@Injectable()
export class GiveawayEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tempItems = [] as any;
  private tempTimeout: NodeJS.Timeout | undefined;
  private randomNumberModalID = 'randomnumbermodal';
  private randomNumberID = 'randomnumber';
  private timeoutUsers = {} as Record<string, number>;
  constructor(
    private readonly giveawayService: GiveawayService,
    private readonly userService: UserService,
    private readonly guildService: MongoGuildService
  ) {}
  private readonly logger = new Logger(GiveawayEvents.name);
  @Once('ready')
  async onReady() {
    const smth = await this.giveawayService.getServerGiveaways({
      ended: false,
      $or: [{ additionalCondition: 'type' }, { voiceCondition: 'voice' }]
    });
    this.giveawayService.pushToFetchableGuilds(smth.map((x) => x.guildID));
  }
  @On('interactionCreate')
  @UseGuards(IsButtonInteractionGuard)
  async onInteractionCreate(button: ButtonInteraction): Promise<void> {
    if (!button.customId) return;
    const [name, action, giveawayID] = button.customId.split('.') as [
      string,
      'join' | 'list' | 'verify',
      string
    ];
    if (name != 'giveaway') return;
    const guildDoc = await this.guildService.getLocalization(button.guildId);
    const region = guildDoc
      ? guildDoc
      : button.guild?.preferredLocale == 'ru'
      ? 'ru'
      : 'en';
    if (action == 'join') {
      if (
        this.timeoutUsers[button.user.id] &&
        this.timeoutUsers[button.user.id] > Date.now()
      ) {
        await button
          .deferUpdate({})
          .catch((err) => this.logger.error(err.message));
        await button
          .followUp({
            embeds: [
              {
                title: locale[region].onJoinGiveaway.cooldown.title(),
                color: config.meta.defaultColor,
                description: locale[region].onJoinGiveaway.cooldown.description(
                  {
                    time: Math.round(this.timeoutUsers[button.user.id] / 1e3)
                  }
                )
              }
            ],
            ephemeral: true
          })
          .catch((err) => this.logger.error(err.message));
        return;
      }
      const response = await this.giveawayService.onJoin(
        button.member as GuildMember,
        giveawayID,
        region
      );
      if (response.number) {
        const components = [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.randomNumberID,
                label: locale[region].onJoinGiveaway.guessNumber(),
                placeholder: response.prompt ?? '',
                style: TextInputStyle.Short,
                required: true,
                maxLength: 10
              }
            ]
          }
        ].filter(Boolean) as ModalComponents;

        await button
          .showModal({
            customId: `${this.randomNumberModalID}.${button.user.id}.${response.number}.${giveawayID}`,
            title: 'Giveaway',
            components
          })
          .catch((err) => this.logger.error(err));
        return;
      }
      await button
        .deferUpdate({})
        .catch((err) => this.logger.error(err.message));
      await button
        .followUp({
          embeds: [
            {
              title: response.success
                ? locale[region].onJoinGiveaway.join.title()
                : locale[region].onJoinGiveaway.join.errorTitle(),
              color: config.meta.defaultColor,
              description: response.reason
            }
          ],
          ephemeral: true
        })
        .catch((err) => this.logger.error(err.message));

      if (response.totalParticipants) {
        const newComponents = button.message?.components?.[0].components?.map(
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
                .map((doc, index) =>
                  typeof doc.number != 'number'
                    ? locale[region].giveaway.list.text({
                        index: index + 1,
                        userID: doc.ID
                      })
                    : doc.number === parseInt(doc.need?.toString() ?? '0')
                    ? locale[region].giveaway.list.completedText({
                        index: index + 1,
                        userID: doc.ID
                      })
                    : locale[region].giveaway.list.additionalText({
                        index: index + 1,
                        userID: doc.ID,
                        current: doc.number,
                        need: doc.need?.toString() ?? '0'
                      })
                )
                .join('\n')
            : locale[region].default.empty();
        return {
          currentIndex,
          message: {
            embeds: [
              {
                title: locale[region].giveaway.list.title(),
                color: config.meta.defaultColor,
                description: text,
                url: 'https://www.random.org/',
                footer: {
                  text: locale[region].giveaway.list.footer({
                    page:
                      pageCount < currentIndex + 1
                        ? pageCount
                        : currentIndex + 1,
                    pages: pageCount
                  })
                }
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
    } else if (action == 'verify') {
      await button
        .deferReply({ ephemeral: true })
        .catch((err) => this.logger.error(err.message));
      const response = await this.giveawayService.verify(
        giveawayID,
        button.user.id
      );
      await button
        .editReply({
          embeds: [
            {
              title: locale[region].giveaway.verify.title(),
              color: config.meta.defaultColor,
              description: !response
                ? locale[region].default.error()
                : typeof response.current != 'number'
                ? locale[region].giveaway.verify.notIn()
                : `${
                    response.current === parseInt(response.need)
                      ? '<:__:1028466516531892224>'
                      : ''
                  }${locale[region].giveaway.verify.description({
                    current: response.current,
                    need: response.need.toString() ?? ''
                  })}`
            }
          ]
        })
        .catch((err) => this.logger.error(err.message));
    }
  }
  //on random number submit
  @On('interactionCreate')
  async onModalSubmit(modal: ModalSubmitInteraction): Promise<void> {
    if (
      !modal.isModalSubmit() ||
      !modal.customId.startsWith(this.randomNumberModalID)
    )
      return;
    this.timeoutUsers[modal.user.id] = Date.now() + config.ticks.oneMinute / 2;
    await modal
      .deferReply({ ephemeral: true })
      .catch((err) => this.logger.error(err.message));

    const [_, userID, correctResponse, giveawayID] = modal.customId.split(
      '.'
    ) as [string, string, string, string];
    const userResponse = modal.fields.getTextInputValue(this.randomNumberID);
    if (userResponse == correctResponse) {
      await this.giveawayService.endGiveaway(giveawayID, userID);
    }
    await modal
      .followUp({
        embeds: []
      })
      .catch((err) => this.logger.error(err.message));
  }

  //on emoji add
  @On('messageReactionAdd')
  async onReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot) return;
    try {
      if (reaction?.emoji.name == config.emojis.giveaway) {
        const giveaway = await this.giveawayService.getGiveawayByMessage(
          reaction.message.guildId,
          reaction.message.id
        );
        if (!giveaway) return;

        const member =
          reaction.message.guild?.members.cache.get(user.id) ??
          (await reaction.message.guild?.members.fetch(user.id));
        if (!member) return;
        if (giveaway.voiceCondition == 'voice' && !member.voice.channel) {
          await reaction.users.remove(user.id);
          return;
        }
        const response = await this.giveawayService.onJoin(member, giveaway.ID);
        if (response.alreadyParticipant) return;
        if (!response.success) await reaction.users.remove(user.id);
      }
    } catch (err) {
      this.logger.log(err);
    }
  }
  //on channel leave
  @On('voiceStateUpdate')
  async onChannelLeave(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    if (
      !this.giveawayService.verifyGuild(
        newState?.guild?.id ?? oldState?.guild?.id
      )
    )
      return;
    if (
      (oldState.channel && !newState.channel) ||
      (oldState.channel &&
        newState.channel &&
        oldState.channel?.parentId != newState.channel?.parentId)
    ) {
      let category = false;
      const docs = await this.giveawayService.getServerGiveaways({
        guildID: newState.guild.id,
        ended: false,
        voiceCondition: 'voice',
        'participants.ID': newState.id
      });
      if (!docs || !oldState.member) return;
      if (
        docs.some(
          (x) =>
            x?.additionalCondition === 'category' &&
            x?.number === newState.channel?.parentId
        )
      )
        return;
      else category = true;
      const [user, guildLocal] = await Promise.all([
        this.userService.getUser(oldState.member.id),
        this.guildService.getLocalization(oldState.guild.id)
      ]);
      const region = guildLocal
        ? guildLocal
        : oldState.guild?.preferredLocale == 'ru'
        ? 'ru'
        : 'en';
      if (user && user.settings.voiceNotifications)
        await oldState.member
          .send({
            embeds: [
              {
                title: locale[region].giveaway.onLeave.title(),
                color: config.meta.defaultColor,
                description: locale[region].giveaway.onLeave.description()
              }
            ]
          })
          .catch((reason) => this.logger.log(reason));
      setTimeout(async () => {
        const member = await oldState.guild.members.fetch(
          oldState.member?.id ?? ''
        );
        if (
          category
            ? docs.every((x) => x?.number === member.voice.channel?.parentId)
            : user &&
              user.settings.voiceNotifications &&
              member &&
              member.voice.channel
        ) {
          await member
            .send({
              embeds: [
                {
                  title: locale[region].giveaway.onReturn.title(),
                  color: config.meta.defaultColor,
                  description: locale[region].giveaway.onReturn.description()
                }
              ]
            })
            .catch((reason) => this.logger.log(reason));
          return;
        }
        //remove this user from all the giveaways
        const IDs = docs
          .filter((x) => {
            if (
              x?.voiceCondition == 'voice' &&
              x?.additionalCondition != 'category'
            )
              return true;
            if (x?.additionalCondition == 'category')
              return x?.number !== member.voice.channel?.parentId;
            return false;
          })
          .filter((x) => !x.ended)
          .map((giveaway) => giveaway.ID ?? '');
        if (!IDs.length) return;
        await this.giveawayService.onLeave(oldState.id, IDs);
      }, config.ticks.tenSeconds * 2);
    }
  }
  //on message write
}
