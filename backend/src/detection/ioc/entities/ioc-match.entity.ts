import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class IOCMatch extends Document {
  @Prop({ required: true })
  iocId: string;

  @Prop({ required: true })
  iocType: string;

  @Prop({ required: true })
  iocValue: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  matchField: string;

  @Prop({ required: true })
  matchValue: string;

  @Prop({ type: Object })
  eventData: Record<string, any>;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const IOCMatchSchema = SchemaFactory.createForClass(IOCMatch);