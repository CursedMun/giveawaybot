import {
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  ComponentType,
  Interaction,
  InteractionCollector,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  Message,
  MessageChannelCollectorOptionsParams,
  MessageComponentInteraction,
  MessageComponentType,
  MessageOptions,
  SelectMenuInteraction,
} from 'discord.js';

export interface Page {
  message: MessageOptions;
}

export type BookFilter = (interaction: Interaction) => boolean;

export interface NavigationOptions {
  filter: BookFilter;
  collectorOptions?: MessageChannelCollectorOptionsParams<MessageComponentType>;
  buttonName?: string;
}
class ExtendedNavigation {
  static buildMessage(
    message: MessageOptions,
    options: { disabled?: boolean; buttonName?: string },
  ): any {
    const disabled = options.disabled || false;

    const newComponents = Array.from(message.components || []);
    newComponents.push({
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: ButtonStyle.Primary,
          label: 'Назад',
          customId: `${options.buttonName}.back`,
          disabled,
        },
      ],
    });
    return Object.assign({}, message, { components: newComponents });
  }

  responsePromise: Promise<Message>;
  collector?: InteractionCollector<
    ButtonInteraction<CacheType> | SelectMenuInteraction<CacheType>
  >;
  stopped: boolean = false;
  prevMessage: InteractionUpdateOptions;
  private options: NavigationOptions;
  constructor(
    public page: Page,
    channel: CommandInteraction | ButtonInteraction,
    options: NavigationOptions,
    prevMessage: InteractionUpdateOptions,
  ) {
    this.options = options;
    this.options.buttonName = this.options.buttonName ?? 'navigation';
    this.prevMessage = prevMessage;
    this.responsePromise = channel.editReply(
      this.buildMessage(),
    ) as Promise<Message>;
    this.messagePromise
      .then((message) => {
        if (!message) throw new Error('Message not found');

        const filter = (
          interaction: MessageComponentInteraction<CacheType>,
        ) => {
          if (!interaction.message) return false;
          if (interaction.message.id !== message.id) return false;
          if (!interaction.customId.startsWith(`${this.options.buttonName}.`))
            return false;
          return options.filter(interaction as any);
        };
        const collector = message.channel.createMessageComponentCollector({
          filter: filter,
          ...options.collectorOptions,
        });
        collector.on('collect', async (interaction: ButtonInteraction) => {
          if (interaction?.customId === `${this.options.buttonName}.back`) {
            await interaction.update(this.prevMessage).catch(() => {});
            collector.stop('delete');
            return;
          }
        });
        collector.on('end', (reason: string) => {
          if (reason === 'delete') return;
          // message.edit(this.buildMessage(true)).catch(() => {})
        });
        if (this.stopped) collector.stop();

        this.collector = collector;
      })
      .catch(() => {});
  }

  get messagePromise() {
    return this.responsePromise
      .then((response) => {
        const message: Message | null = response;
        return message;
      })
      .catch(() => {});
  }

  stop(reason: string = 'ok') {
    this.stopped = true;
    if (this.collector) this.collector.stop(reason);
  }

  buildMessage(disabled = false) {
    return ExtendedNavigation.buildMessage(this.page.message, {
      disabled,
      buttonName: this.options.buttonName,
    });
  }
}

export default ExtendedNavigation;
