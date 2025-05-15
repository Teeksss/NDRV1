import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview data' })
  @ApiResponse({ status: 200, description: 'Return dashboard overview data' })
  getDashboardOverview(
    @Query('timeRange') timeRange?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getDashboardOverview(timeRange, req.user);
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security dashboard data' })
  @ApiResponse({ status: 200, description: 'Return security dashboard data' })
  getSecurityDashboard(
    @Query('timeRange') timeRange?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getSecurityDashboard(timeRange, req.user);
  }

  @Get('network')
  @ApiOperation({ summary: 'Get network dashboard data' })
  @ApiResponse({ status: 200, description: 'Return network dashboard data' })
  getNetworkDashboard(
    @Query('timeRange') timeRange?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getNetworkDashboard(timeRange, req.user);
  }

  @Get('entity')
  @ApiOperation({ summary: 'Get entity dashboard data' })
  @ApiResponse({ status: 200, description: 'Return entity dashboard data' })
  getEntityDashboard(
    @Query('timeRange') timeRange?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getEntityDashboard(timeRange, req.user);
  }

  @Get('alerts-trend')
  @ApiOperation({ summary: 'Get alerts trend data' })
  @ApiResponse({ status: 200, description: 'Return alerts trend data' })
  getAlertsTrend(
    @Query('timeRange') timeRange?: string,
    @Query('interval') interval?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getAlertsTrend(timeRange, interval, req.user);
  }

  @Get('events-trend')
  @ApiOperation({ summary: 'Get events trend data' })
  @ApiResponse({ status: 200, description: 'Return events trend data' })
  getEventsTrend(
    @Query('timeRange') timeRange?: string,
    @Query('interval') interval?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getEventsTrend(timeRange, interval, req.user);
  }

  @Get('traffic-trend')
  @ApiOperation({ summary: 'Get traffic trend data' })
  @ApiResponse({ status: 200, description: 'Return traffic trend data' })
  getTrafficTrend(
    @Query('timeRange') timeRange?: string,
    @Query('interval') interval?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getTrafficTrend(timeRange, interval, req.user);
  }

  @Get('top-alerts')
  @ApiOperation({ summary: 'Get top alerts' })
  @ApiResponse({ status: 200, description: 'Return top alerts' })
  getTopAlerts(
    @Query('limit') limit?: number,
    @Query('timeRange') timeRange?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getTopAlerts(limit, timeRange, req.user);
  }

  @Get('top-sources')
  @ApiOperation({ summary: 'Get top sources' })
  @ApiResponse({ status: 200, description: 'Return top sources' })
  getTopSources(
    @Query('limit') limit?: number,
    @Query('timeRange') timeRange?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getTopSources(limit, timeRange, req.user);
  }

  @Get('top-destinations')
  @ApiOperation({ summary: 'Get top destinations' })
  @ApiResponse({ status: 200, description: 'Return top destinations' })
  getTopDestinations(
    @Query('limit') limit?: number,
    @Query('timeRange') timeRange?: string,
    @Req() req: RequestWithUser
  ) {
    return this.dashboardService.getTopDestinations(limit, timeRange, req.user);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health' })
  @ApiResponse({ status: 200, description: 'Return system health data' })
  getSystemHealth() {
    return this.dashboardService.getSystemHealth();
  }

  @Get('user-widgets')
  @ApiOperation({ summary: 'Get user dashboard widgets' })
  @ApiResponse({ status: 200, description: 'Return user dashboard widgets' })
  getUserWidgets(@Req() req: RequestWithUser) {
    return this.dashboardService.getUserWidgets(req.user.id);
  }

  @Get('available-widgets')
  @ApiOperation({ summary: 'Get available dashboard widgets' })
  @ApiResponse({ status: 200, description: 'Return available dashboard widgets' })
  getAvailableWidgets() {
    return this.dashboardService.getAvailableWidgets();
  }
}