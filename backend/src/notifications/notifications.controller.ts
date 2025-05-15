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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Return user notifications' })
  findAll(
    @Req() req: RequestWithUser,
    @Query('read') read?: boolean,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.notificationsService.findAll({
      userId: req.user.id,
      read,
      type,
      startDate,
      endDate,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiResponse({ status: 200, description: 'Return the notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.notificationsService.findOne(id, req.user.id);
  }

  @Patch('mark-as-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  markAsRead(@Body('ids') ids: string[], @Req() req: RequestWithUser) {
    return this.notificationsService.markAsRead(ids, req.user.id);
  }

  @Patch('mark-all-as-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete notifications' })
  @ApiResponse({ status: 200, description: 'Notifications deleted' })
  remove(@Body('ids') ids: string[], @Req() req: RequestWithUser) {
    return this.notificationsService.remove(ids, req.user.id);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({ status: 200, description: 'All notifications deleted' })
  removeAll(@Req() req: RequestWithUser) {
    return this.notificationsService.removeAll(req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Return unread notification count' })
  getUnreadCount(@Req() req: RequestWithUser) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a notification for a user' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('broadcast')
  @Roles('admin')
  @ApiOperation({ summary: 'Broadcast a notification to all users' })
  @ApiResponse({ status: 201, description: 'Notification broadcasted successfully' })
  broadcast(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.broadcast(createNotificationDto);
  }

  @Get('user/notification-settings')
  @ApiOperation({ summary: 'Get user notification settings' })
  @ApiResponse({ status: 200, description: 'Return user notification settings' })
  getNotificationSettings(@Req() req: RequestWithUser) {
    return this.notificationsService.getNotificationSettings(req.user.id);
  }

  @Patch('user/notification-settings')
  @ApiOperation({ summary: 'Update user notification settings' })
  @ApiResponse({ status: 200, description: 'User notification settings updated' })
  updateNotificationSettings(
    @Body() updateSettingsDto: UpdateNotificationSettingsDto,
    @Req() req: RequestWithUser,
  ) {
    return this.notificationsService.updateNotificationSettings(req.user.id, updateSettingsDto);
  }
}