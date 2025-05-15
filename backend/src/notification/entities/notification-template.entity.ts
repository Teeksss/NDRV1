import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class NotificationTemplate extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  titleTemplate: string;

  @Prop()
  messageTemplate: string;

  @Prop({ type: [String], default: [] })
  channels: string[];

  @Prop({ type: [String], default: [] })
  alertTypes: string[];

  @Prop({ type: [String], default: [] })
  alertSeverities: string[];

  @Prop({ type: [String], default: [] })
  alertSources: string[];

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const NotificationTemplateSchema = SchemaFactory.createForClass(NotificationTemplate);