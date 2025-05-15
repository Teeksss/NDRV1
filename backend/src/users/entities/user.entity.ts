import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ default: true })
  active: boolean;

  @Prop()
  resetToken: string;

  @Prop({ type: Date })
  resetTokenExpires: Date;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);