import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invite, InviteSchema } from './invite.schema';
import { MongoInviteService } from './invite.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }])
  ],
  providers: [MongoInviteService],
  exports: [MongoInviteService]
})
export class InviteModule {}
