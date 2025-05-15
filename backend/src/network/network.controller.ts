import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { CreateNetworkScanDto } from './dto/create-network-scan.dto';
import { CreatePortScanDto } from './dto/create-port-scan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('network')
@Controller('network')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('traffic')
  @ApiOperation({ summary: 'Get network traffic data' })
  @ApiResponse({ status: 200, description: 'Return network traffic data' })
  getTraffic(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: string,
    @Query('protocol') protocol?: string,
    @Query('sourceIp') sourceIp?: string,
    @Query('destinationIp') destinationIp?: string,
  ) {
    return this.networkService.getTraffic({
      startDate,
      endDate,
      interval,
      protocol,
      sourceIp,
      destinationIp,
    });
  }

  @Get('topology')
  @ApiOperation({ summary: 'Get network topology' })
  @ApiResponse({ status: 200, description: 'Return network topology data' })
  getTopology() {
    return this.networkService.getTopology();
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get protocol distribution' })
  @ApiResponse({ status: 200, description: 'Return protocol distribution data' })
  getProtocolDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.networkService.getProtocolDistribution(startDate, endDate);
  }

  @Get('ports')
  @ApiOperation({ summary: 'Get top ports usage' })
  @ApiResponse({ status: 200, description: 'Return top ports usage data' })
  getTopPorts(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.networkService.getTopPorts(limit, startDate, endDate);
  }

  @Get('flows')
  @ApiOperation({ summary: 'Get network flows' })
  @ApiResponse({ status: 200, description: 'Return network flows data' })
  getFlows(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('protocol') protocol?: string,
    @Query('sourceIp') sourceIp?: string,
    @Query('destinationIp') destinationIp?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.networkService.getFlows({
      startDate,
      endDate,
      protocol,
      sourceIp,
      destinationIp,
      limit,
      page,
    });
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get top network conversations' })
  @ApiResponse({ status: 200, description: 'Return top network conversations data' })
  getTopConversations(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('protocol') protocol?: string,
  ) {
    return this.networkService.getTopConversations(limit, startDate, endDate, protocol);
  }

  @Get('bandwidth')
  @ApiOperation({ summary: 'Get bandwidth usage data' })
  @ApiResponse({ status: 200, description: 'Return bandwidth usage data' })
  getBandwidthUsage(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: string,
  ) {
    return this.networkService.getBandwidthUsage(startDate, endDate, interval);
  }

  @Get('geo-distribution')
  @ApiOperation({ summary: 'Get geographic distribution of traffic' })
  @ApiResponse({ status: 200, description: 'Return geographic distribution data' })
  getGeoDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.networkService.getGeoDistribution(startDate, endDate);
  }

  @Post('scan/network')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Start a network scan' })
  @ApiResponse({ status: 201, description: 'Network scan started successfully' })
  startNetworkScan(
    @Body() createNetworkScanDto: CreateNetworkScanDto,
    @Req() req: RequestWithUser,
  ) {
    return this.networkService.startNetworkScan(createNetworkScanDto, req.user.id);
  }

  @Post('scan/port')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Start a port scan' })
  @ApiResponse({ status: 201, description: 'Port scan started successfully' })
  startPortScan(
    @Body() createPortScanDto: CreatePortScanDto,
    @Req() req: RequestWithUser,
  ) {
    return this.networkService.startPortScan(createPortScanDto, req.user.id);
  }

  @Get('scan/status/:id')
  @ApiOperation({ summary: 'Get scan status' })
  @ApiResponse({ status: 200, description: 'Return scan status' })
  getScanStatus(@Param('id') id: string) {
    return this.networkService.getScanStatus(id);
  }

  @Get('scan/results/:id')
  @ApiOperation({ summary: 'Get scan results' })
  @ApiResponse({ status: 200, description: 'Return scan results' })
  getScanResults(@Param('id') id: string) {
    return this.networkService.getScanResults(id);
  }

  @Get('scan/history')
  @ApiOperation({ summary: 'Get scan history' })
  @ApiResponse({ status: 200, description: 'Return scan history' })
  getScanHistory(
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.networkService.getScanHistory({
      type,
      startDate,
      endDate,
      limit,
      page,
    });
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get network traffic anomalies' })
  @ApiResponse({ status: 200, description: 'Return network traffic anomalies' })
  getAnomalies(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: number,
  ) {
    return this.networkService.getAnomalies({
      startDate,
      endDate,
      severity,
      limit,
    });
  }
}