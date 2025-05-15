import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class IOC extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  feedId: string;

  @Prop()
  feedName: string;

  @Prop()
  description: string;

  @Prop({ enum: ['red', 'amber', 'green', 'white'], default: 'amber' })
  tlp: string;

  @Prop({ min: 0, max: 100, default: 50 })
  confidence: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Date })
  firstSeen: Date;

  @Prop({ type: Date })
  lastSeen: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const IOCSchema = SchemaFactory.createForClass(IOC);