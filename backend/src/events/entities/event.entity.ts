import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Event extends Document {
  @Prop()
  type: string;

  @Prop()
  source: string;

  @Prop()
  description: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop()
  sourceIp: string;

  @Prop()
  destinationIp: string;

  @Prop()
  protocol: string;

  @Prop()
  sourcePort: number;

  @Prop()
  destinationPort: number;

  @Prop()
  status: string;

  @Prop()
  severity: string;

  @Prop()
  entityId: string;

  @Prop()
  entityType: string;

  @Prop()
  username: string;

  @Prop()
  hostname: string;

  @Prop()
  domainName: string;

  @Prop()
  application: string;

  @Prop()
  queryType: string;

  @Prop()
  query: string;

  @Prop()
  method: string;

  @Prop()
  url: string;

  @Prop()
  statusCode: number;

  @Prop()
  userAgent: string;

  @Prop()
  fileName: string;

  @Prop()
  fileType: string;

  @Prop()
  filePath: string;

  @Prop()
  fileSize: number;

  @Prop()
  fileHash: string;

  @Prop()
  action: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Object })
  geoip: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export const EventSchema = SchemaFactory.createForClass(Event);