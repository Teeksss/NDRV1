import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class AggregatedEvent extends Document {
  @Prop()
  type: string;

  @Prop()
  source: string;

  @Prop({ required: true })
  count: number;

  @Prop({ type: Date, required: true })
  firstTimestamp: Date;

  @Prop({ type: Date, required: true })
  lastTimestamp: Date;

  @Prop()
  aggregationKey: string;

  @Prop()
  sourceIp: string;

  @Prop()
  destinationIp: string;

  @Prop()
  status: string;

  @Prop()
  severity: string;

  @Prop()
  entityId: string;

  @Prop({ type: [Object] })
  sampleEvents: any[];

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const AggregatedEventSchema = SchemaFactory.createForClass(AggregatedEvent);