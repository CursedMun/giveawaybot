import {
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  ComponentType,
  Interaction,
  InteractionCollector,
  InteractionUpdateOptions,
  Message,
  MessageActionRowComponentData,
  MessageChannelCollectorOptionsParams,
  MessageComponentInteraction,
  MessageComponentType,
  MessageOptions,
  ModalSubmitInteraction,
  SelectMenuInteraction
} from 'discord.js';
import { config } from '../config';

export interface Page {
  message: MessageOptions;
}

export type BookFilter = (interaction: Interaction) => boolean;

export interface NavigationOptions {
  filter: BookFilter;
  collectorOptions?: MessageChannelCollectorOptionsParams<MessageComponentType>;
  buttonName?: string;
  additionalComps?: MessageActionRowComponentData;
}
class ExtendedNavigation {
  static buildMessage(
    message: MessageOptions,
    options: {
      disabled?: boolean;
      buttonName?: string;
      additionalComps?: MessageActionRowComponentData;
    }
  ) {
    const disabled = options.disabled || false;

    const newComponents = Array.from(message.components || []);
    const comps = [
      {
        type: ComponentType.Button,
        style: ButtonStyle.Primary,
        label: 'Назад',
        customId: `${options.buttonName}.back`,
        disabled
      } as MessageActionRowComponentData
    ];
    if (options.additionalComps) comps.push(options.additionalComps);
    newComponents.push({
      type: ComponentType.ActionRow,
      components: comps
    });
    return Object.assign({}, message, { components: newComponents });
  }

  responsePromise: Promise<Message>;
  collector?: InteractionCollector<
    ButtonInteraction<CacheType> | SelectMenuInteraction<CacheType>
  >;
  stopped = false;
  prevMessage: InteractionUpdateOptions;
  private options: NavigationOptions;
  constructor(
    public page: Page,
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | ModalSubmitInteraction,
    options: NavigationOptions,
    prevMessage: InteractionUpdateOptions
  ) {
    this.options = options;
    this.options.buttonName = this.options.buttonName ?? 'navigation';
    this.prevMessage = prevMessage;
    this.responsePromise = interaction
      .editReply(this.buildMessage())
      .catch((err) => console.log(err)) as Promise<Message>;
    this.messagePromise
      .then((message) => {
        if (!message) throw new Error('Message not found');

        const filter = (
          interaction: MessageComponentInteraction<CacheType>
        ) => {
          if (!interaction.message) return false;
          if (interaction.message.id !== message.id) return false;
          if (!interaction.customId.startsWith(`${this.options.buttonName}.`))
            return false;
          return options.filter(interaction as Interaction);
        };
        const collector = message.channel.createMessageComponentCollector({
          filter: filter,
          idle: config.ticks.oneMinute * 3,
          ...options.collectorOptions
        });
        collector.on('collect', async (interaction: ButtonInteraction) => {
          if (interaction?.customId === `${this.options.buttonName}.back`) {
            await interaction.update(this.prevMessage).catch(() => null);
            collector.stop('delete');
            return;
          }
        });
        collector.on('end', (reason: string) => {
          if (reason === 'delete') return;
          // message.edit(this.buildMessage(true)).catch(() => null)
        });
        if (this.stopped) collector.stop();

        this.collector = collector;
      })
      .catch(() => null);
  }

  get messagePromise() {
    return this.responsePromise
      .then((response) => {
        const message: Message | null = response;
        return message;
      })
      .catch(() => null);
  }

  stop(reason = 'ok') {
    this.stopped = true;
    if (this.collector) this.collector.stop(reason);
  }

  buildMessage(disabled = false) {
    return ExtendedNavigation.buildMessage(this.page.message, {
      disabled,
      buttonName: this.options.buttonName,
      additionalComps: this.options.additionalComps
    });
  }
}

export default ExtendedNavigation;
