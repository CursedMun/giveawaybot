import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type Tier = 'default' | 'silver' | 'golden' | 'diamond';

export type InviteDocument = Invite & Document;
export interface InviteSettings {
  voiceNotifications: boolean;
  winNotifications: boolean;
}
@Schema()
export class Invite {
  @Prop({ required: true })
  userID: string;
  @Prop({ required: true })
  inviterID: string;
  @Prop({ required: true })
  code: string;
  @Prop({ default: Date.now() })
  createdTick: number;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
