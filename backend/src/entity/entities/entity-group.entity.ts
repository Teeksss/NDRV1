import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class EntityGroup extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ enum: ['static', 'dynamic'], default: 'static' })
  type: string;

  @Prop({ type: Object })
  criteria: Record<string, any>;

  @Prop({ type: [String], default: [] })
  entityIds: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const EntityGroupSchema = SchemaFactory.createForClass(EntityGroup);