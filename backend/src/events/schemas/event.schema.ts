import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  type: string;

  @Prop()
  description: string;

  @Prop()
  source: string;

  @Prop()
  sourceIp: string;

  @Prop()
  destinationIp: string;

  @Prop()
  protocol: string;

  @Prop()
  port: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Entity' })
  entityId: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop()
  category: string;

  @Prop()
  username: string;

  @Prop()
  application: string;

  @Prop()
  direction: string;

  @Prop()
  country: string;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  status: string;

  @Prop()
  bytesIn: number;

  @Prop()
  bytesOut: number;

  @Prop()
  duration: number;

  @Prop()
  action: string;

  @Prop()
  severity: string;

  @Prop({ type: Boolean, default: false })
  isProcessed: boolean;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Alert' }] })
  relatedAlerts: string[];

  @Prop({ type: String, ref: 'User' })
  createdBy: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Indexes for efficient queries
EventSchema.index({ type: 1 });
EventSchema.index({ timestamp: -1 });
EventSchema.index({ sourceIp: 1 });
EventSchema.index({ destinationIp: 1 });
EventSchema.index({ entityId: 1 });
EventSchema.index({ protocol: 1 });
EventSchema.index({ 'tags': 1 });
EventSchema.index({ description: 'text' });