import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator
} from '@nestjs/terminus';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private configService: ConfigService
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({ status: 200, description: 'Health status information' })
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('database'),
    ]);
  }

  @Get('detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HealthCheck()
  @ApiOperation({ summary: 'Get detailed health status' })
  @ApiResponse({ status: 200, description: 'Detailed health status information' })
  checkDetailed() {
    return this.health.check([
      () => this.mongoose.pingCheck('database'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      () => this.memory.checkHeap('memory_heap', { thresholdPercent: 0.7 }),
      () => this.memory.checkRSS('memory_rss', { thresholdPercent: 0.7 }),
    ]);
  }

  @Get('version')
  @ApiOperation({ summary: 'Get application version information' })
  @ApiResponse({ status: 200, description: 'Application version information' })
  getVersion() {
    return {
      version: process.env.APP_VERSION || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV'),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('uptime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system uptime information' })
  @ApiResponse({ status: 200, description: 'System uptime information' })
  getUptime() {
    return {
      uptime: process.uptime(),
      processStartTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      currentTime: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics' })
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
      },
      timestamp: new Date().toISOString(),
    };
  }
}