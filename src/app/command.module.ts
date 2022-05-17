import { DiscordModule } from "@discord-nestjs/core";
import { Module } from "@nestjs/common";
import { InjectDynamicProviders, IsObject } from "nestjs-dynamic-providers";
import { GiveawayModule } from "src/schemas/mongo";
import { GiveawayService } from "./providers/giveaway.service";

@InjectDynamicProviders({
  pattern: "**/*.command.js",
  filterPredicate: (type) => IsObject(type),
})
@Module({
  imports: [
    GiveawayModule,
    DiscordModule.forFeature(),
  ],
  providers: [GiveawayService],
})
export class CommandModule {}
