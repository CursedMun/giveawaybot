import {
  ButtonStyle,
  ComponentType,
  InteractionUpdateOptions
} from 'discord.js';

const meta = {
  defaultEmbed: {},
  defaultColor: 0x2f3136,
  defaultTimezone: 'Europe/Moscow',
  minGuildUsers: 0,
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
  confirmEmojis: ['Подтвердить', 'Отменить']
};
const embeds = {
  confirmEmbed: {
    ephemeral: true,
    embeds: [
      {
        color: meta.defaultColor,
        author: {
          name: 'Подтвердите действие'
        }
      }
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            label: 'Подтвердить',
            customId: 'confirm',
            type: ComponentType.Button,
            style: ButtonStyle.Success
          },
          {
            label: 'Отменить',
            customId: 'reject',
            type: ComponentType.Button,
            style: ButtonStyle.Danger
          }
        ]
      }
    ]
  } as InteractionUpdateOptions,
  helpEmbed: (userID: string) =>
    ({
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              label: 'Команды',
              customId: `help.commands.${userID}`,
              type: ComponentType.Button,
              style: ButtonStyle.Primary
            },
            {
              label: 'Информация',
              customId: `help.information.${userID}`,
              type: ComponentType.Button,
              style: ButtonStyle.Secondary
            },
            {
              label: 'Активные розыгрыши',
              customId: `help.giveaways.${userID}`,
              type: ComponentType.Button,
              style: ButtonStyle.Secondary
            },
            {
              label: 'Оставить отзыв',
              customId: `help.feedback.${userID}`,
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              disabled: true
            },
            {
              label: 'Ko-fi (Support me)',
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              url: 'https://ko-fi.com/giveawaybot'
            }
          ]
        }
      ]
    } as InteractionUpdateOptions),
  defaultHelpEmbed: {
    color: meta.defaultColor,
    image: {
      url: 'https://cdn.discordapp.com/attachments/980765606364205056/980765731966832640/3.png'
    }
  }
};

const ticks = {
  tenSeconds: 10 * 1000, //10 seconds in milliseconds
  oneMinute: 6e4, // 1 minute in milliseconds
  oneHour: 3.6e6, // 1 hour in milliseconds
  oneWeek: 6.048e8, // 1 week in milliseconds
  oneMonth: 2.628e9 // one month in milliseconds
};

export const developmentconfig = {
  meta,
  embeds,
  ticks,
  emojis,
  ids: {
    devs: ['423946555872116758', '597601244365848585'],
    devGuild: '905552166348009503',
    giveawayChannel: '981546639695183953',
    newGuildChannel: '981153654356729866',
    feedbackChannel: '981656983230885899'
  }
};
