import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from 'src/cache.module';
import { Invite, InviteSchema } from './invite.schema';
import { MongoInviteService } from './invite.service';

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }])
  ],
  providers: [MongoInviteService],
  exports: [MongoInviteService]
})
export class InviteModule {}
