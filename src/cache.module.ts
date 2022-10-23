import { CacheModule as BaseCacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    BaseCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return process.env.NODE_ENV
          ? {
              store: 'memory' as any,
              host: '',
              port: 0
            }
          : {
              store: redisStore,
              host: configService.get('REDISHOST'),
              port: configService.get('REDISPORT'),
              password: configService.get('REDISPASSWORD')
            };
      },
      inject: [ConfigService]
    })
  ],
  exports: [BaseCacheModule]
})
// implements OnModuleInit
export class CacheModule {}
