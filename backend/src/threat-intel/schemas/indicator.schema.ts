import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type IndicatorDocument = Indicator & Document;

@Schema({ timestamps: true })
export class Indicator {
  @Prop({ required: true, index: true })
  type: string;

  @Prop({ required: true, index: true })
  value: string;

  @Prop({ required: true, index: true })
  feedId: string;

  @Prop({ required: true })
  feedName: string;

  @Prop()
  category: string;

  @Prop({ default: 'medium' })
  severity: string;

  @Prop({ type: Number, min: 0, max: 100, default: 70 })
  confidence: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ type: Date, default: Date.now })
  firstSeen: Date;

  @Prop({ type: Date, default: Date.now })
  lastSeen: Date;

  @Prop()
  expiration: Date;

  @Prop()
  description: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: [String] })
  relatedIndicators: string[];
}

export const IndicatorSchema = SchemaFactory.createForClass(Indicator);

// Create compound index for faster lookups
IndicatorSchema.index({ type: 1, value: 1 }, { unique: true });

// Indexes for better query performance
IndicatorSchema.index({ lastSeen: -1 });
IndicatorSchema.index({ category: 1 });
IndicatorSchema.index({ severity: 1 });
IndicatorSchema.index({ confidence: -1 });
IndicatorSchema.index({ enabled: 1 });
IndicatorSchema.index({ tags: 1 });