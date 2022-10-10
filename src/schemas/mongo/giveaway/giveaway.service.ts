import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { config } from '@utils/config';
import { Cache } from 'cache-manager';
import { FilterQuery, Model } from 'mongoose';
import { Giveaway, GiveawayDocument } from './giveaway.schema';
@Injectable()
export class MongoGiveawayService {
  private readonly logger = new Logger(MongoGiveawayService.name);
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in seconds
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectModel(Giveaway.name)
    public GiveawayModel: Model<GiveawayDocument>
  ) {}
  async get(ID: string, ttl?: number) {
    const cacheKey = `giveaways_get_${ID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let giveaway = await this.GiveawayModel.findOne({
          ID
        });
        if (!giveaway) {
          giveaway = await this.GiveawayModel.create({
            ID
          });
        }
        return giveaway;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async setCacheForGuild(id: string, value: string, ttl?: number) {
    this.cache.set(id, value, {
      ttl: config.ticks.oneMonth / 1e3
    });
  }
  async setcache(id: string, value: any, ttl?: number) {
    this.cache.set(id, value, { ttl: config.ticks.oneMonth / 1e3 });
  }
  async getCache(id: string): Promise<any> {
    return await this.cache.get(id);
  }
  async findOne(
    data: FilterQuery<GiveawayDocument>,
    force?: boolean,
    ttl?: number
  ) {
    const cacheKey = `giveaways_findOne_${Object.values(data).join('_')}`;
    if (force) return await this.GiveawayModel.findOne(data).lean();
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const giveaway = await this.GiveawayModel.findOne(data).lean();
        return giveaway;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async has(data: FilterQuery<GiveawayDocument>, ttl?: number) {
    const cacheKey = `giveaways_has_${Object.values(data).join('_')}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const giveaway = await this.GiveawayModel.findOne(data)
          .lean()
          .countDocuments();
        return giveaway > 0;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async create(createGiveawayDto: Partial<Giveaway>): Promise<Giveaway> {
    const createdGiveaway = await this.GiveawayModel.create(createGiveawayDto);
    return createdGiveaway;
  }
  async countDocuments(
    data: FilterQuery<GiveawayDocument>,
    ttl?: number
  ): Promise<number> {
    const cacheKey = `giveaways_count_${Object.values(data).join('_')}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        return await this.GiveawayModel.find(data).countDocuments().lean();
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async find(
    data: FilterQuery<GiveawayDocument>,
    force?: boolean,
    ttl?: number
  ): Promise<Giveaway[]> {
    const cacheKey = `find_giveaways`;
    if (force) return await this.GiveawayModel.find(data).lean();
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const giveaways = await this.GiveawayModel.find(data).lean();
        return giveaways;
      },
      { ttl: 10 }
    );
  }
  async findAll(): Promise<Giveaway[]> {
    return this.GiveawayModel.find();
  }
  async deleteOne(data: FilterQuery<GiveawayDocument>): Promise<any> {
    return this.GiveawayModel.deleteOne(data);
  }
}
