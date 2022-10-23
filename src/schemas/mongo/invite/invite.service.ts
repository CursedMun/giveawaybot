import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { config } from '@utils/config';
import { Cache } from 'cache-manager';
import { FilterQuery, Model } from 'mongoose';
import { Invite, InviteDocument } from './invite.schema';

@Injectable()
export class MongoInviteService {
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in seconds
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectModel(Invite.name)
    public InviteModel: Model<InviteDocument>
  ) {}
  async get(userID: string, ttl?: number) {
    const cacheKey = `invite_get_${userID}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        let Invite = await this.InviteModel.findOne({
          userID
        });
        if (!Invite) {
          Invite = await this.InviteModel.create({
            userID
          });
        }
        return Invite;
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
    data: FilterQuery<InviteDocument>,
    force?: boolean,
    ttl?: number
  ) {
    const cacheKey = `invite_findOne_${Object.values(data).join('_')}`;
    if (force)
      return await this.InviteModel.findOne(
        data,
        {},
        { sort: { createdTick: -1 } }
      ).lean();
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const Invite = await this.InviteModel.findOne(
          data,
          {},
          { sort: { createdTick: -1 } }
        ).lean();
        return Invite;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async has(data: FilterQuery<InviteDocument>, ttl?: number) {
    const cacheKey = `invite_has_${Object.values(data).join('_')}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const Invite = await this.InviteModel.findOne(data)
          .lean()
          .countDocuments();
        return Invite > 0;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async create(createInviteDto: Partial<Invite>): Promise<Invite> {
    const createdInvite = await this.InviteModel.create(createInviteDto);
    return createdInvite;
  }
  async countDocuments(
    data: FilterQuery<InviteDocument>,
    ttl?: number
  ): Promise<number> {
    const cacheKey = `invite_count_${Object.values(data).join('_')}`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        return await this.InviteModel.find(data).countDocuments().lean();
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async find(
    data: FilterQuery<InviteDocument>,
    ttl?: number
  ): Promise<Invite[]> {
    const cacheKey = `invite_find_all`;
    return await this.cache.wrap(
      cacheKey,
      async () => {
        const Invite = await this.InviteModel.find(data).lean();
        return Invite;
      },
      { ttl: ttl ?? this.defaulttl }
    );
  }
  async findAll(): Promise<Invite[]> {
    return await this.InviteModel.find();
  }
  async deleteOne(data: FilterQuery<InviteDocument>): Promise<any> {
    return await this.InviteModel.deleteOne(data, {
      sort: { createdTick: -1 }
    }).lean();
  }
}
