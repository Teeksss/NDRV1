import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class CorrelationRule extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  condition: string;

  @Prop({ type: [String], default: [] })
  eventTypes: string[];

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' })
  severity: string;

  @Prop({ required: true, default: 3600 })
  timeWindowSeconds: number;

  @Prop({ type: Object })
  alertTemplate: {
    title: string;
    description: string;
    metadata: Record<string, any>;
  };

  @Prop()
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  suppressDuplicates: boolean;

  @Prop({ default: 300 })
  suppressionWindowSeconds: number;

  @Prop({ default: 0 })
  minimumThreshold: number;

  @Prop({ type: Object })
  stats: {
    matchCount: number;
    lastMatchTime: Date;
    alertCount: number;
    averageProcessingTimeMs: number;
  };

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const CorrelationRuleSchema = SchemaFactory.createForClass(CorrelationRule);