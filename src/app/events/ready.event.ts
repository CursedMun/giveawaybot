import { InjectDiscordClient, On, Once } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Client, Guild, TextChannel } from 'discord.js';
import { GiveawayService } from '../providers/giveaway.service';
import { UserService } from '../providers/user.service';
import { config } from '../utils/config';

@Injectable()
export class Ready {
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly giveawayService: GiveawayService,
    private readonly userService: UserService
  ) {}
  private readonly logger = new Logger(Ready.name);
  @Once('ready')
  async onReady(client: Client): Promise<void> {
    this.logger.log('Started');
    const stats = {
      '\nBot User:': `${client.user?.tag}`,
      'Guild(s):': `${client.guilds.cache.size} Servers`,
      'Watching:': `${client.guilds.cache.reduce(
        (a, b) => a + b?.memberCount,
        0
      )} Members`,
      'Node.js:': `${process.version}`,
      'Plattform:': `${process.platform} ${process.arch}`,
      'Memory:': `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
        2
      )} MB / ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`
    };
    this.checkTemps();
    this.logger.log(
      Object.entries(stats)
        .map(([key, value]) => `${key} ${value}`)
        .join('\n')
    );
    // this.userService.getPremiumUsers();
  }
  checkTemps() {
    this.giveawayService.check();
    setTimeout(() => this.checkTemps(), config.ticks.oneHour);
  }
  @On('guildCreate')
  async onGuildJoin(guild: Guild): Promise<void> {
    this.logger.log(
      `Joined ${guild.name}\nTotal: ${guild.client.guilds.cache.size}`
    );
    if (
      guild.memberCount < config.meta.minGuildUsers &&
      guild.id != config.ids.devGuild
    ) {
      await guild.leave().catch(() => {
        this.logger.error('Could not leave guild ' + guild.name);
      });
    }
    (
      this.client.guilds.cache
        .get(config.ids.devGuild)
        ?.channels.cache.get(config.ids.newGuildChannel) as TextChannel
    )
      ?.send({
        embeds: [
          {
            title: 'Бот добавлен на новый сервер',
            color: config.meta.defaultColor,
            description: [
              `Название сервера: **${guild.name}**`,
              `Владелец: <@${guild.ownerId}> | **${guild.ownerId}** | **${
                (await guild.fetchOwner().catch(() => null))?.user.tag
              }**`,
              `Количество участников: **${guild.memberCount}**`,
              `Дата создания сервера: **${guild.createdAt}**`,
              `Каналы: **${guild.channels.cache.size}**`,
              `Роли: **${guild.roles.cache.size}**`,
              `Сервер находится в глобальном списке: **${guild.available}**`,
              `guild.memberCount < ${config.meta.minGuildUsers}: ${
                guild.memberCount < config.meta.minGuildUsers
              }`,
              `invite: ${
                guild.vanityURLCode
                  ? `https://discord.gg/${guild.vanityURLCode}`
                  : `${
                      (
                        guild.invites.cache.find(
                          (x) => x.maxUses === null && x.maxAge === null
                        ) ??
                        guild.invites.cache.find(
                          (x) => x.maxUses === null || x.maxUses > 10
                        ) ??
                        guild.invites.cache.first() ??
                        (await guild.invites
                          .fetch()
                          .then((x) => x.first())
                          .catch(() => null))
                      )?.url ?? ''
                    }`
              }`
            ].join('\n'),
            thumbnail: {
              url: guild.iconURL() || ''
            }
          }
        ]
      })
      .catch((err) => this.logger.error(err.message));
  }
  @On('guildDelete')
  async onGuildLeave(guild: Guild): Promise<void> {
    this.logger.log(
      `Left ${guild.name}\nTotal: ${guild.client.guilds.cache.size}`
    );
  }
}
