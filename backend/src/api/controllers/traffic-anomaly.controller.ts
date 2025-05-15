import { 
  Controller, 
  Get, 
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
import { TrafficAnomalyDetectorService } from '../../detection/network/traffic-anomaly-detector.service';

@ApiTags('traffic-anomalies')
@Controller('traffic-anomalies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrafficAnomalyController {
  constructor(private readonly anomalyService: TrafficAnomalyDetectorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all traffic anomalies' })
  @ApiResponse({ status: 200, description: 'Returns traffic anomalies' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by anomaly type' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'sourceIp', required: false, description: 'Filter by source IP' })
  @ApiQuery({ name: 'destinationIp', required: false, description: 'Filter by destination IP' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getAnomalies(
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('sourceIp') sourceIp?: string,
    @Query('destinationIp') destinationIp?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (type) filters.type = type;
      if (severity) filters.severity = severity;
      if (status) filters.status = status;
      if (sourceIp) filters.sourceIp = sourceIp;
      if (destinationIp) filters.destinationIp = destinationIp;
      
      // Date range filter
      if (startDate || endDate) {
        filters.detectedAt = {};
        if (startDate) filters.detectedAt.$gte = new Date(startDate);
        if (endDate) filters.detectedAt.$lte = new Date(endDate);
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.anomalyService.getAnomalies(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get anomaly statistics' })
  @ApiResponse({ status: 200, description: 'Returns anomaly statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to include' })
  async getStatistics(@Query('days') days?: number) {
    try {
      return await this.anomalyService.getAnomalyStatistics(
        days ? parseInt(days.toString()) : 7
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get anomaly by ID' })
  @ApiResponse({ status: 200, description: 'Return anomaly' })
  @ApiResponse({ status: 404, description: 'Anomaly not found' })
  async getAnomalyById(@Param('id') id: string) {
    try {
      const anomaly = await this.anomalyService.getAnomalyById(id);
      
      if (!anomaly) {
        throw new HttpException('Anomaly not found', HttpStatus.NOT_FOUND);
      }
      
      return anomaly;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update anomaly status' })
  @ApiResponse({ status: 200, description: 'Anomaly status updated successfully' })
  @ApiResponse({ status: 404, description: 'Anomaly not found' })
  @Roles('admin', 'analyst')
  async updateAnomalyStatus(
    @Param('id') id: string,
    @Body() data: { status: string; notes?: string }
  ) {
    try {
      if (!data.status) {
        throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
      }
      
      const anomaly = await this.anomalyService.updateAnomalyStatus(id, data.status, data.notes);
      
      if (!anomaly) {
        throw new HttpException('Anomaly not found', HttpStatus.NOT_FOUND);
      }
      
      return anomaly;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/source/:ip')
  @ApiOperation({ summary: 'Get anomalies by source IP' })
  @ApiResponse({ status: 200, description: 'Returns anomalies for source IP' })
  async getAnomaliesBySourceIP(@Param('ip') ip: string) {
    try {
      return this.anomalyService.getAnomalies({ sourceIp: ip }, { limit: 50 });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/destination/:ip')
  @ApiOperation({ summary: 'Get anomalies by destination IP' })
  @ApiResponse({ status: 200, description: 'Returns anomalies for destination IP' })
  async getAnomaliesByDestinationIP(@Param('ip') ip: string) {
    try {
      return this.anomalyService.getAnomalies({ destinationIp: ip }, { limit: 50 });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/type/:type')
  @ApiOperation({ summary: 'Get anomalies by type' })
  @ApiResponse({ status: 200, description: 'Returns anomalies of specified type' })
  async getAnomaliesByType(@Param('type') type: string) {
    try {
      return this.anomalyService.getAnomalies({ type }, { limit: 50 });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}