import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Query, 
  Body, 
  UseGuards, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AlertService } from '../../alerts/alert.service';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiResponse({ status: 200, description: 'Returns alerts' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source' })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Filter by assigned user' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'ipAddress', required: false, description: 'Filter by IP address' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getAlerts(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('entityId') entityId?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (severity) filters.severity = severity;
      if (status) filters.status = status;
      if (source) filters.source = source;
      if (assignedTo) filters.assignedTo = assignedTo;
      if (entityId) filters.entityId = entityId;
      if (ipAddress) filters.ipAddress = ipAddress;
      
      // Date range filter
      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate);
        if (endDate) filters.timestamp.$lte = new Date(endDate);
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString(), 10);
      if (skip) options.skip = parseInt(skip.toString(), 10);
      
      return await this.alertService.getAlerts(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Returns alert statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to include' })
  async getStatistics(@Query('days') days?: number) {
    try {
      return await this.alertService.getAlertStatistics(
        days ? parseInt(days.toString(), 10) : 7
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Return alert' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlertById(@Param('id') id: string) {
    try {
      const alert = await this.alertService.getAlertById(id);
      
      if (!alert) {
        throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
      }
      
      return alert;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid alert data' })
  @Roles('admin', 'system')
  async createAlert(@Body() alertData: any) {
    try {
      return await this.alertService.createAlert(alertData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update alert status' })
  @ApiResponse({ status: 200, description: 'Alert status updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async updateAlertStatus(
    @Param('id') id: string,
    @Body() data: { status: string; notes?: string; assignedTo?: string }
  ) {
    try {
      if (!data.status) {
        throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
      }
      
      const alert = await this.alertService.updateAlertStatus(
        id, 
        data.status, 
        data.notes, 
        data.assignedTo
      );
      
      if (!alert) {
        throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
      }
      
      return alert;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/severity')
  @ApiOperation({ summary: 'Update alert severity' })
  @ApiResponse({ status: 200, description: 'Alert severity updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @Roles('admin', 'analyst')
  async updateAlertSeverity(
    @Param('id') id: string,
    @Body() data: { severity: string; notes?: string }
  ) {
    try {
      if (!data.severity) {
        throw new HttpException('Severity is required', HttpStatus.BAD_REQUEST);
      }
      
      const alert = await this.alertService.updateAlertSeverity(id, data.severity, data.notes);
      
      if (!alert) {
        throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
      }
      
      return alert;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to alert' })
  @ApiResponse({ status: 200, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async addComment(
    @Param('id') id: string,
    @Body() data: { comment: string; user: string }
  ) {
    try {
      if (!data.comment) {
        throw new HttpException('Comment text is required', HttpStatus.BAD_REQUEST);
      }
      
      const alert = await this.alertService.addComment(
        id, 
        data.comment, 
        data.user
      );
      
      if (!alert) {
        throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
      }
      
      return alert;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('templates/all')
  @ApiOperation({ summary: 'Get all alert templates' })
  @ApiResponse({ status: 200, description: 'Returns alert templates' })
  @Roles('admin', 'analyst')
  async getTemplates() {
    try {
      return await this.alertService.getAlertTemplates();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create new alert template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  @Roles('admin')
  async createTemplate(@Body() templateData: any) {
    try {
      return await this.alertService.createAlertTemplate(templateData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update alert template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Roles('admin')
  async updateTemplate(@Param('id') id: string, @Body() templateData: any) {
    try {
      const template = await this.alertService.updateAlertTemplate(id, templateData);
      
      if (!template) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }
      
      return template;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('by/severity/:severity')
  @ApiOperation({ summary: 'Get alerts by severity' })
  @ApiResponse({ status: 200, description: 'Returns alerts' })
  async getAlertsBySeverity(@Param('severity') severity: string) {
    try {
      return await this.alertService.getAlerts({ severity }, { limit: 100 });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/status/:status')
  @ApiOperation({ summary: 'Get alerts by status' })
  @ApiResponse({ status: 200, description: 'Returns alerts' })
  async getAlertsByStatus(@Param('status') status: string) {
    try {
      return await this.alertService.getAlerts({ status }, { limit: 100 });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/source/:source')
  @ApiOperation({ summary: 'Get alerts by source' })
  @ApiResponse({ status: 200, description: 'Returns alerts' })
  async getAlertsBySource(@Param('source') source: string) {
    try {
      return await this.alertService.getAlerts({ source }, { limit: 100 });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/entity/:entityId')
  @ApiOperation({ summary: 'Get alerts by entity ID' })
  @ApiResponse({ status: 200, description: 'Returns alerts' })
  async getAlertsByEntity(@Param('entityId') entityId: string) {
    try {
      return await this.alertService.getAlerts({ entityId }, { limit: 100 });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}