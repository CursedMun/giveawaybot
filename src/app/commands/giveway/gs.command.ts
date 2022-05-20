import { Command, DiscordCommand, On } from "@discord-nestjs/core";
import { Injectable, Logger, UseGuards } from "@nestjs/common";
import {
  CacheType,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  Modal,
  ModalSubmitInteraction,
  TextChannel
} from "discord.js";
import { TextInputStyles } from "discord.js/typings/enums";
import { GiveawayService } from "src/app/providers/giveaway.service";
import { config } from "src/app/utils/config";
import { IsModalInteractionGuard } from "src/app/utils/guards/is-modal-interaction.guard";
import {
  GiveawayAccessСondition,
  GiveawayCondition
} from "src/schemas/mongo/giveaway/giveaway.schema";

@Injectable()
@Command({
  name: "gs",
  description: "Запрос на участие в гифтавейнере",
})
export class GiveawayStartCommand implements DiscordCommand {
  private readonly logger = new Logger(GiveawayStartCommand.name);
  private readonly gsModalID = "giveawaystartmodal";
  private readonly prizeModalID = "prize";
  private readonly timeModalID = "time";
  private readonly winnerscountModalID = "winnerscount";
  private readonly channelModalID = "channel";
  constructor(private readonly giveawayService: GiveawayService) {}

  async handler(interaction: CommandInteraction): Promise<any> {
    try {
      const modal = new Modal({
        customId: this.gsModalID,
        title: "Запрос на участие",
        components: [
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "TEXT_INPUT",
                customId: this.prizeModalID,
                label: "Укажите приз",
                style: TextInputStyles.SHORT,
                required: true,
              },
            ],
          },
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "TEXT_INPUT",
                customId: this.timeModalID,
                label: "Укажите время котрое будет длиться",
                style: TextInputStyles.SHORT,
                required: true,
              },
            ],
          },
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "TEXT_INPUT",
                customId: this.winnerscountModalID,
                label: "Укажите кол-во победителей",
                style: TextInputStyles.SHORT,
                required: true,
              },
            ],
          },
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "TEXT_INPUT",
                customId: this.channelModalID,
                label: "Укажите канал ид",
                style: TextInputStyles.SHORT,
                required: true,
              },
            ],
          },
        ],
      });

      await interaction.showModal(modal);
    } catch (err) {
      this.logger.error(err);
    } finally {
    }
  }
  @On("interactionCreate")
  @UseGuards(IsModalInteractionGuard)
  async onModuleSubmit(modal: ModalSubmitInteraction) {
    this.logger.log(`Modal ${modal.customId} submit`);

    if (modal.customId !== this.gsModalID) return;
    const [prize, time, winnersCount, channel] = [
      modal.fields.getTextInputValue(this.prizeModalID),
      modal.fields.getTextInputValue(this.timeModalID),
      modal.fields.getTextInputValue(this.winnerscountModalID),
      modal.fields.getTextInputValue(this.channelModalID),
    ];
    const timeRegex = /^(\d{1,2}:\d{1,2})(?:\s(\d{1,2})\.(\d{1,2})\.(\d{4}))?$/;
    const timeMatch = timeRegex.exec(time);
    if (!timeMatch) return;
    const utcNow = new Date();
    utcNow.setMinutes(utcNow.getMinutes() + utcNow.getTimezoneOffset());

    const formatTimeComponent = (t: string | number) => `0${t}`.slice(-2);

    const endDate = new Date(
      `${
        timeMatch[2]
          ? Array.from(timeMatch).slice(2).reverse().join("-")
          : `${utcNow.getFullYear()}-${formatTimeComponent(
              utcNow.getMonth() + 1
            )}-${formatTimeComponent(utcNow.getDate())}`
      }T${timeMatch[1].split(":").map(formatTimeComponent).join(":")}+03:00`
    );

    if (endDate.getTime() < Date.now()) endDate.setDate(endDate.getDate() + 1);

    const endTime = endDate.getTime();
    if (Number.isNaN(endTime)) return;
    const giveawayChannel = modal.guild?.channels.cache.get(
      channel
    ) as TextChannel;
    if (!giveawayChannel) return;
    if (Number(winnersCount) > 99) return;
    let message: Message;
    try {
      message = (await modal.reply({
        embeds: [
          {
            title: "Уточним...",
            description: [
              `Приз: **${prize}**`,
              `Время: **${time}**`,
              `Кол-во победителей: **${winnersCount}**`,
              `Канал: <#${channel}>`,
            ].join("\n"),
          },
        ],
        components: config.embeds.confirmEmbed.components,
        fetchReply: true,
      })) as Message;
      const response = await message.awaitMessageComponent({
        filter: (interaction: MessageComponentInteraction<CacheType>) => {
          //TODO проверить на кнопку
          this.logger.log(interaction.customId);
          return true;
        },
        componentType: "BUTTON",
        time: config.ticks.oneMinute * 10,
      });
      this.logger.log(response.customId);
      if (!response || response.customId === "reject") return;
      const options = [
        "Нажатие реакции",
        "Нажатие реакции + зайти в войс",
        "Нажатие кнопки",
        "Нажатие кнопки + зайти в войс",
      ];
      const optionsJson: {
        access_condition: GiveawayAccessСondition;
        condition: GiveawayCondition;
      }[] = [
        { access_condition: "reaction", condition: "novoice" },
        { access_condition: "reaction", condition: "voice" },
        { access_condition: "button", condition: "novoice" },
        { access_condition: "button", condition: "voice" },
      ];
      await response.update({
        embeds: [
          {
            title: "Условия розыгрыша",
            description: "Вам нужно выбрать условия участия в розыгрыше",
          },
        ],
        components: [
          {
            type: "ACTION_ROW",
            components: [
              {
                customId: "select.condition",
                type: "SELECT_MENU",
                placeholder: "Выбрать условия",
                options: options.map((option, index) => {
                  return {
                    label: option,
                    value: index.toString(),
                    description: option,
                  };
                }),
              },
            ],
          },
        ],
      });
      const conditionResponse = await message.awaitMessageComponent({
        filter: () => {
          //TODO проверить на кнопку
          return true;
        },
        componentType: "SELECT_MENU",
        time: config.ticks.oneMinute * 10,
      });
      if (!conditionResponse) return;
      this.giveawayService.createGiveaway({
        prize,
        endTime,
        winnersCount,
        creatorID: modal.user.id,
        channel: giveawayChannel,
        ...optionsJson[conditionResponse.values[0]],
      });
      //TODO maybe send something
    } catch (err) {
      this.logger.error(err);
    } finally {
      message!?.delete().catch((err) => {
        this.logger.error("Не удалось удалить сообщение");
      });
    }
  }
}
