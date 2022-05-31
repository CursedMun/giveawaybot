import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
export type GiveawayAccessСondition = "reaction" | "button";
export type GiveawayCondition = "novoice" | "voice";
export type GiveawayDocument = Giveaway & Document;
@Schema()
export class Giveaway {
  @Prop()
  ID: string;
  @Prop()
  prize: string;
  @Prop()
  guildID: string;
  @Prop()
  creatorID: string;
  @Prop()
  channelID: string;
  @Prop()
  messageID: string;
  @Prop()
  accessCondition: GiveawayAccessСondition;
  @Prop()
  condition: GiveawayCondition;
  @Prop()
  winnerCount: number;
  @Prop({default: Date.now()})
  endDate: number;
  @Prop({default: false})
  ended: boolean;
  @Prop()
  createdTick: number;
  @Prop()
  participants: string[];
}

export const GiveawaySchema = SchemaFactory.createForClass(Giveaway);
