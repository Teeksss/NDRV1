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
  Res
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReportsService } from '../../reports/reports.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({ status: 200, description: 'Returns reports' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by report type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getReports(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (type) filters.type = type;
      if (status) filters.status = status;
      
      // Date range filter
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString(), 10);
      if (skip) options.skip = parseInt(skip.toString(), 10);
      
      return await this.reportsService.getReports(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Return report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(@Param('id') id: string) {
    try {
      const report = await this.reportsService.getReportById(id);
      
      if (!report) {
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
      }
      
      return report;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid report data' })
  async createReport(@Body() reportData: any) {
    try {
      return await this.reportsService.createReport(reportData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download report file' })
  @ApiResponse({ status: 200, description: 'Report file' })
  @ApiResponse({ status: 404, description: 'Report not found or file not available' })
  async downloadReport(@Param('id') id: string, @Res() res: Response) {
    try {
      const report = await this.reportsService.getReportById(id);
      
      if (!report) {
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
      }
      
      if (!report.filePath || report.status !== 'completed') {
        throw new HttpException('Report file not available', HttpStatus.NOT_FOUND);
      }
      
      // Check if file exists
      if (!fs.existsSync(report.filePath)) {
        throw new HttpException('Report file not found', HttpStatus.NOT_FOUND);
      }
      
      // Set response headers
      const fileName = report.fileName || path.basename(report.filePath);
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'application/pdf');
      
      // Stream file to response
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate report' })
  @ApiResponse({ status: 200, description: 'Report regeneration initiated' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @Roles('admin', 'analyst')
  async regenerateReport(@Param('id') id: string) {
    try {
      const report = await this.reportsService.getReportById(id);
      
      if (!report) {
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
      }
      
      await this.reportsService.generateReport(id);
      
      return {
        success: true,
        message: 'Report regeneration initiated',
        reportId: id
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('templates/all')
  @ApiOperation({ summary: 'Get all report templates' })
  @ApiResponse({ status: 200, description: 'Returns report templates' })
  async getTemplates() {
    try {
      return await this.reportsService.getReportTemplates();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create new report template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  @Roles('admin')
  async createTemplate(@Body() templateData: any) {
    try {
      return await this.reportsService.createReportTemplate(templateData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update report template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Roles('admin')
  async updateTemplate(@Param('id') id: string, @Body() templateData: any) {
    try {
      // This method doesn't exist in the service yet, it would need to be implemented
      throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete report template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Roles('admin')
  async deleteTemplate(@Param('id') id: string) {
    try {
      const result = await this.reportsService.deleteTemplate(id);
      
      if (!result) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('types/:type/generate')
  @ApiOperation({ summary: 'Generate a new report of specific type' })
  @ApiResponse({ status: 200, description: 'Report generation initiated' })
  async generateReportByType(
    @Param('type') type: string,
    @Body() parameters: any
  ) {
    try {
      // Create report with the specified type
      const report = await this.reportsService.createReport({
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type: type,
        parameters: parameters
      });
      
      return {
        success: true,
        message: 'Report generation initiated',
        reportId: report._id
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('types/available')
  @ApiOperation({ summary: 'Get available report types' })
  @ApiResponse({ status: 200, description: 'Returns available report types' })
  async getAvailableReportTypes() {
    try {
      // This would typically come from a configuration or would be generated
      // based on available templates
      return {
        types: [
          { id: 'security_summary', name: 'Security Summary', description: 'Overall security status and alerts' },
          { id: 'network_traffic', name: 'Network Traffic', description: 'Network traffic analysis and statistics' },
          { id: 'alert_details', name: 'Alert Details', description: 'Detailed information about alerts' },
          { id: 'entity_report', name: 'Entity Report', description: 'Detailed information about an entity' },
          { id: 'ioc_matches', name: 'IOC Matches', description: 'Indicators of Compromise matches' },
          { id: 'compliance', name: 'Compliance', description: 'Compliance status and metrics' }
        ]
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}