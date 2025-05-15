import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EntityDocument = Entity & Document;

@Schema({ timestamps: true })
export class Entity {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: 'active' })
  status: string;

  @Prop()
  ipAddress: string;

  @Prop()
  macAddress: string;

  @Prop()
  hostname: string;

  @Prop()
  domain: string;

  @Prop()
  os: string;

  @Prop()
  osVersion: string;

  @Prop()
  location: string;

  @Prop()
  subnet: string;

  @Prop()
  vlan: string;

  @Prop()
  manufacturer: string;

  @Prop()
  model: string;

  @Prop()
  serialNumber: string;

  @Prop()
  firmware: string;

  @Prop()
  lastSeen: Date;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: Object })
  metrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    uptime?: number;
    connections?: number;
    trafficIn?: number;
    trafficOut?: number;
  };

  @Prop({ type: [{ key: String, value: String }] })
  attributes: Array<{ key: string; value: string }>;

  @Prop({ type: [String] })
  services: string[];

  @Prop({ type: [Number] })
  openPorts: number[];

  @Prop({ type: [{ 
    protocol: String, 
    port: Number, 
    service: String, 
    version: String 
  }] })
  portScan: Array<{
    protocol: string;
    port: number;
    service: string;
    version: string;
  }>;

  @Prop({ type: [{ 
    timestamp: Date, 
    event: String, 
    details: Object 
  }] })
  history: Array<{
    timestamp: Date;
    event: string;
    details: Record<string, any>;
  }>;

  @Prop({ type: String, ref: 'User' })
  createdBy: string;

  @Prop({ type: String, ref: 'User' })
  updatedBy: string;

  @Prop({ type: Boolean, default: false })
  isManaged: boolean;

  @Prop({ type: Object })
  coordinates: {
    x?: number;
    y?: number;
  };

  @Prop({ type: String })
  group: string;

  @Prop({ type: Number, default: 0 })
  riskScore: number;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);

// Indexes for efficient queries
EntitySchema.index({ name: 1 }, { unique: true });
EntitySchema.index({ ipAddress: 1 });
EntitySchema.index({ type: 1 });
EntitySchema.index({ status: 1 });
EntitySchema.index({ lastSeen: -1 });
EntitySchema.index({ 'tags': 1 });
EntitySchema.index({ name: 'text', description: 'text', ipAddress: 'text' });