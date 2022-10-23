import {
  Client,
  Collection,
  Guild,
  GuildMember,
  Message,
  Role,
  TextChannel,
  User
} from 'discord.js';
import fetch, { RequestInfo, RequestInit } from 'node-fetch';
import { config } from './config';
export type nil = null | undefined;

export type NilPartial<T> = { [K in keyof T]: T[K] | nil };

export interface ParsedTime {
  w: number;
  d: number;
  h: number;
  m: number;
  s: number;
}

export function resolveMentionUserID(mention = '') {
  const regex = /^<@!?(\d+)>$/;
  const match = mention.match(regex);
  if (!match) return null;
  return match[1];
}
export function resolveMentionRoleID(mention = '') {
  const regex = /^<@&?(\d+)>$/;
  const match = mention.match(regex);
  if (!match) return null;
  return match[1];
}
export function resolveRoleID(mention: string): string | null {
  if (/^\d+$/.test(mention)) return mention;
  return resolveMentionRoleID(mention);
}
export function awaitMessage(channel: TextChannel, userID: string, amount = 1) {
  return new Promise<Message | Collection<string, Message> | null>(
    (resolve) => {
      const filter = (m: Message) => m.author.id === userID;
      const collector = channel.createMessageCollector({
        filter: filter,
        idle: 6e4,
        max: 1
      });
      collector.on('collect', (message) => {
        if (amount > 1 && message.content.toLowerCase() === 'stop')
          collector.stop('endbyuser');
        resolve(message);
      });
      collector.on('end', (collected, reason) =>
        reason === 'endbyuser' ? resolve(collected) : resolve(null)
      );
    }
  );
}
export function resolveUserID(mention: string): string | null {
  if (/^\d+$/.test(mention)) return mention;
  return resolveMentionUserID(mention);
}
export function react(
  message: Message,
  emojiID: string,
  client: Client
): Promise<void> {
  return new Promise((resolve, reject) => {
    const emoji = client.emojis.cache.get(emojiID) || emojiID;

    fetch(
      `https://discord.com/api/v7/channels/${message.channel.id}/messages/${
        message.id
      }/reactions/${encodeURIComponent(
        typeof emoji === 'string' ? emoji : `${emoji.name}:${emoji.id}`
      )}/@me`,
      { method: 'PUT', headers: { Authorization: `Bot ${client.token}` } }
    )
      .then((res) => {
        if (res.headers.get('content-type') === 'application/json') {
          return res.json();
        } else {
          return { retry_after: undefined };
        }
      })
      .then((res) => {
        if (typeof res.retry_after === 'number') {
          setTimeout(
            () => resolve(react(message, emojiID, client)),
            res.retry_after
          );
        } else {
          resolve(res);
        }
      })
      .catch(reject);
  });
}
export function confirm(
  message: Message,
  user: User,
  client: Client,
  time = 7.2e6
): Promise<boolean | null> {
  const emojis = config.emojis.confirmEmojis;
  (async () => {
    try {
      for (const emoji of emojis) await react(message, emoji, client);
    } catch (err) {
      throw new Error(err);
    }
  })();

  return message
    .awaitReactions({
      filter: (r, u) => {
        if (!r.emoji) return false;
        return (
          u.id === user.id &&
          emojis.includes(r.emoji?.id || r.emoji?.name || '')
        );
      },
      max: 1,
      time
    })
    .then((collected) => collected.first())
    .then((r) => {
      if (!r) return false;
      return (r.emoji.id || r.emoji.name) === emojis[0];
    })
    .catch(() => {
      message.reactions.removeAll().catch(() => null);
      return null;
    });
}
export function resolveRole(
  mention: string,
  guild: Guild
): Promise<Role | null> {
  return new Promise((resolve) => {
    if (!guild) return resolve(null);
    if (!mention) return resolve(null);

    const roleID = resolveRoleID(mention) || mention;
    if (!roleID) return resolve(null);

    resolve(guild.roles.fetch(roleID).catch(() => null));
  });
}
export const isFilled = <T extends { [k: string]: string }>(
  v: PromiseSettledResult<T>
): v is PromiseFulfilledResult<T> => v.status === 'fulfilled';

export function msToDate(ms: number) {
  const date = new Date(ms);

  return [
    date.getDate(),
    date.getMonth() + 1,
    date.getFullYear(),
    date.getHours() < 10 ? `0${date.getHours()}` : date.getHours(),
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
  ];
}
export function resolveMember(
  mention: string,
  guild: Guild
): Promise<GuildMember | null> {
  return new Promise((resolve) => {
    if (!guild) return resolve(null);
    if (!mention) return resolve(null);

    const targetID = resolveUserID(mention) || mention;
    if (!targetID) return resolve(null);
    const member = guild.members.cache.get(targetID);
    if (member) return resolve(member);
    resolve(guild.members.fetch(targetID).catch(() => null));
  });
}

export function getNounPluralForm(a: number) {
  if (a % 10 === 1 && a % 100 !== 11) {
    return 0;
  } else if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 10 || a % 100 >= 20)) {
    return 1;
  }
  return 2;
}

export function pluralNoun(num: number, ...forms: string[]) {
  if (forms.length === 1) throw new Error('Not enough forms');
  if (forms.length === 2) return num > 1 ? forms[1] : forms[0];
  return forms[getNounPluralForm(num)];
}
export function parseTime(
  time: number,
  limit: keyof ParsedTime = 'd'
): ParsedTime {
  const parsed: Partial<ParsedTime> = {};
  parsed.w = ['d', 'h', 'm', 's'].includes(limit)
    ? 0
    : Math.floor(time / 6.048e8);
  parsed.d = ['h', 'm', 's'].includes(limit) ? 0 : Math.floor(time / 8.64e7);
  parsed.h = ['m', 's'].includes(limit) ? 0 : Math.floor(time / 3.6e6);
  parsed.m = ['s'].includes(limit) ? 0 : Math.floor(time / 6e4);
  parsed.s = Math.ceil(time / 1e3);

  if (parsed.w > 0) {
    parsed.d %= 7;
    parsed.h %= 24;
    parsed.m %= 60;
    parsed.s %= 60;
  } else if (parsed.d > 0) {
    parsed.h %= 24;
    parsed.m %= 60;
    parsed.s %= 60;
  } else if (parsed.h > 0) {
    parsed.m %= 60;
    parsed.s %= 60;
  } else if (parsed.m > 0) {
    parsed.s %= 60;
  }

  return parsed as ParsedTime;
}

export function parseFullTimeArray(
  time: number,
  {
    nouns = config.meta.timeSpelling,
    limit = 'd'
  }: {
    nouns?: { [key in keyof ParsedTime]: string | string[] };
    limit?: keyof ParsedTime;
  } = {}
) {
  const parsed = parseTime(time, limit);
  return Object.entries(parsed).map(([k, v]) => {
    const noun = nouns[k as keyof ParsedTime];
    return `${(v || 0).toLocaleString('ru-RU')}${
      Array.isArray(noun) ? pluralNoun(v || 0, ...noun) : noun
    }`;
  });
}

export function parseTimeArray(
  time: number,
  {
    nouns = config.meta.timeSpelling,
    limit = 'd'
  }: {
    nouns?: { [key in keyof ParsedTime]: string | string[] };
    limit?: keyof ParsedTime;
  } = {}
) {
  const parsed: Partial<ParsedTime> = parseTime(time, limit);

  if (['d', 'h', 'm', 's'].includes(limit)) delete parsed.w;
  if (['h', 'm', 's'].includes(limit)) delete parsed.d;
  if (['m', 's'].includes(limit)) delete parsed.h;
  if (['s'].includes(limit)) delete parsed.m;

  return Object.entries(parsed).map(([k, v]) => {
    const noun = nouns[k as keyof ParsedTime];
    return `${(v || 0).toLocaleString('ru-RU')}${
      Array.isArray(noun) ? pluralNoun(v || 0, ...noun) : noun
    }`;
  });
}

export function parseFilteredTimeArray(
  time: number,
  {
    nouns = config.meta.timeSpelling,
    limit = 'd',
    bold = false
  }: {
    nouns?: { [key in keyof ParsedTime]: string | string[] };
    limit?: keyof ParsedTime;
    bold?: boolean;
  } = {}
) {
  const parsed = parseTime(time, limit);

  const filteredEntries = Object.entries(parsed).filter(([, v]) => {
    return (v || 0) > 0;
  });
  if (filteredEntries.length < 1) filteredEntries.push(['s', 0]);

  return filteredEntries.map(([k, v]) => {
    const noun = nouns[k as keyof ParsedTime];
    return `${bold ? '**' : ''}${(v || 0).toLocaleString('ru-RU')}${
      bold ? '**' : ''
    }${Array.isArray(noun) ? pluralNoun(v || 0, ...noun) : noun}`;
  });
}

export function msConvert(time = ''): number | null {
  const multipliers = {
    w: 6.048e8,
    н: 6.048e8,
    d: 8.64e7,
    д: 8.64e7,
    h: 3.6e6,
    ч: 3.6e6,
    m: 6e4,
    м: 6e4,
    s: 1e3,
    с: 1e3
  };
  const regex = new RegExp(
    `^(\\d+)(${Object.keys(multipliers).join('|')})$`,
    'i'
  );
  const match = time.match(regex);
  if (!match) return null;

  return (
    parseInt(match[1], 10) * multipliers[match[2] as keyof typeof multipliers]
  );
}
export function discordRetryHandler(
  input: RequestInfo,
  init?: RequestInit | undefined,
  tries = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return new Promise((resolve, reject) => {
    fetch(`https://discord.com/api/v8/${input}`, init)
      .then((res) => {
        if (res.headers.get('content-type') === 'application/json') {
          return res.json();
        } else {
          return { retry_after: undefined };
        }
      })
      .then((res) => {
        if (typeof res.retry_after === 'number') {
          if (tries > 1) return reject(new Error('Too many tries'));
          setTimeout(
            () => resolve(discordRetryHandler(input, init, tries + 1)),
            Math.ceil(res.retry_after) * 1000
          );
        } else {
          resolve(res);
        }
      })
      .catch(reject);
  });
}
