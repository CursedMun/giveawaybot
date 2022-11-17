import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { config } from '@utils/config';
import { Model } from 'mongoose';
import { BaseService } from '../base/BaseService';
import { Guild, GuildDocument } from './guild.schema';

@Injectable()
export class MongoGuildService extends BaseService<GuildDocument> {
  constructor(
    @InjectModel(Guild.name)
    public GuildModel: Model<GuildDocument>
  ) {
    super(GuildModel);
  }
  async getLocalization(guildID: string | null) {
    if (!guildID) return null;
    const guild = await this.GuildModel.findOne({ guildID }).lean();
    if (!guild) return null;
    return guild.localization;
  }
}
