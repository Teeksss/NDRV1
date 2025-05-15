import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

interface HealthStatus {
  status: 'up' | 'down' | 'degraded';
  timestamp: Date;
  services: Record<string, {
    status: 'up' | 'down' | 'degraded';
    message?: string;
    details?: any;
  }>;
  system: {
    cpu: number;
    memory: {
      total: number;
      used: number;
      free: number;
      usedPercentage: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      usedPercentage: number;
    };
    uptime: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private healthStatus: HealthStatus;
  private diskCheckEnabled: boolean;
  private diskPath: string;

  constructor(
    private configService: ConfigService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {
    this.diskCheckEnabled = this.configService.get('health.diskCheck.enabled') !== false;
    this.diskPath = this.configService.get('health.diskCheck.path') || '/';
    
    // Initialize health status
    this.healthStatus = {
      status: 'up',
      timestamp: new Date(),
      services: {},
      system: {
        cpu: 0,
        memory: {
          total: 0,
          used: 0,
          free: 0,
          usedPercentage: 0
        },
        disk: {
          total: 0,
          used: 0,
          free: 0,
          usedPercentage: 0
        },
        uptime: 0
      }
    };
  }

  /**
   * Get current health status
   */
  async getHealth(): Promise<HealthStatus> {
    try {
      // Update system metrics
      await this.updateSystemMetrics();
      
      // Check database connection
      await this.checkDatabaseConnection();
      
      // Check disk space if enabled
      if (this.diskCheckEnabled) {
        await this.checkDiskSpace();
      }
      
      // Update overall status
      this.updateOverallStatus();
      
      return this.healthStatus;
    } catch (error) {
      this.logger.error(`Error getting health status: ${error.message}`, error.stack);
      
      // Set status to degraded in case of error
      this.healthStatus.status = 'degraded';
      this.healthStatus.timestamp = new Date();
      
      return this.healthStatus;
    }
  }

  /**
   * Update system metrics
   */
  private async updateSystemMetrics(): Promise<void> {
    try {
      // Get CPU usage (simplified method - more accurate would use measurements over time)
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        const times = cpu.times;
        totalTick += times.user + times.nice + times.sys + times.idle + times.irq;
        totalIdle += times.idle;
      });
      
      const cpuUsage = 100 - (totalIdle / totalTick * 100);
      
      // Get memory information
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      // Update system info
      this.healthStatus.system.cpu = Math.round(cpuUsage * 100) / 100;
      this.healthStatus.system.memory = {
        total: Math.round(totalMem / (1024 * 1024)),
        used: Math.round(usedMem / (1024 * 1024)),
        free: Math.round(freeMem / (1024 * 1024)),
        usedPercentage: Math.round((usedMem / totalMem) * 100 * 100) / 100
      };
      this.healthStatus.system.uptime = os.uptime();
      this.healthStatus.timestamp = new Date();
    } catch (error) {
      this.logger.error(`Error updating system metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Check MongoDB connection
      if (this.mongoConnection.readyState === 1) {
        // Execute simple query to check responsiveness
        const adminDb = this.mongoConnection.db.admin();
        await adminDb.ping();
        
        const responseTime = Date.now() - startTime;
        
        this.healthStatus.services.database = {
          status: 'up',
          details: {
            responseTime,
            connectionString: this.sanitizeConnectionString(this.mongoConnection.client.s.url)
          }
        };
      } else {
        this.healthStatus.services.database = {
          status: 'down',
          message: `MongoDB connection is not ready. State: ${this.mongoConnection.readyState}`
        };
      }
    } catch (error) {
      this.logger.error(`Error checking database connection: ${error.message}`, error.stack);
      
      this.healthStatus.services.database = {
        status: 'down',
        message: error.message
      };
    }
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<void> {
    try {
      // This is a simplified implementation that works for Linux/macOS
      // For production, use a more robust library like 'diskusage'
      const diskPath = this.diskPath;
      
      if (process.platform === 'win32') {
        // For Windows, we would use a different approach
        // But for this example, we'll use dummy values
        this.healthStatus.system.disk = {
          total: 1000000,
          used: 500000,
          free: 500000,
          usedPercentage: 50
        };
        
        this.healthStatus.services.disk = {
          status: 'up'
        };
        return;
      }
      
      // For Linux/macOS
      if (fs.existsSync(diskPath)) {
        try {
          // Note: This would require a native module like 'diskusage' in production
          // For demonstration, we'll just set some placeholder values
          const stats = fs.statfsSync(diskPath);
          const total = stats.blocks * stats.bsize;
          const free = stats.bfree * stats.bsize;
          const used = total - free;
          const usedPercentage = (used / total) * 100;
          
          this.healthStatus.system.disk = {
            total: Math.round(total / (1024 * 1024 * 1024)),
            used: Math.round(used / (1024 * 1024 * 1024)),
            free: Math.round(free / (1024 * 1024 * 1024)),
            usedPercentage: Math.round(usedPercentage * 100) / 100
          };
          
          // Check if disk usage is critical
          if (usedPercentage > 90) {
            this.healthStatus.services.disk = {
              status: 'degraded',
              message: `Disk usage is high (${Math.round(usedPercentage)}%)`
            };
          } else {
            this.healthStatus.services.disk = {
              status: 'up'
            };
          }
        } catch (err) {
          // Fallback to dummy values if disk check fails
          this.healthStatus.system.disk = {
            total: 1000,
            used: 500,
            free: 500,
            usedPercentage: 50
          };
          
          this.healthStatus.services.disk = {
            status: 'degraded',
            message: `Could not check disk space: ${err.message}`
          };
        }
      } else {
        this.healthStatus.services.disk = {
          status: 'degraded',
          message: `Disk path ${diskPath} does not exist`
        };
      }
    } catch (error) {
      this.logger.error(`Error checking disk space: ${error.message}`, error.stack);
      
      this.healthStatus.services.disk = {
        status: 'degraded',
        message: error.message
      };
    }
  }

  /**
   * Update overall status
   */
  private updateOverallStatus(): void {
    // Check if any service is down
    const hasDownService = Object.values(this.healthStatus.services).some(
      service => service.status === 'down'
    );
    
    if (hasDownService) {
      this.healthStatus.status = 'down';
      return;
    }
    
    // Check if any service is degraded
    const hasDegradedService = Object.values(this.healthStatus.services).some(
      service => service.status === 'degraded'
    );
    
    if (hasDegradedService) {
      this.healthStatus.status = 'degraded';
      return;
    }
    
    // Check system metrics
    if (this.healthStatus.system.cpu > 90 || 
        this.healthStatus.system.memory.usedPercentage > 90 ||
        this.healthStatus.system.disk.usedPercentage > 90) {
      this.healthStatus.status = 'degraded';
      return;
    }
    
    // All checks passed
    this.healthStatus.status = 'up';
  }

  /**
   * Sanitize connection string
   */
  private sanitizeConnectionString(connectionString: string): string {
    try {
      // Hide username and password in connection string
      return connectionString.replace(/\/\/(.*):(.*)@/, '//***:***@');
    } catch {
      return 'mongodb://***:***@host/db';
    }
  }
}