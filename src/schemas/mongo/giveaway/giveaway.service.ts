import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cache } from "cache-manager";
import { FilterQuery, Model } from "mongoose";
import { config } from "src/app/utils/config";
import { Giveaway, GiveawayDocument } from "./giveaway.schema";

@Injectable()
export class MongoGiveawayService {
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in millis
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
          ID,
        });
        if (!giveaway) {
          giveaway = await this.GiveawayModel.create({
            ID,
          });
        }
        return giveaway;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async findOne(data: FilterQuery<GiveawayDocument>, ttl?: number) {
    const cacheKey = `giveaways_find_${data.ID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let giveaway = await this.GiveawayModel.findOne(data).lean();
        return giveaway;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async has(data: FilterQuery<GiveawayDocument>, ttl?: number) {
    const cacheKey = `giveaways_has_${data.ID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let giveaway = await this.GiveawayModel.findOne(data)
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
    const cacheKey = `giveaways_count_${data.ID}`;
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
    ttl?: number
  ): Promise<Giveaway[]> {
    const cacheKey = `giveaways_find_${data.ID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let Giveaway = await this.GiveawayModel.find(data).lean();
        return Giveaway;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async findAll(): Promise<Giveaway[]> {
    return await this.GiveawayModel.find();
  }
  async deleteOne(data: FilterQuery<GiveawayDocument>): Promise<any> {
    return await this.GiveawayModel.deleteOne(data).lean();
  }
}
