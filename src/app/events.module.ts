import { DiscordModule } from "@discord-nestjs/core";
import { Module } from "@nestjs/common";
import { InjectDynamicProviders, IsObject } from "nestjs-dynamic-providers";
import { AppMiddleware } from "src/app.middleware";

@InjectDynamicProviders({
  pattern: "**/*.event.js",
  filterPredicate: (type) => {
    return IsObject(type);
  },
})
@Module({
  imports: [DiscordModule.forFeature()],
  providers: [AppMiddleware],
})
export class EventsModule {}
