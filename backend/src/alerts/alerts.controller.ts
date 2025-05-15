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
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { LoggerService } from '../logger/logger.service';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  async create(@Body() createAlertDto: CreateAlertDto, @Req() req: RequestWithUser) {
    this.logger.log(`Creating alert: ${createAlertDto.title}`, 'AlertsController');
    return this.alertsService.create({
      ...createAlertDto,
      createdBy: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiResponse({ status: 200, description: 'Return all alerts' })
  async findAll(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('entityId') entityId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    this.logger.log('Finding all alerts', 'AlertsController');
    
    return this.alertsService.findAll({
      severity,
      status,
      source,
      entityId,
      type,
      startDate,
      endDate,
      search,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Return alert statistics' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Getting alert statistics', 'AlertsController');
    return this.alertsService.getAlertStatistics(startDate, endDate);
  }

  @Get('by-severity')
  @ApiOperation({ summary: 'Get alerts by severity' })
  @ApiResponse({ status: 200, description: 'Return alerts by severity' })
  async getAlertsBySeverity(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Getting alerts by severity', 'AlertsController');
    return this.alertsService.getAlertsBySeverity(startDate, endDate);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Get alerts by status' })
  @ApiResponse({ status: 200, description: 'Return alerts by status' })
  async getAlertsByStatus(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Getting alerts by status', 'AlertsController');
    return this.alertsService.getAlertsByStatus(startDate, endDate);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get alert trend' })
  @ApiResponse({ status: 200, description: 'Return alert trend' })
  async getAlertTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: string,
  ) {
    this.logger.log('Getting alert trend', 'AlertsController');
    return this.alertsService.getAlertTrend(startDate, endDate, interval);
  }

  @Get('top-entities')
  @ApiOperation({ summary: 'Get top affected entities' })
  @ApiResponse({ status: 200, description: 'Return top affected entities' })
  async getTopAffectedEntities(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting top affected entities', 'AlertsController');
    return this.alertsService.getTopAffectedEntities(startDate, endDate, limit);
  }

  @Get('mitre-mapping')
  @ApiOperation({ summary: 'Get MITRE ATT&CK mapping' })
  @ApiResponse({ status: 200, description: 'Return MITRE ATT&CK mapping' })
  async getMitreMapping(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Getting MITRE ATT&CK mapping', 'AlertsController');
    return this.alertsService.getAlertsMitreMapping(startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Return alert by ID' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Finding alert by ID: ${id}`, 'AlertsController');
    return this.alertsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update alert' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Updating alert: ${id}`, 'AlertsController');
    return this.alertsService.update(id, updateAlertDto, req.user.id);
  }

  @Patch(':id/status')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update alert status' })
  @ApiResponse({ status: 200, description: 'Alert status updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Updating alert status: ${id} to ${body.status}`, 'AlertsController');
    return this.alertsService.updateStatus(id, body.status, body.notes, req.user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to alert' })
  @ApiResponse({ status: 200, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { text: string },
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Adding comment to alert: ${id}`, 'AlertsController');
    return this.alertsService.addComment(id, body.text, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting alert: ${id}`, 'AlertsController');
    return this.alertsService.remove(id);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related alerts' })
  @ApiResponse({ status: 200, description: 'Return related alerts' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getRelatedAlerts(
    @Param('id') id: string,
    @Query('limit') limit?: number
  ) {
    this.logger.log(`Getting related alerts for: ${id}`, 'AlertsController');
    return this.alertsService.getRelatedAlerts(id, limit);
  }

  @Patch('bulk-status')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Bulk update alert status' })
  @ApiResponse({ status: 200, description: 'Alerts status updated successfully' })
  async bulkUpdateStatus(
    @Body() body: { ids: string[]; status: string; notes?: string },
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Bulk updating alert status for ${body.ids.length} alerts to ${body.status}`, 'AlertsController');
    return this.alertsService.bulkUpdateStatus(body.ids, body.status, body.notes, req.user.id);
  }
}