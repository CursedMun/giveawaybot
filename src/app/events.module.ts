import { DiscordModule } from "@discord-nestjs/core";
import { Module } from "@nestjs/common";
import { InjectDynamicProviders, IsObject } from "nestjs-dynamic-providers";
import { AppMiddleware } from "src/app.middleware";
import { CacheModule } from "src/cache.module";
import { GiveawayModule } from "src/schemas/mongo";
import { UserModule } from "src/schemas/mongo/user/user.module";
import { GiveawayService } from "./providers/giveaway.service";
import { UserService } from "./providers/user.service";

@InjectDynamicProviders({
  pattern: "**/*.event.js",
  filterPredicate: (type) => {
    return IsObject(type);
  },
})
@Module({
  imports: [
    CacheModule,
    GiveawayModule,
    UserModule,
    DiscordModule.forFeature(),
  ],
  providers: [AppMiddleware, GiveawayService,UserService],
})
export class EventsModule {}
