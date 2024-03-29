import { User } from '@mongo/user/user.schema';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { Client, GatewayIntentBits, Options } from 'discord.js';
import { config } from '../utils/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(public readonly userService: MongoUserService) {}
  async getUser(ID: string): Promise<User | null> {
    const user = await this.userService.findOne({ ID });
    return user;
  }
  async getPremiumUsers() {
    this.logger.log('Starting second client');
    try {
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
        await this.verifyPremiums(client);
        setInterval(async () => {
          await this.verifyPremiums(client);
        }, config.ticks.oneMinute * 10);
      });
      //TODO change path to env file
      await client.login(process.env.ALTTOKEN);
    } catch (e) {
      this.logger.error(e);
    }
  }
  async verifyPremiums(client: Client) {
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
      const premUsers = await this.userService.find({
        tier: { $ne: 'default' }
      });
      const IDs = [
        ...premUsers.map((x) => x.ID),
        ...premiumUsers.map((x) => x.id)
      ];
      for (const ID of IDs) {
        const member = members.get(ID);
        if (!member) {
          await this.userService.UserModel.updateOne(
            { ID: ID },
            { tier: 'default' }
          );
          return;
        }
        const role =
          member.roles.cache.get(config.roles.premium.golden) ??
          member.roles.cache.get(config.roles.premium.silver) ??
          null;
        if (
          premUsers.find(
            (x) => x.ID === member.id && x.tier == (role?.name ?? 'default')
          )
        )
          continue;
        const exist = await this.userService.has({ ID: member.id });
        result[!role ? 'deleted' : 'newUsers']++;

        if (exist) {
          await this.userService.UserModel.updateOne(
            { ID: member.id },
            { tier: role?.name ?? '' }
          );
        } else {
          await this.userService.UserModel.create({
            ID: member.id,
            tier: role?.name
          });
        }
      }
      this.logger.log(
        `New users ${result.newUsers} deleted users ${result.deleted}`
      );
    } catch (err) {
      this.logger.error(err);
    }
  }
  async verifyPremium(ownerID: string) {
    const user = await this.userService.findOne({ ID: ownerID });
    if (!user) return 0;
    return user.tier === 'silver' ? 1 : user.tier === 'golden' ? 2 : 0;
  }
}
