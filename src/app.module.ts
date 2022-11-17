import { Module } from '@nestjs/common';
import { CommandModule } from './app/command.module';
import { EventsModule } from './app/events.module';
import { PrefixCommandModule } from './app/prefixcommand.module';
import { ClientModule } from './client.module';

@Module({
  imports: [
    ClientModule,
    //Discord
    PrefixCommandModule,
    CommandModule,
    EventsModule
  ],
  providers: []
})
export class AppModule {}
