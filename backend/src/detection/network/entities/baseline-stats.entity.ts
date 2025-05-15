import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BaselineStats extends Document {
  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true, enum: ['source', 'destination'] })
  direction: string;

  @Prop({ default: 0 })
  totalFlows: number;

  @Prop({ default: 0 })
  totalBytes: number;

  @Prop({ default: 0 })
  totalPackets: number;

  @Prop({ default: 0 })
  avgBytesPerFlow: number;

  @Prop({ default: 0 })
  avgPacketsPerFlow: number;

  @Prop({ type: [Number], default: [] })
  commonPorts: number[];

  @Prop({ type: [String], default: [] })
  commonProtocols: string[];

  @Prop({ type: [String], default: [] })
  commonDestinations: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const BaselineStatsSchema = SchemaFactory.createForClass(BaselineStats);