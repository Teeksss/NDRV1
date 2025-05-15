import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemMonitorService } from '../../monitoring/system-monitor.service';

@ApiTags('system-monitor')
@Controller('system-monitor')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemMonitorController {
  constructor(private readonly systemMonitorService: SystemMonitorService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get system status' })
  @ApiResponse({ status: 200, description: 'Returns system status' })
  @Roles('admin')
  async getSystemStatus() {
    try {
      return await this.systemMonitorService.getSystemStatus();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'Returns system metrics' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by metric type' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by metric name' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles('admin')
  async getMetrics(
    @Query('type') type?: string,
    @Query('name') name?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      const filters: any = {};
      
      if (type) filters.type = type;
      if (name) filters.name = name;
      
      // Date range filter
      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate);
        if (endDate) filters.timestamp.$lte = new Date(endDate);
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      
      return await this.systemMonitorService.getMetrics(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('metrics/timeseries')
  @ApiOperation({ summary: 'Get metric time series' })
  @ApiResponse({ status: 200, description: 'Returns metric time series' })
  @ApiQuery({ name: 'type', required: true, description: 'Metric type' })
  @ApiQuery({ name: 'name', required: true, description: 'Metric name' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'interval', required: false, description: 'Interval (1m, 5m, 15m, 1h, 1d)' })
  @Roles('admin')
  async getMetricTimeSeries(
    @Query('type') type: string,
    @Query('name') name: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval?: string
  ) {
    try {
      if (!type || !name || !startDate || !endDate) {
        throw new HttpException('Type, name, startDate, and endDate are required', HttpStatus.BAD_REQUEST);
      }
      
      return await this.systemMonitorService.getMetricTimeSeries(
        type,
        name,
        new Date(startDate),
        new Date(endDate),
        interval
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}