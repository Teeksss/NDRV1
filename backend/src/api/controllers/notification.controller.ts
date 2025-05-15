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
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { NotificationService } from '../../notification/notification.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Returns notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getNotifications(
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.notificationService.getNotifications({}, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get all notification channels' })
  @ApiResponse({ status: 200, description: 'Returns notification channels' })
  async getChannels() {
    try {
      return await this.notificationService.getChannels();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('channels')
  @ApiOperation({ summary: 'Create new notification channel' })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid channel data' })
  @Roles('admin')
  async createChannel(@Body() channelData: any) {
    try {
      return await this.notificationService.createChannel(channelData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('channels/:id')
  @ApiOperation({ summary: 'Update notification channel' })
  @ApiResponse({ status: 200, description: 'Channel updated successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @Roles('admin')
  async updateChannel(@Param('id') id: string, @Body() channelData: any) {
    try {
      const channel = await this.notificationService.updateChannel(id, channelData);
      
      if (!channel) {
        throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
      }
      
      return channel;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('channels/:id')
  @ApiOperation({ summary: 'Delete notification channel' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @Roles('admin')
  async deleteChannel(@Param('id') id: string) {
    try {
      const result = await this.notificationService.deleteChannel(id);
      
      if (!result.success) {
        throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('channels/:id/test')
  @ApiOperation({ summary: 'Test notification channel' })
  @ApiResponse({ status: 200, description: 'Test notification sent successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @Roles('admin')
  async testChannel(@Param('id') id: string) {
    try {
      const result = await this.notificationService.testChannel(id);
      
      if (!result.success) {
        throw new HttpException(result.message || 'Failed to test channel', HttpStatus.BAD_REQUEST);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({ status: 200, description: 'Returns notification templates' })
  async getTemplates() {
    try {
      return await this.notificationService.getTemplates();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create new notification template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  @Roles('admin')
  async createTemplate(@Body() templateData: any) {
    try {
      return await this.notificationService.createTemplate(templateData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update notification template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Roles('admin')
  async updateTemplate(@Param('id') id: string, @Body() templateData: any) {
    try {
      const template = await this.notificationService.updateTemplate(id, templateData);
      
      if (!template) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }
      
      return template;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete notification template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Roles('admin')
  async deleteTemplate(@Param('id') id: string) {
    try {
      const result = await this.notificationService.deleteTemplate(id);
      
      if (!result) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}