import { 
  Controller, 
  Get, 
  UseGuards, 
  HttpException, 
  HttpStatus,
  Post,
  Query,
  Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DashboardService } from '../../monitoring/dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview data' })
  @ApiResponse({ status: 200, description: 'Returns dashboard overview data' })
  async getDashboardOverview() {
    try {
      return await this.dashboardService.getDashboardOverview();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security dashboard data' })
  @ApiResponse({ status: 200, description: 'Returns security dashboard data' })
  async getSecurityDashboard() {
    try {
      return await this.dashboardService.getSecurityDashboard();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('network')
  @ApiOperation({ summary: 'Get network dashboard data' })
  @ApiResponse({ status: 200, description: 'Returns network dashboard data' })
  async getNetworkDashboard() {
    try {
      return await this.dashboardService.getNetworkDashboard();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('cache/invalidate')
  @ApiOperation({ summary: 'Invalidate dashboard cache' })
  @ApiResponse({ status: 200, description: 'Dashboard cache invalidated' })
  async invalidateCache(@Query('dashboard') dashboard?: string) {
    try {
      this.dashboardService.invalidateCache(dashboard);
      return { 
        success: true, 
        message: dashboard 
          ? `Cache for ${dashboard} dashboard invalidated`
          : 'All dashboard caches invalidated'
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('top-vulnerabilities')
  @ApiOperation({ summary: 'Get top vulnerable entities' })
  @ApiResponse({ status: 200, description: 'Returns top vulnerable entities' })
  async getTopVulnerableEntities(@Query('limit') limit?: number) {
    try {
      // This method would need to be implemented in the dashboard service
      // For now, return a placeholder or call the entity service directly
      return await this.dashboardService.getTopVulnerableEntities(
        limit ? parseInt(limit.toString(), 10) : 5
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('recent-alerts')
  @ApiOperation({ summary: 'Get recent alerts for dashboard' })
  @ApiResponse({ status: 200, description: 'Returns recent alerts' })
  async getRecentAlerts(@Query('limit') limit?: number) {
    try {
      // This would be handled by the dashboard overview, but could also be a separate endpoint
      const overview = await this.dashboardService.getDashboardOverview();
      return {
        recentAlerts: overview.alerts.recent.slice(0, limit ? parseInt(limit.toString(), 10) : 10)
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics/:type')
  @ApiOperation({ summary: 'Get specific statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  @ApiResponse({ status: 400, description: 'Invalid statistics type' })
  async getDashboardStatistics(@Param('type') type: string) {
    try {
      switch (type) {
        case 'alerts':
          const security = await this.dashboardService.getSecurityDashboard();
          return security.alerts;
        case 'traffic':
          const network = await this.dashboardService.getNetworkDashboard();
          return network.overview;
        case 'entities':
          const overview = await this.dashboardService.getDashboardOverview();
          return overview.entities;
        case 'events':
          const events = await this.dashboardService.getDashboardOverview();
          return events.events;
        default:
          throw new HttpException('Invalid statistics type', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}