import { CACHE_MANAGER, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cache } from "cache-manager";
import { FilterQuery, Model } from "mongoose";
import { config } from "src/app/utils/config";
import { User, UserDocument } from "./user.schema";

@Injectable()
export class MongoUserService {
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in seconds
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectModel(User.name)
    public UserModel: Model<UserDocument>
  ) {}
  async get(ID: string, ttl?: number) {
    const cacheKey = `user_get_${ID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let user = await this.UserModel.findOne({
          ID,
        });
        if (!user) {
          user = await this.UserModel.create({
            ID,
          });
        }
        return user;
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
    data: FilterQuery<UserDocument>,
    force?: boolean,
    ttl?: number
  ) {
    const cacheKey = `user_findOne_${Object.values(data).join("_")}`;
    if (force) return await this.UserModel.findOne(data).lean();
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let user = await this.UserModel.findOne(data).lean();
        return user;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async has(data: FilterQuery<UserDocument>, ttl?: number) {
    const cacheKey = `user_has_${Object.values(data).join("_")}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let user = await this.UserModel.findOne(data)
          .lean()
          .countDocuments();
        return user > 0;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async create(createUserDto: Partial<User>): Promise<User> {
    const createdUser = await this.UserModel.create(createUserDto);
    return createdUser;
  }
  async countDocuments(
    data: FilterQuery<UserDocument>,
    ttl?: number
  ): Promise<number> {
    const cacheKey = `user_count_${Object.values(data).join("_")}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        return await this.UserModel.find(data).countDocuments().lean();
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async find(
    data: FilterQuery<UserDocument>,
    ttl?: number
  ): Promise<User[]> {
    const cacheKey = `user_find_all`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let user = await this.UserModel.find(data).lean();
        return user;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async findAll(): Promise<User[]> {
    return await this.UserModel.find();
  }
  async deleteOne(data: FilterQuery<UserDocument>): Promise<any> {
    return await this.UserModel.deleteOne(data).lean();
  }
}
