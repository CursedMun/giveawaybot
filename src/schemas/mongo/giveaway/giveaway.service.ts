import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from '../base/BaseService';
import { Giveaway, GiveawayDocument } from './giveaway.schema';
@Injectable()
export class MongoGiveawayService extends BaseService<GiveawayDocument> {
  private readonly logger = new Logger(MongoGiveawayService.name);
  constructor(
    @InjectModel(Giveaway.name)
    public GiveawayModel: Model<GiveawayDocument>
  ) {
    super(GiveawayModel);
  }
}
