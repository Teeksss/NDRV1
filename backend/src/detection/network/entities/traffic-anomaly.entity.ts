import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TrafficAnomaly extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop()
  flowId: string;

  @Prop()
  sourceIp: string;

  @Prop()
  destinationIp: string;

  @Prop({ enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' })
  severity: string;

  @Prop({ enum: ['active', 'investigating', 'resolved', 'false_positive'], default: 'active' })
  status: string;

  @Prop({ default: 1 })
  occurrences: number;

  @Prop()
  description: string;

  @Prop()
  notes: string;

  @Prop({ type: Date, required: true })
  detectedAt: Date;

  @Prop({ type: Date })
  lastSeenAt: Date;

  @Prop({ type: Date })
  resolvedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const TrafficAnomalySchema = SchemaFactory.createForClass(TrafficAnomaly);