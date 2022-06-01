import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CacheModule } from "src/cache.module";
import { Guild, GuildSchema } from "./guild.schema";
import { MongoGuildService } from "./guild.service";

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([
      { name: Guild.name, schema: GuildSchema },
    ]),
  ],
  providers: [MongoGuildService],
  exports: [MongoGuildService],
})
export class GuildModule {}
