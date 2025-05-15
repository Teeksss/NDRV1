import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class AlertTemplate extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  titleTemplate: string;

  @Prop()
  descriptionTemplate: string;

  @Prop({ enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' })
  severity: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  source: string;

  @Prop({ type: Object })
  metadataTemplate: Record<string, any>;

  @Prop({ type: [String], default: [] })
  notificationChannels: string[];

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const AlertTemplateSchema = SchemaFactory.createForClass(AlertTemplate);