import { CACHE_MANAGER, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cache } from "cache-manager";
import { FilterQuery, Model } from "mongoose";
import { config } from "src/app/utils/config";
import { Guild, GuildDocument } from "./guild.schema";

@Injectable()
export class MongoGuildService {
  private readonly logger = new Logger(MongoGuildService.name);
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in seconds
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectModel(Guild.name)
    public GuildModel: Model<GuildDocument>
  ) {}
  async get(ID: string, ttl?: number) {
    const cacheKey = `guilds_get_${ID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let guild = await this.GuildModel.findOne({
          ID,
        });
        if (!guild) {
          guild = await this.GuildModel.create({
            ID,
          });
        }
        return guild;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async setCacheForGuild(id: string, value: string, ttl?: number) {
    this.cache.set(id, value, {
      ttl: config.ticks.oneMonth / 1e3,
    });
  }
  async setcache(id: string, value: any, ttl?: number) {
    this.cache.set(id, value, { ttl: config.ticks.oneMonth / 1e3 });
  }
  async getCache(id: string): Promise<any> {
    return await this.cache.get(id);
  }
  async findOne(
    data: FilterQuery<GuildDocument>,
    force?: boolean,
    ttl?: number
  ) {
    const cacheKey = `guilds_findOne_${Object.values(data).join("_")}`;
    if (force) return await this.GuildModel.findOne(data).lean();
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let guild = await this.GuildModel.findOne(data).lean();
        return guild;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async has(data: FilterQuery<GuildDocument>, ttl?: number) {
    const cacheKey = `guilds_has_${Object.values(data).join("_")}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let guild = await this.GuildModel.findOne(data)
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
    const cacheKey = `guilds_count_${Object.values(data).join("_")}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        return await this.GuildModel.find(data).countDocuments().lean();
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async find(
    data: FilterQuery<GuildDocument>,
    ttl?: number
  ): Promise<Guild[]> {
    const cacheKey = `guilds_find_all`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let guild = await this.GuildModel.find(data).lean();
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
