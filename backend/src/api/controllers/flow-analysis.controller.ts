import { 
  Controller, 
  Get, 
  Post, 
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
import { FlowService } from '../../network/flow-analyzer/flow.service';

@ApiTags('flow-analysis')
@Controller('flow-analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FlowAnalysisController {
  constructor(private readonly flowService: FlowService) {}

  @Get('flows')
  @ApiOperation({ summary: 'Get network flows' })
  @ApiResponse({ status: 200, description: 'Returns network flows' })
  @ApiQuery({ name: 'sourceIp', required: false, description: 'Filter by source IP' })
  @ApiQuery({ name: 'destinationIp', required: false, description: 'Filter by destination IP' })
  @ApiQuery({ name: 'protocol', required: false, description: 'Filter by protocol' })
  @ApiQuery({ name: 'port', required: false, type: Number, description: 'Filter by destination port' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getFlows(
    @Query('sourceIp') sourceIp?: string,
    @Query('destinationIp') destinationIp?: string,
    @Query('protocol') protocol?: string,
    @Query('port') port?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (sourceIp) filters.sourceIp = sourceIp;
      if (destinationIp) filters.destinationIp = destinationIp;
      if (protocol) filters.protocol = protocol;
      
      if (port) {
        // Convert to number if needed
        const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
        filters.destinationPort = portNum;
      }
      
      // Date range filter
      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate);
        if (endDate) filters.timestamp.$lte = new Date(endDate);
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString(), 10);
      if (skip) options.skip = parseInt(skip.toString(), 10);
      
      return await this.flowService.getFlows(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get flow statistics' })
  @ApiResponse({ status: 200, description: 'Returns flow statistics' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  async getStatistics(@Query('sinceDate') sinceDate?: string) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return await this.flowService.getFlowStatistics(sinceDateObj);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-sources')
  @ApiOperation({ summary: 'Get top source IPs' })
  @ApiResponse({ status: 200, description: 'Returns top source IPs' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopSources(
    @Query('sinceDate') sinceDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Use provided limit or default to 10
      const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
      
      return await this.flowService.getTopSources(sinceDateObj, limitNum);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-destinations')
  @ApiOperation({ summary: 'Get top destination IPs' })
  @ApiResponse({ status: 200, description: 'Returns top destination IPs' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopDestinations(
    @Query('sinceDate') sinceDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Use provided limit or default to 10
      const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
      
      return await this.flowService.getTopDestinations(sinceDateObj, limitNum);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-conversations')
  @ApiOperation({ summary: 'Get top conversations (source-destination pairs)' })
  @ApiResponse({ status: 200, description: 'Returns top conversations' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopConversations(
    @Query('sinceDate') sinceDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Use provided limit or default to 10
      const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
      
      return await this.flowService.getTopConversations(sinceDateObj, limitNum);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-applications')
  @ApiOperation({ summary: 'Get top applications (based on protocol/port)' })
  @ApiResponse({ status: 200, description: 'Returns top applications' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopApplications(
    @Query('sinceDate') sinceDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Use provided limit or default to 10
      const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
      
      return await this.flowService.getTopApplications(sinceDateObj, limitNum);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-ports')
  @ApiOperation({ summary: 'Get top destination ports' })
  @ApiResponse({ status: 200, description: 'Returns top ports' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopPorts(
    @Query('sinceDate') sinceDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Use provided limit or default to 10
      const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
      
      return await this.flowService.getTopPorts(sinceDateObj, limitNum);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('hourly-traffic')
  @ApiOperation({ summary: 'Get hourly traffic statistics' })
  @ApiResponse({ status: 200, description: 'Returns hourly traffic data' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  async getHourlyTraffic(@Query('sinceDate') sinceDate?: string) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return await this.flowService.getHourlyTrafficStats(sinceDateObj);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('source/:ip/destinations')
  @ApiOperation({ summary: 'Get destinations for a source IP' })
  @ApiResponse({ status: 200, description: 'Returns destinations' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDestinationsForSource(
    @Param('ip') sourceIp: string,
    @Query('sinceDate') sinceDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Use provided limit or default to 100
      const limitNum = limit ? parseInt(limit.toString(), 10) : 100;
      
      return await this.flowService.getDestinationsForSource(sourceIp, sinceDateObj, limitNum);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('source/:ip/ports')
  @ApiOperation({ summary: 'Get destination ports for a source IP' })
  @ApiResponse({ status: 200, description: 'Returns ports' })
  @ApiQuery({ name: 'sinceDate', required: false, description: 'Starting date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPortsForSource(
    @Param('ip') sourceIp: string,
    @Query('sinceDate') sinceDate?: string,
    @Query('limit') limit?: number
  ) {
    try {
      // Use provided date or default to 24 hours ago
      const sinceDateObj = sinceDate 
        ? new Date(sinceDate) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Use provided limit or default to 100
      const limitNum = limit ? parseInt(limit.toString(), 10) : 100;
      
      return await this.flowService.getPortsForSource(sourceIp, sinceDateObj, limitNum);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('flow')
  @ApiOperation({ summary: 'Create new flow' })
  @ApiResponse({ status: 201, description: 'Flow created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid flow data' })
  @Roles('admin', 'system')
  async createFlow(@Body() flowData: any) {
    try {
      return await this.flowService.createFlow(flowData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}