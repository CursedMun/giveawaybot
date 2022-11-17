import { DiscordModule } from '@discord-nestjs/core/dist/discord.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityType, GatewayIntentBits, Options } from 'discord.js';
import { ClientGateway } from './app/events/client.gateaway.event';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.development.env' : '.env'
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGO_URL')
      }),
      inject: [ConfigService]
    }),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        prefix: configService.get('PREFIX') || '??',
        token: configService.get('TOKEN') ?? '',
        discordClientOptions: {
          presence: {
            status: 'online',
            activities: [
              {
                name: '💫 with giveaways',
                type: ActivityType.Playing,
                url: 'https://discord.com/api/oauth2/authorize?client_id=960300300038717490&permissions=0&scope=bot'
              }
            ]
          },
          failIfNotExists: true,
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildInvites
          ],
          makeCache: Options.cacheWithLimits({
            ...Options.DefaultMakeCacheSettings,
            ReactionManager: 0,
            GuildMemberManager: {
              maxSize: 200
            }
          }),
          sweepers: {
            ...Options.DefaultSweeperSettings,
            messages: {
              interval: 3600, // Every hour...
              lifetime: 1800 // Remove messages older than 30 minutes.
            }
          }
        },
        registerCommandOptions: [{}]
      }),
      inject: [ConfigService]
    })
  ],
  providers: [ClientGateway],
  exports: [DiscordModule]
})
export class ClientModule {}
