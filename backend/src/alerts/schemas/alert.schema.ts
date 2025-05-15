import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AlertDocument = Alert & Document;

export class Comment {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  user: string;
}

export class StatusHistory {
  @Prop({ required: true })
  status: string;

  @Prop()
  notes: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  user: string;
}

@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, default: 'medium' })
  severity: string;

  @Prop({ required: true, default: 'open' })
  status: string;

  @Prop({ required: true })
  source: string;

  @Prop()
  type: string;

  @Prop()
  category: string;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }] })
  eventIds: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Entity' })
  entityId: string;

  @Prop()
  ipAddress: string;

  @Prop()
  sourceIp: string;

  @Prop()
  destinationIp: string;

  @Prop()
  protocol: string;

  @Prop()
  port: number;

  @Prop({ default: false })
  isCorrelated: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CorrelationRule' })
  correlationRuleId: string;

  @Prop()
  tactic: string;

  @Prop()
  technique: string;

  @Prop()
  mitreAttackUrl: string;

  @Prop()
  priority: number;

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop({ type: Object })
  location: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  @Prop({ type: [Comment] })
  comments: Comment[];

  @Prop({ type: [StatusHistory] })
  statusHistory: StatusHistory[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assignedTo: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: string;

  @Prop()
  resolvedAt: Date;

  @Prop()
  closedAt: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Indexes for faster queries
AlertSchema.index({ severity: 1 });
AlertSchema.index({ status: 1 });
AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ entityId: 1 });
AlertSchema.index({ 'tags': 1 });
AlertSchema.index({ source: 1 });
AlertSchema.index({ type: 1 });
AlertSchema.index({ isCorrelated: 1 });
AlertSchema.index({ correlationRuleId: 1 });
AlertSchema.index({ assignedTo: 1 });
AlertSchema.index({ createdBy: 1 });