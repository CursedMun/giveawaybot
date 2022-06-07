import { InteractionReplyOptions } from "discord.js";
import { developmentconfig } from "./developmentconfig";

const meta = {
  defaultEmbed: {},
  defaultColor: 0x2f3136,
  defaultTimezone: "Europe/Moscow",
  timeSpelling: {
    w: "н",
    d: "д",
    h: "ч",
    m: "м",
    s: "с",
  },
  pluralTime: {
    w: [" неделя", " недели", " недель"],
    d: [" день", " дня", " дней"],
    h: [" час", " часа", " часов"],
    m: [" минута", " минуты", " минут"],
    s: [" секунда", " секунды", " секунд"],
  },
};
const emojis = {
  giveaway: "🎉",
  confirmEmojis: ["✅", "❌"],
};
const embeds = {
  confirmEmbed: {
    ephemeral: true,
    embeds: [
      {
        color: meta.defaultColor,
        author: {
          name: "Подтвердите действие",
        },
      },
    ],
    components: [
      {
        type: "ACTION_ROW",
        components: [
          {
            emoji: emojis.confirmEmojis[0],
            customId: "confirm",
            type: "BUTTON",
            style: "SUCCESS",
          },
          {
            emoji: emojis.confirmEmojis[1],
            customId: "reject",
            type: "BUTTON",
            style: "DANGER",
          },
        ],
      },
    ],
  } as InteractionReplyOptions,
};

const ticks = {
  tenSeconds: 10 * 1000, //10 seconds in milliseconds
  oneMinute: 6e4, // 1 minute in milliseconds
  oneHour: 3.6e6, // 1 hour in milliseconds
  oneWeek: 6.048e8, // 1 week in milliseconds
  oneMonth: 2.628e9, // one month in milliseconds
};

const conf = {
  meta,
  embeds,
  ticks,
  emojis,
  ids: {
    devGuild: '905552166348009503',
    giveawayChannel: '981546639695183953',
    newGuildChannel: '981153654356729866',
    feedbackChannel: '981656983230885899'
  }
};
export const config =
  process.env.NODE_ENV === "development" ? developmentconfig : conf;
