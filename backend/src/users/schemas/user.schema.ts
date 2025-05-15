import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

export class ActivityLog {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object })
  details: Record<string, any>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationToken: string;

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  @Prop()
  passwordChangedAt: Date;

  @Prop()
  refreshToken: string;

  @Prop()
  mfaSecret: string;

  @Prop({ default: false })
  mfaEnabled: boolean;

  @Prop()
  lastLogin: Date;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockedUntil: Date;

  @Prop()
  avatarUrl: string;

  @Prop()
  phone: string;

  @Prop({ type: [ActivityLog] })
  activityLogs: ActivityLog[];

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Object })
  preferences: Record<string, any>;

  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for faster queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });