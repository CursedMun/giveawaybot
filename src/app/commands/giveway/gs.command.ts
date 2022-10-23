import {
  Command,
  DiscordCommand,
  InjectDiscordClient,
  On
} from '@discord-nestjs/core';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  GiveawayCreationData,
  GiveawayService
} from '@providers/giveaway.service';
import { UserService } from '@src/app/providers/user.service';
import {
  GiveawayAccessСondition,
  GiveawayAdditionalCondition,
  GiveawayVoiceCondition,
  JsonComponents,
  ModalComponents
} from '@src/types/global';
import { TInteractionCreateActionString } from '@src/types/gs';
import { config } from '@utils/config';
import { IsButtonInteractionGuard } from '@utils/guards/is-button-interaction.guard';
import { IsModalInteractionGuard } from '@utils/guards/is-modal-interaction.guard';
import ExtendedNavigation from '@utils/navigation/ExtendedNavigation';
import { msConvert } from '@utils/utils';
import {
  ButtonInteraction,
  ButtonStyle,
  Client,
  CommandInteraction,
  ComponentType,
  ModalSubmitInteraction,
  SelectMenuInteraction,
  TextChannel,
  TextInputStyle
} from 'discord.js';
import locale from 'src/i18n/i18n-node';

@Injectable()
@Command({
  name: 'gs',
  dmPermission: false,
  descriptionLocalizations: {
    ru: 'Начать розыгрыш?',
    'en-US': 'Start a giveaway?'
  },
  defaultMemberPermissions: ['Administrator'],
  description: 'Start a giveaway?'
})
export class GiveawayStartCommand implements DiscordCommand {
  private readonly logger = new Logger(GiveawayStartCommand.name);
  private readonly gsModalID = 'giveawaystartmodal';
  private readonly prizeModalID = 'prize';
  private readonly timeModalID = 'time';
  private readonly winnerscountModalID = 'winnerscount';
  private readonly channelModalID = 'channel';
  private readonly lastQuestionID = 'lastquestion';
  private readonly numberID = 'number';
  private readonly promptID = 'prompt';
  private readonly tempCache = { premium: 0 } as Record<
    string,
    Partial<GiveawayCreationData> & { premium?: 0 | 1 | 2 }
  >;
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly giveawayService: GiveawayService,
    private readonly userService: UserService
  ) {}
  //Send First Modal
  async handler(interaction: CommandInteraction) {
    try {
      if (!interaction.guild) return;
      const channel = interaction.channel as TextChannel;
      if (
        channel
          .permissionsFor(this.client.user?.id ?? '')
          ?.has('SendMessages') === false
      ) {
        return {
          embeds: [
            {
              color: config.meta.defaultColor,
              description: locale.en.errors.noPerms.description(),
              fields: [
                {
                  name: locale.en.errors.noPerms.field(),
                  value: locale.en.errors.noPerms.value({
                    perm:
                      channel
                        .permissionsFor(this.client.user?.id ?? '')
                        ?.has('SendMessages') === false
                        ? locale.en.errors.noSendMessagePerm()
                        : locale.en.admin()
                  })
                }
              ]
            }
          ],
          ephemeral: true
        };
      }
      if (!interaction.guild) return;

      const [premium, giveaways] = await Promise.all([
        this.userService.verifyPremium(interaction.guild.ownerId),
        this.giveawayService.giveawayService.countDocuments(
          { guildID: interaction.guild.id },
          5
        )
      ]);
      this.tempCache[interaction.user.id] = {
        premium
      };
      if (giveaways >= config.premiumAccess[premium].maxGiveaways) {
        const docs = await this.giveawayService.checkNotEndedGiveaways(
          interaction.guild.id
        );
        if (docs.length >= config.premiumAccess[premium].maxGiveaways)
          return {
            embeds: [
              {
                color: config.meta.defaultColor,
                description: locale.en.errors.maxGiveaways()
              }
            ],
            ephemeral: true
          };
      }
      await interaction.showModal({
        customId: this.gsModalID,
        title: 'Giveaway',
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.prizeModalID,
                label: locale.en.giveaway.modal.prize(),
                placeholder: locale.en.giveaway.modal.prizePlaceholder(),
                style: TextInputStyle.Short,
                required: true,
                maxLength: 250
              }
            ]
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.timeModalID,
                label: locale.en.giveaway.modal.duration(),
                placeholder: locale.en.giveaway.modal.maxDuration({
                  number: premium == 0 ? 1 : premium == 2 ? 2 : 4
                }),
                style: TextInputStyle.Short,
                required: true,
                maxLength: 10
              }
            ]
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.winnerscountModalID,
                label: locale.en.giveaway.modal.winnersCount(),
                placeholder: locale.en.giveaway.modal.winnersCountPlaceholder({
                  max: config.premiumAccess[premium].maxWinners
                }),
                style: TextInputStyle.Short,
                required: true,
                maxLength: 20
              }
            ]
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                customId: this.channelModalID,
                label: locale.en.giveaway.modal.channel(),
                value: interaction.channelId,
                style: TextInputStyle.Short,
                required: true,
                maxLength: 100
              }
            ]
          }
          // {
          //   type: ComponentType.ActionRow,
          //   components: [
          //     {
          //       type: ComponentType.TextInput,
          //       customId: this.channelModalID + '10',
          //       label: locale.en.giveaway.modal.channel(),
          //       value: interaction.channelId,
          //       style: TextInputStyle.Short,
          //       required: true,
          //       maxLength: 100
          //     }
          //   ]
          // }
        ]
      });
    } catch (err) {
      this.logger.error(err);
    }
  }
  //confirm or reject what you did previously
  @On('interactionCreate')
  @UseGuards(IsModalInteractionGuard)
  async onModuleSubmit(modal: ModalSubmitInteraction) {
    if (modal.customId !== this.gsModalID || !modal.guild) return;
    const correctContent = await this.verifyContent(modal);
    if (!correctContent) return;
    await modal.deferReply({}).catch(() => {});
    const { prize, time, winnersCount, giveawayChannel, msduration } =
      correctContent;
    const confirmComponents = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            label: locale.en.default.accept(),
            customId: `gs.${modal.user.id}.confirm`,
            type: ComponentType.Button,
            style: ButtonStyle.Success
          },
          {
            label: locale.en.default.reject(),
            customId: `gs.${modal.user.id}.reject`,
            type: ComponentType.Button,
            style: ButtonStyle.Danger
          }
        ]
      }
    ] as JsonComponents;
    await modal
      .editReply({
        embeds: [
          {
            title: locale.en.giveaway.modalReply.title(),
            color: config.meta.defaultColor,
            description: [
              locale.en.giveaway.modalReply.description({
                type: locale.en.default.prize(),
                description: `**${prize}**`
              }),
              locale.en.giveaway.modalReply.description({
                type: locale.en.default.duration(),
                description: `**${time}**`
              }),
              locale.en.giveaway.modalReply.description({
                type: locale.en.default.winnersCount(),
                description: `**${winnersCount}**`
              }),
              locale.en.giveaway.modalReply.description({
                type: locale.en.default.channel(),
                description: `${giveawayChannel}`
              })
            ].join('\n'),
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/1030567356864417913/1033772061975392306/Group_200.png'
            }
          }
        ],
        components: confirmComponents
      })
      .catch(() => null);
    this.tempCache[modal.user.id] = {
      ...this.tempCache[modal.user.id],
      prize,
      endTime: msduration,
      winnersCount,
      creatorID: modal.user.id,
      channel: giveawayChannel
    };
  }
  //select voice or no voice
  @On('interactionCreate')
  @UseGuards(IsButtonInteractionGuard)
  async onButtonClick(interaction: ButtonInteraction) {
    if (!interaction.isButton() || !interaction.customId.startsWith('gs.'))
      return;
    const [_, userID, action] = interaction.customId.split('.') as [
      string,
      string,
      TInteractionCreateActionString
    ];
    if (
      !userID ||
      !action ||
      userID !== interaction.user.id ||
      action === 'reject'
    ) {
      await interaction.message?.delete().catch(() => {});
      return;
    }

    switch (action) {
      case 'confirm': {
        try {
          await interaction.deferUpdate({}).catch(() => null);
          const options = Object.entries(locale.en.giveaway.voiceCondition).map(
            ([k, v]) => ({ name: v(), condition: k })
          );
          const components = [
            {
              type: ComponentType.ActionRow,
              components: options.map((x) => ({
                label: x.name,
                customId: `gs.${userID}.form.${x.condition}`,
                type: ComponentType.Button,
                style: ButtonStyle.Secondary
              }))
            }
          ] as JsonComponents;
          new ExtendedNavigation(
            {
              message: {
                embeds: [
                  {
                    title: locale.en.giveaway.response.title(),
                    description: locale.en.giveaway.response.description({
                      userID: interaction.user.id
                    }),
                    color: config.meta.defaultColor,
                    thumbnail: {
                      url: interaction.user.displayAvatarURL()
                    }
                  }
                ],
                components
              }
            },
            interaction,
            {
              filter: (m) => m.user.id === userID
            },
            {
              embeds: interaction.message.embeds,
              components: interaction.message.components ?? []
            }
          );
        } catch (e) {
          this.logger.error(e);
        }
        break;
      }
      case 'form': {
        const voiceCondition = interaction.customId.split(
          '.'
        )[3] as GiveawayVoiceCondition;
        this.tempCache[userID] = {
          ...this.tempCache[userID],
          voiceCondition
        };
        try {
          await interaction.deferUpdate({}).catch((err) => {});
          const premium = this.tempCache[userID].premium ?? 0;
          const optionsJson = this.giveawayOptions(premium, voiceCondition);
          new ExtendedNavigation(
            {
              message: {
                embeds: [
                  {
                    title: `${locale.en.giveaway.response.titleTwo()} ${locale.en.giveaway.voiceCondition[
                      voiceCondition
                    ]()}`,
                    description:
                      locale.en.giveaway.response.descriptionTwo({
                        userID: interaction.user.id
                      }) +
                      (premium < 2
                        ? locale.en.giveaway.response.noDonate()
                        : ''),
                    color: config.meta.defaultColor,
                    thumbnail: {
                      url: interaction.user.displayAvatarURL()
                    }
                  }
                ],
                components: [
                  {
                    type: ComponentType.ActionRow,
                    components: [
                      {
                        customId: `select.${interaction.user.id}.condition`,
                        type: ComponentType.SelectMenu,
                        placeholder: locale.en.giveaway.response.options(),
                        emoji: '<:point:1014108607098404925>',
                        options: optionsJson
                          .filter((x) => !x.disabled)
                          .map((option, index) => {
                            return {
                              disabled: option.disabled,
                              label: `${
                                index + 1
                              } ${locale.en.default.option()}`,
                              value: index.toString(),
                              description: `${locale.en.giveaway.accessConditions[
                                option.accessCondition
                              ]()}
                              ${
                                option.additionalCondition
                                  ? ` (${locale.en.giveaway.additionalConditions[
                                      option.additionalCondition
                                    ]()})`
                                  : ''
                              }`
                            };
                          })
                      }
                    ]
                  }
                ]
              }
            },
            interaction,
            {
              filter: (m) => m.user.id === userID,
              additionalComps:
                premium < 2
                  ? {
                      type: ComponentType.Button,
                      style: ButtonStyle.Link,
                      label: locale.en.giveaway.response.donateString(),
                      url: 'https://www.patreon.com/user?u=81586511&fan_landing=true'
                    }
                  : undefined
            },
            {
              embeds: interaction.message.embeds,
              components: interaction.message.components ?? []
            }
          );
          break;
        } catch (e) {
          this.logger.error(e);
        }
      }
    }
  }
  giveawayOptions(
    premium = 0,
    voiceCondition?: GiveawayVoiceCondition
  ): {
    accessCondition: GiveawayAccessСondition;
    additionalCondition?: GiveawayAdditionalCondition;
    disabled?: boolean;
  }[] {
    const res = [
      { accessCondition: 'reaction' },
      { accessCondition: 'button' },
      {
        accessCondition: 'button',
        additionalCondition: 'type',
        disabled: premium < 1
      },
      voiceCondition === 'voice'
        ? {
            accessCondition: 'button',
            additionalCondition: 'category',
            disabled: premium < 1
          }
        : undefined,
      {
        accessCondition: 'button',
        additionalCondition: 'guess',
        disabled: premium < 2
      }
    ].filter(Boolean) as {
      accessCondition: GiveawayAccessСondition;
      additionalCondition?: GiveawayAdditionalCondition;
      disabled?: boolean;
    }[];
    return res;
  }
  //Select menu
  @On('interactionCreate')
  async onSelectMenu(interaction: SelectMenuInteraction) {
    if (!interaction.guild || !interaction.isSelectMenu()) return;
    if (!interaction.customId.startsWith('select.')) return;
    // await interaction.deferReply({}).catch(() => null);
    const [_, userID, action] = interaction.customId.split('.') as [
      string,
      string,
      TInteractionCreateActionString
    ];
    if (!userID || !action || userID !== interaction.user.id) return;
    const optionsJson = this.giveawayOptions(
      this.tempCache[userID].premium,
      this.tempCache[userID].voiceCondition
    );

    const option = optionsJson[parseInt(interaction.values[0])];
    // if (
    //   option.additionalCondition === 'invite' &&
    //   !interaction.guild.members.me?.permissions.has('ManageGuild')
    // ) {
    //   await interaction.update({}).catch(() => null);
    //   return await interaction
    //     .editReply({
    //       embeds: [
    //         {
    //           color: config.meta.defaultColor,
    //           description: locale.en.errors.noPerms.description(),
    //           fields: [
    //             {
    //               name: locale.en.errors.noPerms.field(),
    //               value: locale.en.errors.noPerms.value({
    //                 perm: 'Manage Server'
    //               })
    //             }
    //           ]
    //         }
    //       ],
    //       components: []
    //     })
    //     .catch((err) => console.log(err));
    // }
    this.tempCache[userID] = {
      ...this.tempCache[userID],
      ...option
    };
    if (typeof option.additionalCondition === 'string') {
      const components = [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.TextInput,
              customId: this.numberID,
              label:
                locale.en.giveaway.additionalQuestion[
                  option.additionalCondition
                ](),
              style: TextInputStyle.Short,
              required: true,
              maxLength: 25
            }
          ]
        },
        option.additionalCondition === 'guess'
          ? {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.TextInput,
                  customId: this.promptID,
                  label: locale.en.giveaway.additionalQuestion.guessPrompt(),
                  style: TextInputStyle.Short,
                  required: true,
                  maxLength: 100
                }
              ]
            }
          : null
      ].filter(Boolean) as ModalComponents;

      await interaction
        .showModal({
          customId: `${this.lastQuestionID}.${userID}.${option.additionalCondition}`,
          title: 'Giveaway',
          components
        })
        .catch((err) => this.logger.log(err));
      return;
    }
    try {
      const last = {
        ...this.tempCache[userID],
        winnersCount:
          option.additionalCondition === 'guess'
            ? 1
            : this.tempCache[userID].winnersCount
      };
      await interaction.message.delete().catch(() => null);
      this.giveawayService.createGiveaway(last as GiveawayCreationData);
    } catch (e) {
      this.logger.error(e);
    }
  }
  @On('interactionCreate')
  @UseGuards(IsModalInteractionGuard)
  async onLastQuestionSubmit(modal: ModalSubmitInteraction) {
    if (
      !modal.isModalSubmit() ||
      !modal.customId.startsWith(this.lastQuestionID) ||
      !modal.guild
    )
      return;
    await modal.deferUpdate().catch(() => null);
    const [_, userID, condition] = modal.customId.split('.') as [
      string,
      string,
      GiveawayAdditionalCondition
    ];
    const [number, prompt] = [
      condition == 'category'
        ? modal.fields.getTextInputValue(this.numberID)
        : parseInt(modal.fields.getTextInputValue(this.numberID)) ?? 0,
      condition == 'guess'
        ? modal.fields.getTextInputValue(this.promptID)
        : undefined
    ];
    const reply = async (text: string) => {
      return await modal.editReply({
        embeds: [
          {
            color: config.meta.defaultColor,
            author: {
              name: text,
              icon_url: modal.user.avatarURL() || ''
            }
          }
        ]
      });
    };
    if (
      (typeof number == 'number' &&
        number >= 10000 &&
        number <= 0 &&
        isNaN(number)) ||
      !number
    ) {
      await reply(locale.en.default.error());
      return null;
    }
    try {
      const last = { ...this.tempCache[userID], number, prompt };
      await modal.message?.delete().catch(() => null);
      await this.giveawayService.createGiveaway(last as GiveawayCreationData);
    } catch (e) {
      this.logger.error(e);
    }
  }
  async verifyContent(modal: ModalSubmitInteraction) {
    const reply = async (text: string) => {
      return await modal.reply({
        embeds: [
          {
            color: config.meta.defaultColor,
            author: {
              name: text,
              icon_url: modal.user.avatarURL() || ''
            }
          }
        ]
      });
    };
    const [prize, time, winnersCount, channel] = [
      modal.fields.getTextInputValue(this.prizeModalID),
      modal.fields.getTextInputValue(this.timeModalID),
      parseInt(modal.fields.getTextInputValue(this.winnerscountModalID)) ?? 0,
      modal.fields.getTextInputValue(this.channelModalID)
    ];
    const msduration = msConvert(time.toLowerCase());

    if (
      typeof msduration !== 'number' ||
      msduration >
        config.premiumAccess[this.tempCache[modal.user.id].premium ?? 0]
          .maxDuration
    ) {
      await reply(locale.en.errors.noInput.time());
      return null;
    }
    const giveawayChannel = (modal.guild?.channels.cache.get(channel) ||
      modal.guild?.channels.cache.find(
        (x) => x.name == channel
      )) as TextChannel;
    if (!giveawayChannel) {
      await reply(locale.en.errors.noInput.channel());
      return null;
    }
    if (
      !giveawayChannel
        .permissionsFor(modal.client.user?.id ?? '')
        ?.has('SendMessages')
    ) {
      await reply(locale.en.errors.noSendMessagePerm());
      return null;
    }
    if (
      typeof winnersCount !== 'number' ||
      winnersCount >=
        config.premiumAccess[this.tempCache[modal.user.id].premium ?? 0]
          .maxWinners ||
      winnersCount <= 0 ||
      isNaN(winnersCount)
    ) {
      await reply(locale.en.errors.noInput.winnersCount());
      return null;
    }

    return { prize, time, winnersCount, giveawayChannel, msduration };
  }
}
