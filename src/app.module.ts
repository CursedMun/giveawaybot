import { Module } from "@nestjs/common";
import { CommandModule } from "./app/command.module";
import { EventsModule } from "./app/events.module";
import { CacheModule } from "./cache.module";
import { ClientModule } from "./client.module";

// function channelFilter(channel: AnyChannel) {
//   return channel instanceof TextChannel
//     ? !channel.lastMessageId ||
//         SnowflakeUtil.timestampFrom(channel.lastMessageId) <
//           Date.now() - 3600000
//     : false;
// }
@Module({
  imports: [
    CacheModule,
    ClientModule,
    //Discord
    CommandModule,
    EventsModule,
  ],
  providers: [],
})
export class AppModule {}
