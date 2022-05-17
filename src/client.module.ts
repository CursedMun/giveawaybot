import { DiscordModule } from "@discord-nestjs/core/dist/discord.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config/dist/config.module";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Intents, Options } from "discord.js";
import { ClientGateway } from "./app/events/client.gateway";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === "development" ? ".development.env" : ".env",
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: process.env.NODE_ENV ?`mongodb://localhost:27017/giveaways` : `mongodb://${configService.get("MONGO_LOGIN")}:${configService.get(
          "MONGO_PASSWORD"
        )}@mongo:27017/giveaways`,
      }),
      inject: [ConfigService],
    }),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        prefix: configService.get("PREFIX") || "!",
        token: configService.get("TOKEN")!,
        discordClientOptions: {
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
          ],
        },
        // removeGlobalCommands: true,
        // registerCommandOptions: [
        //   {
        //     forGuild: configService.get("GUILD_ID_WITH_COMMANDS"),
        //     removeCommandsBefore: true,
        //   },
        // ],
        // //TODO проверить на правильность
        // //how to set permissions to commands
        // slashCommandsPermissions: [
        //   //Profile
        //   {
        //     commandClassType: ProfileCommand,
        //     permissions: Object.values({
        //       ...config.roles.staff,
        //       ...config.roles.privileged,
        //     })
        //       .filter((id) => id != config.roles.staff.Eventer)
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   //Staff
        //   {
        //     commandClassType: ClearCommand,
        //     permissions: [
        //       {
        //         id: config.roles.staff.Admin,
        //         type: ApplicationCommandPermissionTypes.ROLE,
        //         permission: true,
        //       },
        //     ],
        //   },
        //   {
        //     commandClassType: VacationCommand,
        //     permissions: Object.values(config.roles.staff).map((roleId) => {
        //       return {
        //         id: roleId,
        //         type: ApplicationCommandPermissionTypes.ROLE,
        //         permission: true,
        //       };
        //     }),
        //   },
        //   {
        //     commandClassType: BanCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Support].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: MuteCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Support].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: UnbanCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Support].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: UnmuteCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Support].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: InCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Support, roles.Moderator].some(
        //           (y) => y == x
        //         );
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: BansCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Support].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: ChangeGenderCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Moderator].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: VerificationCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Moderator].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: TopCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Moderator].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        //   {
        //     commandClassType: SponsorCommand,
        //     permissions: [
        //       {
        //         id: config.roles.staff.Admin,
        //         type: ApplicationCommandPermissionTypes.ROLE,
        //         permission: true,
        //       },
        //     ],
        //   },
        //   {
        //     commandClassType: ActionCommand,
        //     permissions: Object.values(config.roles.staff)
        //       .filter((x) => {
        //         const roles = config.roles.staff;
        //         return ![roles.Eventer, roles.Support].some((y) => y == x);
        //       })
        //       .map((roleId) => {
        //         return {
        //           id: roleId,
        //           type: ApplicationCommandPermissionTypes.ROLE,
        //           permission: true,
        //         };
        //       }),
        //   },
        // ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ClientGateway],
  exports: [DiscordModule],
})
export class ClientModule {}
