import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Alert extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' })
  severity: string;

  @Prop({ required: true, enum: ['new', 'in_progress', 'resolved', 'false_positive', 'closed'], default: 'new' })
  status: string;

  @Prop()
  source: string;

  @Prop()
  sourceRef: string;

  @Prop()
  ipAddress: string;

  @Prop()
  entityId: string;

  @Prop()
  entityType: string;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp: Date;

  @Prop()
  assignedTo: string;

  @Prop({ type: Date })
  resolvedAt: Date;

  @Prop()
  resolvedBy: string;

  @Prop({ type: String })
  resolutionNotes: string;

  @Prop({ type: [Object] })
  comments: Array<{
    user: string;
    text: string;
    timestamp: Date;
  }>;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  closedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop()
  correlationId: string;

  @Prop()
  templateId: string;

  @Prop()
  score: number;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);