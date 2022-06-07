import {
  CacheModule as BaseCacheModule,
  CACHE_MANAGER,
  Inject,
  Logger,
  Module,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Cache } from "cache-manager";
import * as redisStore from "cache-manager-ioredis";

@Module({
  imports: [
    BaseCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return process.env.NODE_ENV
          ? {
              store: redisStore,
              host: "localhost",
              port: 6379,
            }
          : {
              store: redisStore,
              host: configService.get("REDIS_HOST"),
              port: configService.get("REDIS_PORT"),
              password: configService.get("REDIS_PASSWORD"),
            };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BaseCacheModule],
})
// implements OnModuleInit 
export class CacheModule {
  // private readonly logger = new Logger(CacheModule.name);
  // constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  // public onModuleInit(): any {
  //   // Commands that are interesting to log
  //   const commands = ["get", "set", "del"];
  //   const cache = this.cache;
  //   commands.forEach((commandName) => {
  //     const oldCommand = cache[commandName];
  //     cache[commandName] = async (...args: any[]) => {
  //       // Computes the duration
  //       const start = new Date();
  //       const result = await oldCommand.call(cache, ...args);
  //       const end = new Date();
  //       const duration = end.getTime() - start.getTime();

  //       // Avoid logging the options
  //       args = args.slice(0, 2);
  //       this.logger.log(
  //         `${commandName.toUpperCase()} ${args.join(", ")} - ${duration}ms`
  //       );

  //       return result;
  //     };
  //   });
  // }
}
