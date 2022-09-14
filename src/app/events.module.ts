import { DiscordModule } from '@discord-nestjs/core';
import { GiveawayModule } from '@mongo';
import { UserModule } from '@mongo/user/user.module';
import { Module } from '@nestjs/common';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';
import { AppMiddleware } from 'src/app.middleware';
import { CacheModule } from 'src/cache.module';
import { GiveawayService } from './providers/giveaway.service';
import { UserService } from './providers/user.service';

@InjectDynamicProviders('**/*.event.js')
@Module({
  imports: [
    CacheModule,
    GiveawayModule,
    UserModule,
    DiscordModule.forFeature(),
  ],
  providers: [AppMiddleware, GiveawayService, UserService],
})
export class EventsModule {}
