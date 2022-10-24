import { developmentconfig } from './developmentconfig';

const meta = {
  defaultEmbed: {},
  defaultColor: 0x2f3136,
  defaultTimezone: 'Europe/Moscow',
  minGuildUsers: 1,
  timeSpelling: {
    w: 'н',
    d: 'д',
    h: 'ч',
    m: 'м',
    s: 'с'
  },
  pluralTime: {
    w: [' неделя', ' недели', ' недель'],
    d: [' день', ' дня', ' дней'],
    h: [' час', ' часа', ' часов'],
    m: [' минута', ' минуты', ' минут'],
    s: [' секунда', ' секунды', ' секунд']
  }
};
const emojis = {
  giveaway: '🎉',
  confirmEmojis: ['✅', '❌']
};
const embeds = {
  defaultHelpEmbed: {
    color: meta.defaultColor
  }
};

const roles = {
  premium: {
    golden: '1032432761878880297',
    silver: '1032432725094846515'
  }
};

const ticks = {
  tenSeconds: 10 * 1000, //10 seconds in milliseconds
  oneMinute: 6e4, // 1 minute in milliseconds
  oneHour: 3.6e6, // 1 hour in milliseconds
  oneWeek: 6.048e8, // 1 week in milliseconds
  oneMonth: 2.628e9 // one month in milliseconds
};
const premiumAccess = {
  0: {
    maxGiveaways: 2,
    maxWinners: 10,
    maxDuration: ticks.oneWeek
  },
  1: {
    maxGiveaways: 3,
    maxWinners: 15,
    maxDuration: ticks.oneWeek * 2
  },
  2: {
    maxGiveaways: 7,
    maxWinners: 25,
    maxDuration: ticks.oneWeek * 4
  }
};
const conf = {
  meta,
  ticks,
  emojis,
  ids: {
    devs: ['423946555872116758', '597601244365848585'],
    devGuild: '905552166348009503',
    giveawayChannel: '981546639695183953',
    newGuildChannel: '981153654356729866',
    feedbackChannel: '981656983230885899'
  },
  roles,
  embeds,
  premiumAccess
};
export const config =
  process.env.NODE_ENV === 'development'
    ? { ...developmentconfig, ...conf }
    : { ...conf, ...developmentconfig };
