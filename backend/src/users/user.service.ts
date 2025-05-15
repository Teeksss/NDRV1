import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private saltRounds = 10;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @InjectModel(User.name) private userModel: Model<User>
  ) {
    // Get salt rounds from config
    const configSaltRounds = this.configService.get('auth.saltRounds');
    if (configSaltRounds) {
      this.saltRounds = configSaltRounds;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return this.userModel.findById(id).exec();
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      return this.userModel.findOne({ username }).exec();
    } catch (error) {
      this.logger.error(`Error finding user by username: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return this.userModel.findOne({ email }).exec();
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Find user by reset token
   */
  async findByResetToken(token: string): Promise<User | null> {
    try {
      return this.userModel.findOne({ resetToken: token }).exec();
    } catch (error) {
      this.logger.error(`Error finding user by reset token: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get all users with filters
   */
  async getUsers(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      return this.userModel
        .find(filters, { password: 0, resetToken: 0, resetTokenExpires: 0 })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    try {
      return this.userModel.countDocuments().exec();
    } catch (error) {
      this.logger.error(`Error getting user count: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: any): Promise<User> {
    try {
      // Validate required fields
      if (!userData.username) {
        throw new Error('Username is required');
      }
      
      if (!userData.password) {
        throw new Error('Password is required');
      }
      
      if (!userData.email) {
        throw new Error('Email is required');
      }
      
      // Check if username is taken
      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw new Error('Username is already taken');
      }
      
      // Check if email is taken
      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email is already taken');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
      
      // Create user
      const user = await this.userModel.create({
        ...userData,
        password: hashedPassword,
        createdAt: new Date()
      });
      
      // Emit event
      this.eventEmitter.emit('user.created', {
        userId: user._id,
        username: user.username
      });
      
      // Return user without password
      const { password, ...result } = user.toObject();
      return result as User;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: any): Promise<User | null> {
    try {
      // Don't allow password update through this method
      if (userData.password) {
        delete userData.password;
      }
      
      // Check if username is being changed and if it's taken
      if (userData.username) {
        const existingUsername = await this.findByUsername(userData.username);
        if (existingUsername && existingUsername._id.toString() !== userId) {
          throw new Error('Username is already taken');
        }
      }
      
      // Check if email is being changed and if it's taken
      if (userData.email) {
        const existingEmail = await this.findByEmail(userData.email);
        if (existingEmail && existingEmail._id.toString() !== userId) {
          throw new Error('Email is already taken');
        }
      }
      
      // Update user
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        {
          ...userData,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!user) {
        return null;
      }
      
      // Emit event
      this.eventEmitter.emit('user.updated', {
        userId: user._id,
        username: user.username
      });
      
      // Return user without password
      const { password, resetToken, resetTokenExpires, ...result } = user.toObject();
      return result as User;
    } catch (error) {
      this.logger.error(`Error updating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      
      // Update password
      const result = await this.userModel.updateOne(
        { _id: userId },
        {
          password: hashedPassword,
          updatedAt: new Date()
        }
      ).exec();
      
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Error updating password: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const result = await this.userModel.updateOne(
        { _id: userId },
        { lastLoginAt: new Date() }
      ).exec();
      
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Error updating last login: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await this.userModel.deleteOne({ _id: userId }).exec();
      
      if (result.deletedCount > 0) {
        // Emit event
        this.eventEmitter.emit('user.deleted', { userId });
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Error deleting user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save password reset token
   */
  async saveResetToken(userId: string, token: string, expiresAt: Date): Promise<boolean> {
    try {
      const result = await this.userModel.updateOne(
        { _id: userId },
        {
          resetToken: token,
          resetTokenExpires: expiresAt,
          updatedAt: new Date()
        }
      ).exec();
      
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Error saving reset token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clear password reset token
   */
  async clearResetToken(userId: string): Promise<boolean> {
    try {
      const result = await this.userModel.updateOne(
        { _id: userId },
        {
          $unset: { resetToken: 1, resetTokenExpires: 1 },
          updatedAt: new Date()
        }
      ).exec();
      
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Error clearing reset token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user status (active/inactive)
   */
  async updateUserStatus(userId: string, active: boolean): Promise<User | null> {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        {
          active,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!user) {
        return null;
      }
      
      // Emit event
      this.eventEmitter.emit('user.status_updated', {
        userId: user._id,
        username: user.username,
        active
      });
      
      // Return user without password
      const { password, resetToken, resetTokenExpires, ...result } = user.toObject();
      return result as User;
    } catch (error) {
      this.logger.error(`Error updating user status: ${error.message}`, error.stack);
      throw error;
    }
  }
}