import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { config } from '@utils/config';
import { Model } from 'mongoose';
import { BaseService } from '../base/BaseService';
import { Invite, InviteDocument } from './invite.schema';

@Injectable()
export class MongoInviteService extends BaseService<InviteDocument> {
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in seconds
  constructor(
    @InjectModel(Invite.name)
    public InviteModel: Model<InviteDocument>
  ) {
    super(InviteModel);
  }
}
