import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  create(@Body() createReportDto: CreateReportDto, @Req() req: RequestWithUser) {
    return this.reportsService.create(createReportDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({ status: 200, description: 'Return all reports' })
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('createdBy') createdBy?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.reportsService.findAll({
      type,
      status,
      startDate,
      endDate,
      createdBy,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get('my-reports')
  @ApiOperation({ summary: 'Get current user reports' })
  @ApiResponse({ status: 200, description: 'Return user reports' })
  findMyReports(
    @Req() req: RequestWithUser,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.reportsService.findAll({
      type,
      status,
      startDate,
      endDate,
      createdBy: req.user.id,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiResponse({ status: 200, description: 'Return the report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.reportsService.remove(id, req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a report' })
  @ApiResponse({ status: 200, description: 'Download report file' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async download(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    const { file, filename, contentType } = await this.reportsService.download(id, req.user.id);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(file);
  }

  @Post('templates')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a report template' })
  @ApiResponse({ status: 201, description: 'Report template created successfully' })
  createTemplate(@Body() templateData: any, @Req() req: RequestWithUser) {
    return this.reportsService.createTemplate(templateData, req.user.id);
  }

  @Get('templates/all')
  @ApiOperation({ summary: 'Get all report templates' })
  @ApiResponse({ status: 200, description: 'Return all report templates' })
  getTemplates() {
    return this.reportsService.getTemplates();
  }

  @Get('types/available')
  @ApiOperation({ summary: 'Get available report types' })
  @ApiResponse({ status: 200, description: 'Return available report types' })
  getReportTypes() {
    return this.reportsService.getReportTypes();
  }

  @Post('generate/security-summary')
  @ApiOperation({ summary: 'Generate security summary report' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  generateSecuritySummary(
    @Body() params: { startDate: string; endDate: string },
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.generateSecuritySummary(params, req.user.id);
  }

  @Post('generate/alerts-report')
  @ApiOperation({ summary: 'Generate alerts report' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  generateAlertsReport(
    @Body() params: { startDate: string; endDate: string; severities?: string[] },
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.generateAlertsReport(params, req.user.id);
  }

  @Post('generate/network-activity')
  @ApiOperation({ summary: 'Generate network activity report' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  generateNetworkActivityReport(
    @Body() params: { startDate: string; endDate: string; entityIds?: string[] },
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.generateNetworkActivityReport(params, req.user.id);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a recurring report' })
  @ApiResponse({ status: 201, description: 'Report scheduled successfully' })
  scheduleReport(@Body() scheduleData: any, @Req() req: RequestWithUser) {
    return this.reportsService.scheduleReport(scheduleData, req.user.id);
  }

  @Get('scheduled/all')
  @ApiOperation({ summary: 'Get all scheduled reports' })
  @ApiResponse({ status: 200, description: 'Return all scheduled reports' })
  getScheduledReports(@Req() req: RequestWithUser) {
    return this.reportsService.getScheduledReports(req.user.id);
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Delete a scheduled report' })
  @ApiResponse({ status: 200, description: 'Scheduled report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Scheduled report not found' })
  removeScheduledReport(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.reportsService.removeScheduledReport(id, req.user.id);
  }
}