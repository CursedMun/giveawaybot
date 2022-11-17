import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { config } from '@utils/config';
import { Model } from 'mongoose';
import { BaseService } from '../base/BaseService';
import { User } from './user.schema';

@Injectable()
export class MongoUserService extends BaseService<User> {
  private readonly defaulttl = config.ticks.oneMinute / 1e3; // 1m in seconds
  constructor(
    @InjectModel(User.name)
    public UserModel: Model<User>
  ) {
    super(UserModel);
  }
}
