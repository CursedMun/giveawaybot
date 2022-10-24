import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Locales } from '@src/i18n/i18n-types';
import { Document } from 'mongoose';

export type GuildDocument = Guild & Document;
export interface GuildSettings {
  voiceNotifications: boolean;
  winNotifications: boolean;
}
@Schema()
export class Guild {
  @Prop({ required: true })
  guildID: string;
  @Prop()
  localization: Locales;
}

export const GuildSchema = SchemaFactory.createForClass(Guild);
