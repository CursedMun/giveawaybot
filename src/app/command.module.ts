import { DiscordModule } from '@discord-nestjs/core';
import { GiveawayModule } from '@mongo';
import { UserModule } from '@mongo/user/user.module';
import { Module } from '@nestjs/common';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';
import { CacheModule } from 'src/cache.module';
import { GiveawayService } from './providers/giveaway.service';
import { UserService } from './providers/user.service';

@InjectDynamicProviders('**/*.command.js')
@Module({
  imports: [
    CacheModule,
    GiveawayModule,
    UserModule,
    DiscordModule.forFeature(),
  ],
  providers: [GiveawayService, UserService],
})
export class CommandModule {}
