import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
export type UserAccessСondition = "reaction" | "button";
export type UserCondition = "novoice" | "voice";
export type UserDocument = User & Document;
export interface UserSettings {
  voiceNotifications: boolean;
  winNotifications: boolean;
}
@Schema()
export class User {
  @Prop({required: true})
  ID: string;
  @Prop({
    default: {
      voiceNotifications: false,
      winNotifications: false,
    },
    type: {}
  })
  settings: UserSettings;
}

export const UserSchema = SchemaFactory.createForClass(User);
