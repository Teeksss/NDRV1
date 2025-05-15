import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  findAll(
    @Query('role') role?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.usersService.findAll({
      role,
      isActive,
      search,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    // Only admins can view other users
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new Error('Unauthorized access to user data');
    }
    
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    // Only admins can update other users
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new Error('Unauthorized to update user');
    }
    
    // Only admins can update roles
    if (updateUserDto.role && req.user.role !== 'admin') {
      delete updateUserDto.role;
    }
    
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/activate')
  @Roles('admin')
  @ApiOperation({ summary: 'Activate a user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  activate(@Param('id') id: string) {
    return this.usersService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deactivate(@Param('id') id: string) {
    return this.usersService.setActive(id, false);
  }

  @Post(':id/reset-password')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }

  @Get('roles/all')
  @ApiOperation({ summary: 'Get all available roles' })
  @ApiResponse({ status: 200, description: 'Return all available roles' })
  getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiResponse({ status: 200, description: 'Return user activity logs' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserActivity(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Req() req: RequestWithUser,
  ) {
    // Only admins can view other users' activity
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new Error('Unauthorized access to user activity');
    }
    
    return this.usersService.getUserActivity(id, {
      startDate,
      endDate,
      limit,
      page,
    });
  }

  @Post('bulk/activate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate multiple users' })
  @ApiResponse({ status: 200, description: 'Users activated successfully' })
  bulkActivate(@Body() body: { ids: string[] }) {
    return this.usersService.bulkSetActive(body.ids, true);
  }

  @Post('bulk/deactivate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate multiple users' })
  @ApiResponse({ status: 200, description: 'Users deactivated successfully' })
  bulkDeactivate(@Body() body: { ids: string[] }) {
    return this.usersService.bulkSetActive(body.ids, false);
  }
}