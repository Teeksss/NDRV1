import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class NotificationChannel extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['email', 'slack', 'webhook'] })
  type: string;

  @Prop({ type: Object, required: true })
  config: {
    recipients?: string[]; // For email
    webhookUrl?: string;   // For Slack
    url?: string;          // For webhook
    headers?: Record<string, string>; // For webhook
    [key: string]: any;
  };

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ type: Date })
  lastTestedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const NotificationChannelSchema = SchemaFactory.createForClass(NotificationChannel);