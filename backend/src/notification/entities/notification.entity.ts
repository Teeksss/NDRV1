import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Notification extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Alert' })
  alert: MongooseSchema.Types.ObjectId;

  @Prop()
  title: string;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'NotificationChannel' })
  channels: MongooseSchema.Types.ObjectId[];

  @Prop({ type: Date, required: true })
  timestamp: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);