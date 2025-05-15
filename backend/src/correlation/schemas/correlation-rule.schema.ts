import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CorrelationRuleDocument = CorrelationRule & Document;

export class HistoryEntry {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  user: string;

  @Prop({ type: Object })
  details: Record<string, any>;
}

export class SequenceStage {
  @Prop()
  name: string;

  @Prop({ type: [Object], required: true })
  conditions: any[];

  @Prop({ default: false })
  multipleMatches: boolean;
}

export class Aggregation {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  field: string;

  @Prop({ type: [Object] })
  filters: any[];

  @Prop()
  threshold: number;

  @Prop()
  operator: string;
}

export class ActionParameter {
  @Prop({ type: Object })
  parameters: Record<string, any>;

  @Prop({ required: true })
  type: string;
}

@Schema({ timestamps: true })
export class CorrelationRule {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, default: 'simple' })
  type: string;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ type: [String] })
  eventTypes: string[];

  @Prop({ required: true, default: 'medium' })
  severity: string;

  @Prop()
  category: string;

  @Prop({ type: [Object], required: true })
  conditions: any[];

  @Prop({ type: [ActionParameter] })
  actions: ActionParameter[];

  @Prop()
  timeWindow: number;

  @Prop()
  threshold: number;

  @Prop({ type: [SequenceStage] })
  sequence: SequenceStage[];

  @Prop({ type: [Aggregation] })
  aggregations: Aggregation[];

  @Prop({ type: Object })
  pattern: Record<string, any>;

  @Prop({ type: [String] })
  tags: string[];

  @Prop()
  tactic: string;

  @Prop()
  technique: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: [HistoryEntry] })
  history: HistoryEntry[];

  @Prop({ default: 0 })
  triggerCount: number;

  @Prop()
  lastTriggeredAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: string;
}

export const CorrelationRuleSchema = SchemaFactory.createForClass(CorrelationRule);

// Indexes for faster queries
CorrelationRuleSchema.index({ name: 1 }, { unique: true });
CorrelationRuleSchema.index({ type: 1 });
CorrelationRuleSchema.index({ enabled: 1 });
CorrelationRuleSchema.index({ severity: 1 });
CorrelationRuleSchema.index({ category: 1 });
CorrelationRuleSchema.index({ tags: 1 });
CorrelationRuleSchema.index({ triggerCount: -1 });
CorrelationRuleSchema.index({ lastTriggeredAt: -1 });
CorrelationRuleSchema.index({ 'eventTypes': 1 });