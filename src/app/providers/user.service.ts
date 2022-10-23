import { User } from '@mongo/user/user.schema';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { Client, GatewayIntentBits, Options } from 'discord.js';
import { config } from '../utils/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(public readonly userService: MongoUserService) {}
  async getUser(ID: string, force: boolean, ttl: number): Promise<User | null> {
    const user = await this.userService.findOne({ ID }, force, ttl);
    return user;
  }
  async getPremiumUsers() {
    this.logger.log('Starting second client');
    const client = new Client({
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
        VoiceStateManager: 0,
        StageInstanceManager: 0,
        BaseGuildEmojiManager: 0,
        GuildInviteManager: 0,
        GuildBanManager: 0,
        GuildStickerManager: 0,
        GuildEmojiManager: 0,
        GuildScheduledEventManager: 0,
        MessageManager: 0,
        PresenceManager: 0,
        ReactionUserManager: 0,
        ThreadMemberManager: 0,
        ThreadManager: 0
      }),
      intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds]
    });
    client.once('ready', async (client) => {
      this.logger.log('Second client ready');
      // setInterval(async () => {
      this.logger.log('Fetching premium users...');
      const result = {
        deleted: 0,
        newUsers: 0
      };
      try {
        const guild = client.guilds.cache.get(config.ids.devGuild);
        if (!guild) return;
        const members = await guild.members.fetch({}).catch(() => null);
        if (!members) return;
        const premiumUsers = members.filter((member) => {
          return Object.values(config.roles.premium).some((x) =>
            member.roles.cache
              .sort((x) => {
                return x.id === config.roles.premium.golden ? 1 : -1;
              })
              .find((role) => role.id === x)
          );
        });
        const premUsers = await this.userService.findAll();
        for (const user of premiumUsers) {
          const role =
            user[1].roles.cache.get(config.roles.premium.golden) ??
            user[1].roles.cache.get(config.roles.premium.silver) ??
            null;
          if (
            premUsers.find(
              (x) => x.ID === user[1].id && x.tier == (role?.name ?? '')
            )
          )
            continue;
          const exist = await this.userService.has({ ID: user[1].id });
          result[!role ? 'deleted' : 'newUsers']++;

          if (exist) {
            await this.userService.UserModel.updateOne(
              { ID: user[1].id },
              { tier: role?.name ?? '' }
            );
          } else {
            await this.userService.UserModel.create({
              ID: user[1].id,
              tier: role?.name
            });
          }
        }
        this.logger.log(`New users ${result.newUsers}`);
      } catch (err) {
        this.logger.error(err);
      }
      // }, config.ticks.oneMinute);
    });
    //TODO change path to env file
    await client.login(process.env.TOKEN);
  }
  async verifyPremium(ownerID: string) {
    const user = await this.userService.findOne({ ID: ownerID });
    if (!user) return 0;
    return user.tier === 'silver' ? 1 : user.tier === 'golden' ? 2 : 0;
  }
}
