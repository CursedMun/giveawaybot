import { DiscordModule } from '@discord-nestjs/core/dist/discord.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Intents, Options } from 'discord.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.development.env' : '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb+srv://${configService.get(
          'MONGO_LOGIN',
        )}:${configService.get(
          'MONGO_PASSWORD',
        )}@insomniatests.8ljkr.mongodb.net/?retryWrites=true&w=majority`,
      }),
      inject: [ConfigService],
    }),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        prefix: configService.get('PREFIX') || '!',
        token: configService.get('TOKEN')!,
        discordClientOptions: {
          presence: {
            status: 'online',
            activities: [
              {
                name: '💫 напишите !invite',
                type: 'PLAYING',
                url: 'https://discord.com/api/oauth2/authorize?client_id=960300300038717490&permissions=0&scope=bot',
              },
            ],
          },
          makeCache: Options.cacheWithLimits({
            ...Options.defaultMakeCacheSettings,
            ReactionManager: 0,
          }),
          sweepers: Options.defaultSweeperSettings,

          intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_BANS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_VOICE_STATES,
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
          ],
        },
        registerCommandOptions: [{}],
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [DiscordModule],
})
export class ClientModule {}
