import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Report extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' })
  status: string;

  @Prop({ type: Object })
  parameters: Record<string, any>;

  @Prop()
  filePath: string;

  @Prop()
  fileName: string;

  @Prop()
  fileSize: number;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop()
  error: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);