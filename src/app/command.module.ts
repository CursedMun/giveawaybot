import { DiscordModule } from '@discord-nestjs/core';

import { UserModule } from '@mongo/user/user.module';
import { Module } from '@nestjs/common';
import { GiveawayModule } from '@src/schemas/mongo';
import { GuildModule } from '@src/schemas/mongo/guild/guild.module';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';
import { GiveawayService } from './providers/giveaway.service';
import { UserService } from './providers/user.service';

@InjectDynamicProviders('**/*.command.js')
@Module({
  imports: [
    GiveawayModule,
    UserModule,
    DiscordModule.forFeature(),
    GuildModule
  ],
  providers: [GiveawayService, UserService]
})
export class CommandModule {}
