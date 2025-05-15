import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class CorrelationSession extends Document {
  @Prop({ required: true })
  ruleId: string;

  @Prop()
  ruleName: string;

  @Prop({ required: true, type: Date })
  firstEventTime: Date;

  @Prop({ required: true, type: Date })
  lastEventTime: Date;

  @Prop({ default: 0 })
  eventCount: number;

  @Prop({ type: [String], default: [] })
  eventIds: string[];

  @Prop({ type: [String], default: [] })
  eventTypes: string[];

  @Prop({ default: false })
  conditionMet: boolean;

  @Prop({ enum: ['active', 'expired', 'alert_generated'], default: 'active' })
  status: string;

  @Prop()
  alertId: string;

  @Prop({ enum: ['critical', 'high', 'medium', 'low', 'info'] })
  severity: string;

  @Prop({ type: Object })
  state: Record<string, any>;

  @Prop({ type: [Object], default: [] })
  sampleEvents: any[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  expiresAt: Date;
}

export const CorrelationSessionSchema = SchemaFactory.createForClass(CorrelationSession);