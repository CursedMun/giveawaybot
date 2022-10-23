import { On, Once } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Client, Collection, GuildMember, Invite } from 'discord.js';
import { GiveawayService } from '../providers/giveaway.service';
import { InviteService } from '../providers/invite.service';

@Injectable()
export class GiveawayInviteModule {
  // private inviteMap = {} as Record<string, Invite[]>;
  // constructor(
  //   private readonly giveawayService: GiveawayService,
  //   private readonly inviteService: InviteService
  // ) {}
  // private readonly logger = new Logger(GiveawayInviteModule.name);
  // @Once('ready')
  // async onReady(client: Client): Promise<void> {
  //   try {
  //     const inviteGiveaways = await this.giveawayService.giveawayService.find({
  //       ended: false,
  //       additionalCondition: 'invite'
  //     });
  //     if (!inviteGiveaways.length) return;
  //     const guilds = inviteGiveaways.map((x) => x.guildID);
  //     const fetchedGuilds = await Promise.all(
  //       guilds.map((x) => client.guilds.cache.get(x) ?? client.guilds.fetch(x))
  //     );
  //     const invites = await Promise.all(
  //       fetchedGuilds.map((x) => x.invites.fetch())
  //     );
  //     const res = invites
  //       .map((invites) => {
  //         return invites
  //           .map((invite) => {
  //             if (!invite.guild) return;
  //             const inviteTimestamp = invite.createdTimestamp ?? 0;
  //             const giveawayTimestamp =
  //               inviteGiveaways.find((x) => x.guildID == invite.guild?.id)
  //                 ?.createdTick ?? 0;
  //             console.log(
  //               inviteTimestamp,
  //               giveawayTimestamp,
  //               inviteTimestamp < giveawayTimestamp
  //             );
  //             if (inviteTimestamp < giveawayTimestamp) return;
  //             console.log('true');
  //             return { [invite.guild.id ?? '']: [invite] };
  //           })
  //           .filter(Boolean);
  //       })
  //       .flat(1)
  //       .reduce((acc, cur) => {
  //         if (!cur) return acc;
  //         const key = Object.keys(cur)[0];
  //         acc = {
  //           ...acc,
  //           [key]: [(acc || [])[key], ...cur[key]].filter(Boolean)
  //         };
  //         return acc;
  //       }, {});
  //     if (res == undefined) return;
  //     this.inviteMap = res;
  //   } catch (e) {
  //     this.logger.error(e);
  //   }
  // }
  // @On('inviteCreate')
  // async onInviteCreate(invite: Invite): Promise<void> {
  //   console.log(invite);
  //   if (!invite.guild) return;
  //   const inviteGiveaways = await this.giveawayService.giveawayService.find({
  //     ended: false,
  //     additionalCondition: 'invite'
  //   });
  //   if (!inviteGiveaways.length) return;
  //   if (!inviteGiveaways.some((x) => x.guildID == invite.guild?.id)) return;
  //   const participants = inviteGiveaways.flatMap((x) => x.participants);
  //   if (participants.find((x) => x.ID === invite.inviterId)) {
  //     this.inviteMap[invite.guild.id] = [
  //       ...(this.inviteMap[invite.guild.id] || []),
  //       invite
  //     ];
  //   }
  // }
  // @On('inviteDelete')
  // async onInviteDelete(invite: Invite): Promise<void> {
  //   if (!invite.guild) return;
  //   const doc = this.inviteMap[invite.guild.id];
  //   if (doc) {
  //     doc.splice(
  //       doc.findIndex((x) => x.code == invite.code),
  //       1
  //     );
  //   }
  // }
  // @On('guildMemberAdd')
  // async onGuildMemberAdd(member: GuildMember): Promise<void> {
  //   const guilds = Object.keys(this.inviteMap);
  //   if (!guilds.includes(member.guild.id)) return;
  //   const currentInvites = (await member.guild.invites
  //     .fetch({ cache: false })
  //     .catch(() => new Collection())) as Collection<string, Invite>;
  //   const currentInvitesData = currentInvites.map((x) => x);
  //   const inviteGiveaways = await this.giveawayService.giveawayService.find({
  //     ended: false,
  //     additionalCondition: 'invite'
  //   });
  //   const usedInvite = this.compareInvitesCache(
  //     this.inviteMap[member.guild.id],
  //     currentInvitesData
  //   );
  //   if (!usedInvite || !usedInvite.inviterId) return;
  //   try {
  //     await Promise.all([
  //       await this.giveawayService.giveawayService.GiveawayModel.updateMany(
  //         {
  //           ID: { $in: inviteGiveaways.map((x) => x.ID) },
  //           participants: {
  //             $elemMatch: { ID: usedInvite.inviterId }
  //           }
  //         },
  //         { $inc: { 'participants.$.number': 1 } }
  //       ),
  //       await this.inviteService.createInvite(
  //         member.id,
  //         usedInvite.inviterId,
  //         usedInvite.code
  //       )
  //     ]);
  //     this.inviteMap[member.guild.id].splice(
  //       0,
  //       this.inviteMap[member.guild.id].length,
  //       ...currentInvitesData
  //     );
  //   } catch (e) {
  //     this.logger.error(e);
  //   }
  // }
  // @On('guildMemberRemove')
  // async onGuildmemberRemove(member: GuildMember) {
  //   const guilds = Object.keys(this.inviteMap);
  //   if (!guilds.includes(member.guild.id)) return;
  //   const wasInvited = await this.inviteService.getInvite(member.id);
  //   if (!wasInvited) return;
  //   try {
  //     await Promise.all([
  //       await this.giveawayService.giveawayService.GiveawayModel.updateMany(
  //         {
  //           participants: {
  //             $elemMatch: { ID: wasInvited.inviterID }
  //           }
  //         },
  //         { $inc: { 'participants.$.number': -1 } }
  //       ),
  //       await this.inviteService.deleteInvite(member.id)
  //     ]);
  //   } catch (e) {
  //     this.logger.error(e);
  //   }
  // }
  // private compareInvitesCache = (
  //   cachedInvites: Invite[],
  //   currentInvites: Invite[]
  // ) => {
  //   try {
  //     const findUsedInvite = currentInvites.find((currentInvite) => {
  //       const cachedInvite = cachedInvites.find(
  //         (cachedInvite) => cachedInvite.code === currentInvite.code
  //       );
  //       if (!cachedInvite) return false;
  //       if (
  //         typeof cachedInvite.uses !== 'number' ||
  //         typeof currentInvite.uses !== 'number'
  //       )
  //         return false;
  //       return currentInvite.uses > cachedInvite.uses;
  //     });
  //     return findUsedInvite;
  //   } catch (e) {
  //     return null;
  //   }
  // };
}
