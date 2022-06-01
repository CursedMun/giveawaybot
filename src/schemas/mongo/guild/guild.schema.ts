import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
export type Tier = 'default' | 'bronze' | 'silver' | 'gold' | 'diamond';
export type GuildDocument = Guild & Document;

@Schema()
export class Guild {
  @Prop()
  ID: string;
  @Prop({default: 1})
  tier: Tier;
  @Prop()
  totalGiveaways: number;
}

export const GuildSchema = SchemaFactory.createForClass(Guild);
