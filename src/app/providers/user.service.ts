import { User } from '@mongo/user/user.schema';
import { MongoUserService } from '@mongo/user/user.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(public readonly userService: MongoUserService) {}
  //DataBase communication
  async getUser(ID: string, force: boolean, ttl: number): Promise<User | null> {
    const user = await this.userService.findOne({ ID }, force, ttl);
    return user;
  }
}
