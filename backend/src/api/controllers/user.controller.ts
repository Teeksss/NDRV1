import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpException, 
  HttpStatus,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserService } from '../../users/user.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns users' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @Roles('admin')
  async getUsers(
    @Query('active') active?: boolean,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (active !== undefined) {
        filters.active = active;
      }
      
      if (role) {
        filters.roles = role;
      }
      
      if (search) {
        filters.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ];
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.userService.getUsers(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.userService.findById(id);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      // Remove sensitive fields
      const { password, resetToken, resetTokenExpires, ...result } = user.toObject();
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Roles('admin')
  async createUser(@Body() userData: any) {
    try {
      return await this.userService.createUser(userData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    try {
      const user = await this.userService.updateUser(id, userData);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    try {
      const result = await this.userService.deleteUser(id);
      
      if (!result) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() data: { active: boolean }
  ) {
    try {
      if (data.active === undefined) {
        throw new HttpException('Active status is required', HttpStatus.BAD_REQUEST);
      }
      
      const user = await this.userService.updateUserStatus(id, data.active);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}