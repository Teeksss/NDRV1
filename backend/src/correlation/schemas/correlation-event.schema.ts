import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CorrelationEventDocument = CorrelationEvent & Document;

@Schema({ timestamps: true })
export class CorrelationEvent {
  @Prop({ required: true, index: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  entityId: string;

  @Prop()
  sourceIp: string;

  @Prop()
  destinationIp: string;

  @Prop({ type: Object })
  data: Record<string, any>;
}

export const CorrelationEventSchema = SchemaFactory.createForClass(CorrelationEvent);

// Indexes for faster queries
CorrelationEventSchema.index({ eventId: 1 }, { unique: true });
CorrelationEventSchema.index({ eventType: 1 });
CorrelationEventSchema.index({ timestamp: -1 });
CorrelationEventSchema.index({ entityId: 1 });
CorrelationEventSchema.index({ sourceIp: 1 });
CorrelationEventSchema.index({ destinationIp: 1 });
CorrelationEventSchema.index({ timestamp: -1, entityId: 1 });
CorrelationEventSchema.index({ timestamp: -1, sourceIp: 1 });
CorrelationEventSchema.index({ timestamp: -1, destinationIp: 1 });