import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
export type UserAccessСondition = "reaction" | "button";
export type UserCondition = "novoice" | "voice";
export type UserDocument = User & Document;
@Schema()
export class User {
  @Prop()
  ID: string;
  @Prop()
  notify: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
