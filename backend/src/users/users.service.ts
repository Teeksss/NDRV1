import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private logger: LoggerService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.findByEmail(createUserDto.email);
      
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      
      // Create new user
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
        emailVerified: false,
        isActive: true,
      });
      
      // Save user to database
      const savedUser = await newUser.save();
      this.logger.log(`User created: ${savedUser.email}`, 'UsersService');
      
      return savedUser;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async findAll(query: any = {}): Promise<User[]> {
    const {
      name,
      email,
      role,
      isActive,
      sort = 'createdAt',
      order = 'desc',
      limit = 100,
      page = 1,
    } = query;

    const filter: any = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

    return this.userModel
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken -mfaSecret')
      .exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken -mfaSecret')
      .exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    // If updating email, check if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      
      if (existingUser) {
        throw new BadRequestException('Email is already taken');
      }
      
      // If changing email, set emailVerified to false
      updateUserDto.emailVerified = false;
    }
    
    // Update user
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken -mfaSecret')
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    this.logger.log(`User updated: ${updatedUser.email}`, 'UsersService');
    
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    this.logger.log(`User deleted: ${id}`, 'UsersService');
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    this.logger.log(`Password updated for user: ${updatedUser.email}`, 'UsersService');
  }

  async storeRefreshToken(id: string, refreshToken: string): Promise<void> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { refreshToken })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async clearRefreshTokens(id: string): Promise<void> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { refreshToken: null })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateRefreshToken(id: string, oldToken: string, newToken: string): Promise<void> {
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: id, refreshToken: oldToken },
        { refreshToken: newToken }
      )
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found or invalid refresh token`);
    }
  }

  async validateRefreshToken(id: string, refreshToken: string): Promise<boolean> {
    const user = await this.userModel.findById(id).exec();
    
    if (!user || !user.refreshToken) {
      return false;
    }
    
    return bcrypt.compare(refreshToken, user.refreshToken);
  }

  async storePasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, {
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByPasswordResetToken(token: string): Promise<User> {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, {
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { lastLogin: new Date() })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Increment failed attempts
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    
    // Check if account should be locked
    let lockedUntil = null;
    
    if (failedAttempts >= 5) {
      // Lock account for 15 minutes after 5 failed attempts
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      this.logger.warn(`User account locked due to too many failed login attempts: ${user.email}`, 'UsersService');
    }
    
    // Update user
    await this.userModel
      .findByIdAndUpdate(id, {
        failedLoginAttempts: failedAttempts,
        lockedUntil,
      })
      .exec();
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async logUserActivity(id: string, action: string, details?: Record<string, any>): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Initialize activity logs array if it doesn't exist
    if (!user.activityLogs) {
      user.activityLogs = [];
    }
    
    // Add activity log
    user.activityLogs.push({
      action,
      timestamp: new Date(),
      details: details || {},
    });
    
    // Save user
    await user.save();
  }

  async getUserActivityLogs(id: string): Promise<any[]> {
    const user = await this.userModel
      .findById(id)
      .select('activityLogs')
      .exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user.activityLogs || [];
  }
}