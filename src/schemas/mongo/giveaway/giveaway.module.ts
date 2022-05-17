import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CacheModule } from "src/cache.module";
import { Giveaway, GiveawaySchema } from "./giveaway.schema";
import { MongoGiveawayService } from "./giveaway.service";

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([
      { name: Giveaway.name, schema: GiveawaySchema },
    ]),
  ],
  providers: [MongoGiveawayService],
  exports: [MongoGiveawayService],
})
export class GiveawayModule {}
