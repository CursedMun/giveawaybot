import { DiscordModule } from '@discord-nestjs/core';
import { UserModule } from '@mongo/user/user.module';
import { Module } from '@nestjs/common';
import { GiveawayModule } from '@src/schemas/mongo';
import { GuildModule } from '@src/schemas/mongo/guild/guild.module';
import { InviteModule } from '@src/schemas/mongo/invite/invite.module';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';
import { CacheModule } from 'src/cache.module';
import { GiveawayService } from './providers/giveaway.service';
import { InviteService } from './providers/invite.service';
import { UserService } from './providers/user.service';

@InjectDynamicProviders('**/*.event.js')
@Module({
  imports: [
    CacheModule,
    GiveawayModule,
    UserModule,
    InviteModule,
    DiscordModule.forFeature(),
    GuildModule
  ],
  providers: [GiveawayService, UserService, InviteService]
})
export class EventsModule {}
