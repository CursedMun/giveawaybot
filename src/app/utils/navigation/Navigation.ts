import {
  ButtonInteraction,
  CacheType,
  CommandInteraction,
  Interaction,
  InteractionCollector,
  InteractionCollectorOptions,
  InteractionReplyOptions,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageOptions,
  SelectMenuInteraction,
} from "discord.js";

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
  collectorOptions?: InteractionCollectorOptions<
    MessageComponentInteraction<CacheType>
  >;
}
class Navigation {
  static buildMessage(
    message: MessageOptions,
    options: { disabled?: boolean; currentPage: number; pageCount: number }
  ): any {
    const disabled = options.disabled || false;

    const newComponents = Array.from(message.components || []);
    newComponents.push(
      new MessageActionRow({
        components: [
          new MessageButton({
            style: "DANGER",
            label: "Назад",
            customId: "navigation.back",
          }),
          new MessageButton({
            style: "SECONDARY",
            emoji: "⬅",
            customId: "navigation.page_prev",
            disabled:
              disabled || options.currentPage < 1 || options.pageCount < 2,
          }),
          new MessageButton({
            style: "DANGER",
            emoji: "❌",
            customId: "navigation.delete",
            disabled,
          }),
          new MessageButton({
            style: "SECONDARY",
            emoji: "➡",
            customId: "navigation.page_next",
            disabled: disabled || options.currentPage >= options.pageCount - 1,
          }),
        ],
      })
    );
    return Object.assign({}, message, { components: newComponents });
  }

  pageCallback: PageCallback;
  responsePromise: Promise<Message>;
  collector?: InteractionCollector<
    | ButtonInteraction<CacheType>
    | MessageComponentInteraction<CacheType>
    | SelectMenuInteraction<CacheType>
  >;
  stopped: boolean = false;
  prevMessage: InteractionReplyOptions;
  constructor(
    public page: Page,
    channel: CommandInteraction | ButtonInteraction,
    options: NavigationOptions,
    prevMessage: InteractionReplyOptions
  ) {
    this.prevMessage = prevMessage;
    this.pageCallback = options.pageCallback;
    this.responsePromise = channel.editReply(
      this.buildMessage()
    ) as Promise<Message>;
    this.messagePromise.then((message) => {
      if (!message) throw new Error("Message not found");

      const filter = (interaction: MessageComponentInteraction<CacheType>) => {
        if (!interaction.message) return false;
        if (interaction.message.id !== message.id) return false;
        if (!interaction.customId.startsWith("navigation.")) return false;
        return options.filter(interaction);
      };
      const collector = message.channel.createMessageComponentCollector({
        filter: filter as any,
        ...options.collectorOptions,
      });
      collector.on("collect", async (interaction: ButtonInteraction) => {
        if (interaction?.customId === "navigation.delete") {
          await interaction.update(this.buildMessage(true));
          return;
        }
        if (interaction?.customId === "navigation.back") {
          await interaction.update(this.prevMessage as any);
          collector.stop("delete");
          return;
        }
        const inc = interaction?.customId === "navigation.page_next" ? 1 : -1;
        await this.update(interaction, inc);
      });
      collector.on("end", (reason: string) => {
        if (reason === "delete") return;
        // message.edit(this.buildMessage(true)).catch(() => {})
      });
      if (this.stopped) collector.stop();

      this.collector = collector as any;
    });
  }

  get messagePromise() {
    return this.responsePromise.then((response) => {
      const message: Message | null = response;
      return message;
    });
  }

  async update(interaction: ButtonInteraction, inc: number = 0) {
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

  stop(reason: string = "ok") {
    this.stopped = true;
    if (this.collector) this.collector.stop(reason);
  }

  buildMessage(disabled = false) {
    return Navigation.buildMessage(this.page.message, {
      currentPage: this.page.currentIndex,
      pageCount: this.page.pageCount,
      disabled,
    });
  }
}

export default Navigation;
