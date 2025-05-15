import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationTemplateDocument = NotificationTemplate & Document;

@Schema({ timestamps: true })
export class NotificationTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  subject: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  description: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const NotificationTemplateSchema = SchemaFactory.createForClass(NotificationTemplate);

// Create compound index to ensure unique templates by name+type
NotificationTemplateSchema.index({ name: 1, type: 1 }, { unique: true });

// Create index for enabled status
NotificationTemplateSchema.index({ enabled: 1 });