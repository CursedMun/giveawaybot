import { Invite } from '@mongo/invite/invite.schema';
import { MongoInviteService } from '@mongo/invite/invite.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);
  constructor(public readonly inviteService: MongoInviteService) {}
  async getInvite(userID: string): Promise<Invite | null> {
    const invite = await this.inviteService.findOne({ userID });
    return invite;
  }
  async deleteInvite(userID: string) {
    await this.inviteService.deleteOne({ userID });
  }
  async createInvite(userID: string, inviterID: string, code: string) {
    await this.inviteService.get({
      userID,
      inviterID,
      code
    });
  }
}
