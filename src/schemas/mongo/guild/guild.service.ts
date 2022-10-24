import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { config } from '@utils/config';
import { Cache } from 'cache-manager';
import { FilterQuery, Model } from 'mongoose';
import { Guild, GuildDocument } from './guild.schema';

@Injectable()
export class MongoGuildService {
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in seconds
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectModel(Guild.name)
    public GuildModel: Model<GuildDocument>
  ) {}
  async get(guildID: string, ttl?: number) {
    const cacheKey = `guild_get_${guildID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let guild = await this.GuildModel.findOne({
          guildID
        });
        if (!guild) {
          guild = await this.GuildModel.create({
            guildID
          });
        }
        return guild;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async setcache(id: string, value: any, ttl?: number) {
    this.cache.set(id, value, { ttl: ttl ?? this.defaulttl });
  }
  async getCache(id: string): Promise<any> {
    return await this.cache.get(id);
  }
  async findOne(
    data: FilterQuery<GuildDocument>,
    force?: boolean,
    ttl?: number
  ) {
    const cacheKey = `guild_findOne_${Object.values(data).join('_')}`;
    if (force) return await this.GuildModel.findOne(data).lean();
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const guild = await this.GuildModel.findOne(data).lean();
        return guild;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async getLocalization(guildID: string | null) {
    if (!guildID) return null;
    const guild = await this.GuildModel.findOne({ guildID }).lean();
    if (!guild) return null;
    return guild.localization;
  }
  async has(data: FilterQuery<GuildDocument>, ttl?: number) {
    const cacheKey = `guild_has_${Object.values(data).join('_')}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const guild = await this.GuildModel.findOne(data)
          .lean()
          .countDocuments();
        return guild > 0;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async create(createGuildDto: Partial<Guild>): Promise<Guild> {
    const createdGuild = await this.GuildModel.create(createGuildDto);
    return createdGuild;
  }
  async countDocuments(
    data: FilterQuery<GuildDocument>,
    ttl?: number
  ): Promise<number> {
    const cacheKey = `guild_count_${Object.values(data).join('_')}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        return await this.GuildModel.find(data).countDocuments().lean();
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async find(data: FilterQuery<GuildDocument>, ttl?: number): Promise<Guild[]> {
    const cacheKey = `guild_find_all`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const guild = await this.GuildModel.find(data).lean();
        return guild;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async findAll(): Promise<Guild[]> {
    return await this.GuildModel.find();
  }
  async deleteOne(data: FilterQuery<GuildDocument>): Promise<any> {
    return await this.GuildModel.deleteOne(data).lean();
  }
}
