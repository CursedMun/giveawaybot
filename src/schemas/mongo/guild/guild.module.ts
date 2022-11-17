import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Guild, GuildSchema } from './guild.schema';
import { MongoGuildService } from './guild.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Guild.name, schema: GuildSchema }])
  ],
  providers: [MongoGuildService],
  exports: [MongoGuildService]
})
export class GuildModule {}
