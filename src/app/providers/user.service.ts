import { InjectDiscordClient } from "@discord-nestjs/core";
import { Injectable, Logger } from "@nestjs/common";
import { Client } from "discord.js";
import { User } from "src/schemas/mongo/user/user.schema";
import { MongoUserService } from "src/schemas/mongo/user/user.service";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    public readonly userService: MongoUserService
  ) {}
  //DataBase communication
  async getUser(ID: string): Promise<User | null> {
    const user = await this.userService.findOne({ ID });
    return user;
  }
}
