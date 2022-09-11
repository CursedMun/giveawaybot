import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';
import { CacheModule } from 'src/cache.module';
import { GiveawayModule } from 'src/schemas/mongo';
import { UserModule } from 'src/schemas/mongo/user/user.module';
import { GiveawayService } from './providers/giveaway.service';

@InjectDynamicProviders('**/*.pcommand.js')
@Module({
  imports: [
    CacheModule,
    GiveawayModule,
    UserModule,
    DiscordModule.forFeature(),
  ],
  providers: [GiveawayService],
})
export class PrefixCommandModule {}
