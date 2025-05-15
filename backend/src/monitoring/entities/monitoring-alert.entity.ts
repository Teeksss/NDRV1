import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class MonitoringAlert extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  metric: string;

  @Prop({ required: true })
  threshold: number;

  @Prop({ required: true, enum: ['>', '<', '>=', '<=', '==', '!='] })
  condition: string;

  @Prop()
  duration: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' })
  severity: string;

  @Prop({ type: [String], default: [] })
  notificationChannels: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ type: Date })
  lastTriggeredAt: Date;
}

export const MonitoringAlertSchema = SchemaFactory.createForClass(MonitoringAlert);