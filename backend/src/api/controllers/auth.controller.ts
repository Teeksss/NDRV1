import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  HttpException, 
  HttpStatus,
  Get
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../auth/auth.service';
import { LocalAuthGuard } from '../../auth/guards/local-auth.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserService } from '../../users/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    try {
      if (!body.currentPassword || !body.newPassword) {
        throw new HttpException('Current password and new password are required', HttpStatus.BAD_REQUEST);
      }
      
      // Minimum password length check
      if (body.newPassword.length < 8) {
        throw new HttpException('New password must be at least 8 characters', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.authService.changePassword(
        req.user.userId,
        body.currentPassword,
        body.newPassword
      );
      
      if (!result) {
        throw new HttpException('Failed to change password', HttpStatus.BAD_REQUEST);
      }
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async forgotPassword(@Body() body: { email: string }) {
    try {
      if (!body.email) {
        throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
      }
      
      const token = await this.authService.issuePasswordResetToken(body.email);
      
      if (!token) {
        // Always return success even if email not found for security
        return { success: true, message: 'Password reset instructions sent if email exists' };
      }
      
      // In a real implementation, send email with reset link
      // For this example, we just return the token
      return { 
        success: true, 
        message: 'Password reset instructions sent',
        token // In production, this would be removed and sent via email instead
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    try {
      if (!body.token || !body.newPassword) {
        throw new HttpException('Token and new password are required', HttpStatus.BAD_REQUEST);
      }
      
      // Minimum password length check
      if (body.newPassword.length < 8) {
        throw new HttpException('New password must be at least 8 characters', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.authService.resetPassword(body.token, body.newPassword);
      
      if (!result) {
        throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);
      }
      
      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}