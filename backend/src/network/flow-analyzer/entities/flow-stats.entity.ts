import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class FlowStats extends Document {
  @Prop({ type: Date, required: true })
  timestamp: Date;

  @Prop({ type: Object, required: true })
  period: {
    start: Date;
    end: Date;
    hours: number;
  };

  @Prop({ required: true })
  flowCount: number;

  @Prop({ required: true })
  bytes: number;

  @Prop({ required: true })
  packets: number;

  @Prop()
  uniqueIPCount: number;

  @Prop({ type: Object })
  protocolDistribution: Record<string, {
    count: number;
    bytes: number;
  }>;
}

export const FlowStatsSchema = SchemaFactory.createForClass(FlowStats);