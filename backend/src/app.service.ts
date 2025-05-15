import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  getInfo() {
    const appInfo = {
      name: this.configService.get<string>('app.name'),
      version: this.configService.get<string>('app.version'),
      environment: this.configService.get<string>('app.environment'),
      apiPrefix: this.configService.get<string>('app.apiPrefix'),
      timestamp: new Date().toISOString(),
    };

    this.logger.log('Application info requested', 'AppService');
    return appInfo;
  }

  healthCheck() {
    // Basic health check - check database, etc. could be added here
    const health = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        server: 'healthy',
        database: 'healthy', // This would ideally be a real check
      },
    };

    this.logger.log('Health check requested', 'AppService');
    return health;
  }

  getSystemInfo() {
    // Gather system information
    const systemInfo = {
      server: {
        platform: process.platform,
        arch: process.arch,
        nodejs: process.version,
        uptime: Math.floor(os.uptime()),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100, // GB
        freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100, // GB
      },
      process: {
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / (1024 * 1024) * 100) / 100, // MB
          heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024) * 100) / 100, // MB
          heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024) * 100) / 100, // MB
          external: Math.round(process.memoryUsage().external / (1024 * 1024) * 100) / 100, // MB
        },
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.log('System info requested', 'AppService');
    return systemInfo;
  }
}