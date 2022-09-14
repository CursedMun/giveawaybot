import { DiscordModule } from '@discord-nestjs/core';

import { UserModule } from '@mongo/user/user.module';
import { Module } from '@nestjs/common';
import { GiveawayModule } from '@src/schemas/mongo';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';
import { CacheModule } from 'src/cache.module';
import { GiveawayService } from './providers/giveaway.service';

@InjectDynamicProviders('**/*.pcommand.js')
@Module({
  imports: [
    CacheModule,
    GiveawayModule,
    UserModule,
    DiscordModule.forFeature()
  ],
  providers: [GiveawayService]
})
export class PrefixCommandModule {}
