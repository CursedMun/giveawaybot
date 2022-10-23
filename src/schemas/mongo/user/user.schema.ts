import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type Tier = 'default' | 'silver' | 'golden' | 'diamond';

export type UserDocument = User & Document;
export interface UserSettings {
  voiceNotifications: boolean;
  winNotifications: boolean;
}
@Schema()
export class User {
  @Prop({ required: true })
  ID: string;
  @Prop({
    default: {
      voiceNotifications: false,
      winNotifications: false
    },
    type: {}
  })
  settings: UserSettings;
  @Prop({ default: 'default', type: String })
  tier: Tier;
}

export const UserSchema = SchemaFactory.createForClass(User);
