import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/schemas/user.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        this.logger.warn(`Failed login attempt for non-existent user: ${email}`, 'AuthService');
        throw new UnauthorizedException('Invalid credentials');
      }
      
      if (!user.isActive) {
        this.logger.warn(`Login attempt for inactive user: ${email}`, 'AuthService');
        throw new UnauthorizedException('User account is deactivated');
      }
      
      // Check if account is locked due to too many failed attempts
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        this.logger.warn(`Login attempt for locked account: ${email}`, 'AuthService');
        throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
      }
      
      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        await this.usersService.incrementFailedLoginAttempts(user.id);
        
        this.logger.warn(`Failed login attempt for user: ${email}`, 'AuthService');
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Reset failed login attempts on successful login
      if (user.failedLoginAttempts > 0) {
        await this.usersService.resetFailedLoginAttempts(user.id);
      }
      
      // Update last login timestamp
      await this.usersService.updateLastLogin(user.id);
      
      // Log user activity
      await this.usersService.logUserActivity(user.id, 'login', {
        ip: null, // This would be set by the controller
        userAgent: null, // This would be set by the controller
      });
      
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Error validating user: ${error.message}`, error.stack, 'AuthService');
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async login(user: User) {
    try {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      
      // Generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(payload),
        this.generateRefreshToken(payload),
      ]);
      
      // Store refresh token hash in database
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await this.usersService.storeRefreshToken(user.id, refreshTokenHash);
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          lastLogin: user.lastLogin,
        },
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Error during login: ${error.message}`, error.stack, 'AuthService');
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(registerDto: RegisterDto) {
    // Check if user with this email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    
    // Create new user
    const newUser = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
      role: 'user', // Default role
    });
    
    // Log user creation
    this.logger.log(`User registered: ${newUser.email}`, 'AuthService');
    
    return newUser;
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      
      // Don't reveal if the user exists or not for security
      if (!user) {
        return;
      }
      
      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now
      
      // Store token in user record
      await this.usersService.storePasswordResetToken(user.id, resetToken, resetTokenExpires);
      
      // In a real application, send an email with the reset link
      // For demo purposes, just log it
      this.logger.log(`Password reset requested for ${email}. Token: ${resetToken}`, 'AuthService');
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in forgot password flow: ${error.message}`, error.stack, 'AuthService');
      // Don't leak information about the error
      return { success: true };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Find user by reset token
      const user = await this.usersService.findByPasswordResetToken(token);
      
      if (!user) {
        throw new BadRequestException('Invalid or expired password reset token');
      }
      
      // Check if token is expired
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new BadRequestException('Password reset token has expired');
      }
      
      // Update password
      await this.usersService.updatePassword(user.id, newPassword);
      
      // Clear reset token
      await this.usersService.clearPasswordResetToken(user.id);
      
      // Log password reset
      this.logger.log(`Password reset completed for user: ${user.email}`, 'AuthService');
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error resetting password: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
      
      // Update password
      await this.usersService.updatePassword(userId, newPassword);
      
      // Log password change
      this.logger.log(`Password changed for user: ${user.email}`, 'AuthService');
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error changing password: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  async logout(userId: string) {
    try {
      // Clear refresh tokens
      await this.usersService.clearRefreshTokens(userId);
      
      // Log logout
      const user = await this.usersService.findById(userId);
      if (user) {
        await this.usersService.logUserActivity(userId, 'logout');
        this.logger.log(`User logged out: ${user.email}`, 'AuthService');
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      
      const userId = decoded.sub;
      
      // Get user
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Check if refresh token is valid
      const isTokenValid = await this.usersService.validateRefreshToken(userId, refreshToken);
      
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Generate new tokens
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      
      const [newAccessToken, newRefreshToken] = await Promise.all([
        this.generateAccessToken(payload),
        this.generateRefreshToken(payload),
      ]);
      
      // Store new refresh token
      const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      await this.usersService.updateRefreshToken(userId, refreshToken, refreshTokenHash);
      
      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error(`Error refreshing token: ${error.message}`, error.stack, 'AuthService');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserActivityLogs(userId: string) {
    try {
      return this.usersService.getUserActivityLogs(userId);
    } catch (error) {
      this.logger.error(`Error getting user activity logs: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  private async generateAccessToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
  }

  private async generateRefreshToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });
  }
}