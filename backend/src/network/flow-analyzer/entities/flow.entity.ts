import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Flow extends Document {
  @Prop({ required: true })
  sourceIp: string;

  @Prop({ required: true })
  destinationIp: string;

  @Prop()
  sourcePort: number;

  @Prop()
  destinationPort: number;

  @Prop()
  protocol: string;

  @Prop()
  bytes: number;

  @Prop()
  packets: number;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop()
  duration: number;

  @Prop()
  tcpFlags: number;

  @Prop()
  tos: number;

  @Prop()
  interfaceId: number;

  @Prop()
  vlanId: number;

  @Prop()
  application: string;

  @Prop()
  direction: string;

  @Prop({ type: Object })
  sourceGeo: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  @Prop({ type: Object })
  destinationGeo: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  @Prop()
  sourceEntityId: string;

  @Prop()
  destinationEntityId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const FlowSchema = SchemaFactory.createForClass(Flow);