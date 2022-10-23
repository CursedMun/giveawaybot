import {
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  ComponentType,
  Interaction,
  InteractionCollector,
  Message,
  MessageChannelCollectorOptionsParams,
  MessageComponentInteraction,
  MessageComponentType,
  MessageOptions,
  SelectMenuInteraction,
  TextChannel
} from 'discord.js';
import { RawMessageButtonInteractionData } from 'discord.js/typings/rawDataTypes';

export interface Page {
  currentIndex: number;
  pageCount: number;
  message: MessageOptions;
}

export type PageCallbackAsync = (
  pageIndex: number,
  lastPage?: boolean
) => Promise<Page>;
export type PageCallbackSync = (pageIndex: number) => Page;

export type PageCallback = (
  pageIndex: number,
  lastPage?: boolean
) => Promise<Page> | Page;
export type BookFilter = (interaction: Interaction) => boolean;

export interface BookOptions {
  filter: BookFilter;
  pageCallback: PageCallback;
  collectorOptions?: MessageChannelCollectorOptionsParams<MessageComponentType>;
  showLastPageButton?: boolean;
  buttons?: RawMessageButtonInteractionData[];
}

class Book {
  static buildMessage(
    message: MessageOptions,
    options: {
      disabled?: boolean;
      currentPage: number;
      pageCount: number;
      showLastPage?: boolean;
      buttons?: RawMessageButtonInteractionData[];
    }
  ): any {
    const disabled = options.disabled || false;
    const newComponents = Array.from(message.components || []);
    newComponents.push({
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          emoji: '1028463411731898418',
          customId: 'book.page_first',
          disabled: disabled || options.currentPage < 1 || options.pageCount < 2
        },
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          emoji: '1028460718703509564',
          customId: 'book.page_prev',
          disabled: disabled || options.currentPage < 1 || options.pageCount < 2
        },
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          emoji: '1028460720599355433',
          customId: 'book.page_next',
          disabled: disabled || options.currentPage >= options.pageCount - 1
        },
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          emoji: '1028463413355085885',
          customId: 'book.page_last',
          disabled: disabled || options.currentPage < 1 || options.pageCount < 2
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
  showLastPage = false;
  lastPage = true;
  private options: BookOptions;
  constructor(
    public page: Page,
    channel: TextChannel | ButtonInteraction | CommandInteraction,
    options: BookOptions
  ) {
    this.options = options;
    this.pageCallback = options.pageCallback;
    this.showLastPage = options.showLastPageButton || false;
    this.responsePromise =
      channel instanceof TextChannel
        ? channel.send(this.buildMessage())
        : (channel.followUp(this.buildMessage()) as Promise<Message>);
    this.messagePromise
      .then((message) => {
        if (!message) throw new Error('Message not found');
        const filter = (
          interaction: MessageComponentInteraction<CacheType>
        ) => {
          if (!interaction.message) return false;
          if (interaction.message.id !== message.id) return false;
          if (!interaction.customId.startsWith('book.')) return false;
          return options.filter(interaction as Interaction);
        };
        const collector = message.channel.createMessageComponentCollector({
          filter,
          ...options.collectorOptions
        });

        collector.on('collect', async (interaction: ButtonInteraction) => {
          if (interaction?.customId === 'book.delete') {
            if (this.showLastPage) collector.stop('end');
            else {
              collector.stop('delete');
              await interaction
                .update(this.buildMessage(true))
                .catch(() => null);
            }
            return;
          }
          if (interaction?.customId === 'book.last_page') {
            await this.update(interaction, this.page.pageCount).catch(
              () => null
            );
            this.lastPage = !this.lastPage;
          } else if (interaction?.customId === 'book.first_page') {
            await this.update(interaction, 0).catch(() => null);
            this.lastPage = !this.lastPage;
          } else {
            const inc = interaction?.customId === 'book.page_next' ? 1 : -1;
            await this.update(interaction, this.page.currentIndex + inc).catch(
              (err) => {
                console.log(err);
              }
            );
          }
        });
        collector.on('end', (reason: string) => {
          if (reason === 'delete') return;
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          message.delete().catch(() => null);
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

  async update(interaction: ButtonInteraction, pageIndex = 0) {
    const response: Message | null = null;
    const page = await new Promise<Page>((resolve, reject) => {
      const promise = this.pageCallback(pageIndex);
      if (promise instanceof Promise) {
        promise.then(resolve).catch(reject);
      } else {
        resolve(promise);
      }
    });
    this.page = page;
    const newMessage = this.buildMessage();
    if (response) {
      (response as Message).delete().catch(() => null);
      if (interaction.message && interaction.message instanceof Message)
        interaction.message.edit(newMessage).catch(() => null);
    } else {
      interaction.update(newMessage).catch(() => null);
    }
  }

  stop(reason = 'ok') {
    this.stopped = true;
    if (this.collector) this.collector.stop(reason);
  }

  buildMessage(disabled = false) {
    return Book.buildMessage(this.page.message, {
      currentPage: this.page.currentIndex,
      pageCount: this.page.pageCount,
      buttons: this.options.buttons,
      disabled,
      showLastPage: this.showLastPage
    });
  }
}

export default Book;
