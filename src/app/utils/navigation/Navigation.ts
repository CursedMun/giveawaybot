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
  MessageChannelCollectorOptionsParams,
  MessageComponentInteraction,
  MessageComponentType,
  MessageOptions,
  SelectMenuInteraction
} from 'discord.js';

export interface Page {
  currentIndex: number;

  pageCount: number;
  message: MessageOptions;
}

export type PageCallbackAsync = (pageIndex: number) => Promise<Page>;
export type PageCallbackSync = (pageIndex: number) => Page;

export type PageCallback = (pageIndex: number) => Promise<Page> | Page;
export type BookFilter = (interaction: Interaction) => boolean;

export interface NavigationOptions {
  filter: BookFilter;
  pageCallback: PageCallback;
  collectorOptions?: MessageChannelCollectorOptionsParams<MessageComponentType>;
}
class Navigation {
  static buildMessage(
    message: MessageOptions,
    options: { disabled?: boolean; currentPage: number; pageCount: number }
  ): any {
    const disabled = options.disabled || false;
    const newComponents = Array.from(message.components || []);
    newComponents.push({
      type: ComponentType.ActionRow,
      components: [
        {
          customId: 'navigation.back',
          type: ComponentType.Button,
          style: ButtonStyle.Danger,
          label: 'Назад'
        },
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          emoji: '⬅',
          customId: 'navigation.page_prev',
          disabled: disabled || options.currentPage < 1 || options.pageCount < 2
        },
        {
          type: ComponentType.Button,
          style: ButtonStyle.Danger,
          emoji: '❌',
          customId: 'navigation.delete',
          disabled
        },
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          emoji: '➡',
          customId: 'navigation.page_next',
          disabled: disabled || options.currentPage >= options.pageCount - 1
        }
      ]
    });
    return Object.assign({}, message, { components: newComponents });
  }

  pageCallback: PageCallback;
  responsePromise: Promise<Message>;
  collector?: InteractionCollector<
    ButtonInteraction<CacheType> | SelectMenuInteraction<CacheType>
  >;
  stopped = false;
  prevMessage: InteractionUpdateOptions;
  constructor(
    public page: Page,
    channel: CommandInteraction | ButtonInteraction,
    options: NavigationOptions,
    prevMessage: InteractionUpdateOptions
  ) {
    this.prevMessage = prevMessage;
    this.pageCallback = options.pageCallback;
    this.responsePromise = channel.editReply(
      this.buildMessage()
    ) as Promise<Message>;
    this.messagePromise.then((message) => {
      if (!message) throw new Error('Message not found');

      const filter = (interaction: MessageComponentInteraction<CacheType>) => {
        if (!interaction.message) return false;
        if (interaction.message.id !== message.id) return false;
        if (!interaction.customId.startsWith('navigation.')) return false;
        return options.filter(interaction as any);
      };
      const collector = message.channel.createMessageComponentCollector({
        filter: filter,
        ...options.collectorOptions
      });
      collector.on('collect', async (interaction: ButtonInteraction) => {
        if (interaction?.customId === 'navigation.delete') {
          await interaction.update(this.buildMessage(true));
          return;
        }
        if (interaction?.customId === 'navigation.back') {
          await interaction.update(this.prevMessage);
          collector.stop('delete');
          return;
        }
        const inc = interaction?.customId === 'navigation.page_next' ? 1 : -1;
        await this.update(interaction, inc);
      });
      collector.on('end', (reason: string) => {
        if (reason === 'delete') return;
        // message.edit(this.buildMessage(true)).catch(() => {})
      });
      if (this.stopped) collector.stop();

      this.collector = collector;
    });
  }

  get messagePromise() {
    return this.responsePromise.then((response) => {
      const message: Message | null = response;
      return message;
    });
  }

  async update(interaction: ButtonInteraction, inc = 0) {
    let response: Message | null = null;
    const page = await new Promise<Page>((resolve, reject) => {
      const promise = this.pageCallback(this.page.currentIndex + inc);
      if (promise instanceof Promise) {
        interaction.deferReply({ fetchReply: true }).then((resp: any) => {
          response = resp;
          promise.then(resolve).catch(reject);
        });
      } else {
        resolve(promise);
      }
    });
    this.page = page;
    const newMessage = this.buildMessage();
    if (response) {
      (response as Message).delete().catch(() => {});
      if (interaction.message && interaction.message instanceof Message)
        interaction.message.edit(newMessage).catch(() => {});
    } else {
      interaction.update(newMessage);
    }
  }

  stop(reason = 'ok') {
    this.stopped = true;
    if (this.collector) this.collector.stop(reason);
  }

  buildMessage(disabled = false) {
    return Navigation.buildMessage(this.page.message, {
      currentPage: this.page.currentIndex,
      pageCount: this.page.pageCount,
      disabled
    });
  }
}

export default Navigation;
