import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from 'src/cache.module';
import { User, UserSchema } from './user.schema';
import { MongoUserService } from './user.service';

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  providers: [MongoUserService],
  exports: [MongoUserService]
})
export class UserModule {}
