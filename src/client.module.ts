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
        uri: `mongodb+srv://${configService.get(
          'MONGO_LOGIN'
        )}:${configService.get(
          'MONGO_PASSWORD'
        )}@insomniatests.8ljkr.mongodb.net/${
          process.env.NODE_ENV === 'development' ? 'dev' : 'test'
        }?retryWrites=true&w=majority`
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
                name: '💫 напишите ??invite',
                type: ActivityType.Competing,
                url: 'https://discord.com/api/oauth2/authorize?client_id=960300300038717490&permissions=0&scope=bot'
              }
            ]
          },
          failIfNotExists: true,
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions
          ],
          makeCache: Options.cacheWithLimits({
            ...Options.DefaultMakeCacheSettings,
            ReactionManager: 0
          }),
          sweepers: Options.DefaultSweeperSettings
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
