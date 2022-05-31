import { DiscordModule } from "@discord-nestjs/core";
import { Module } from "@nestjs/common";
import { InjectDynamicProviders, IsObject } from "nestjs-dynamic-providers";
import { CacheModule } from "src/cache.module";
import { GiveawayModule } from "src/schemas/mongo";
import { GiveawayService } from "./providers/giveaway.service";

@InjectDynamicProviders({
  pattern: "**/*.pcommand.js",
  filterPredicate: (type) => IsObject(type),
})
@Module({
  imports: [
    CacheModule,
    GiveawayModule,
    DiscordModule.forFeature(),
  ],
  providers: [GiveawayService],
})
export class PrefixCommandModule {
}
