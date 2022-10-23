import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  GiveawayAccessСondition,
  GiveawayAdditionalCondition,
  GiveawayVoiceCondition
} from '@src/types/global';
import { Document } from 'mongoose';
export interface IParticipant {
  ID: string;
  number?: number;
}
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
  voiceCondition: GiveawayVoiceCondition;
  @Prop()
  additionalCondition: GiveawayAdditionalCondition;
  //Little clarification it will be the number to guess, the number that is need to invite and the number of messages
  @Prop()
  number: string;
  @Prop()
  prompt: string;
  @Prop()
  winnerCount: number;
  @Prop()
  winners: string[];
  @Prop({ default: Date.now() })
  endDate: number;
  @Prop({ default: false })
  ended: boolean;
  @Prop()
  createdTick: number;
  @Prop()
  participants: IParticipant[];
}

export const GiveawaySchema = SchemaFactory.createForClass(Giveaway);
