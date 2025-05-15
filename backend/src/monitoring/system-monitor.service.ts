import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import * as os from 'os';
import * as pidusage from 'pidusage';

import { SystemMetric } from './entities/system-metric.entity';
import { MonitoringAlert } from './entities/monitoring-alert.entity';
import { AlertService } from '../alerts/alert.service';

@Injectable()
export class SystemMonitorService implements OnModuleInit {
  private readonly logger = new Logger(SystemMonitorService.name);
  private metricsEnabled = true;
  private alertingEnabled = true;
  private thresholds = {
    cpuUsage: 80,
    memoryUsage: 80,
    diskUsage: 85
  };
  private metricHistory = new Map<string, Array<{ timestamp: Date, value: number }>>();

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private alertService: AlertService,
    @InjectModel(SystemMetric.name) private metricModel: Model<SystemMetric>,
    @InjectModel(MonitoringAlert.name) private alertModel: Model<MonitoringAlert>
  ) {}

  async onModuleInit() {
    // Load configuration
    this.metricsEnabled = this.configService.get('monitoring.metrics.enabled') !== false;
    this.alertingEnabled = this.configService.get('monitoring.alerting.enabled') !== false;
    
    const configThresholds = this.configService.get('monitoring.thresholds');
    if (configThresholds) {
      this.thresholds = { ...this.thresholds, ...configThresholds };
    }
    
    this.logger.log(`System monitoring initialized (metrics: ${this.metricsEnabled ? 'enabled' : 'disabled'}, alerting: ${this.alertingEnabled ? 'enabled' : 'disabled'})`);
  }

  /**
   * Collect and store system metrics
   */
  @Cron('0 * * * * *') // Every minute
  async collectSystemMetrics() {
    if (!this.metricsEnabled) {
      return;
    }
    
    try {
      const timestamp = new Date();
      
      // Collect CPU metrics
      const cpuUsage = await this.getCpuUsage();
      await this.storeMetric('system', 'cpu_usage', cpuUsage, '%', timestamp);
      
      // Collect memory metrics
      const memoryUsage = this.getMemoryUsage();
      await this.storeMetric('system', 'memory_usage', memoryUsage.usedPercentage, '%', timestamp);
      await this.storeMetric('system', 'memory_used', memoryUsage.used, 'MB', timestamp);
      await this.storeMetric('system', 'memory_total', memoryUsage.total, 'MB', timestamp);
      
      // Collect process metrics
      const processStats = await this.getProcessStats();
      await this.storeMetric('process', 'process_cpu', processStats.cpu, '%', timestamp);
      await this.storeMetric('process', 'process_memory', processStats.memory, 'MB', timestamp);
      
      // Check alerts
      if (this.alertingEnabled) {
        await this.checkAlerts();
      }
    } catch (error) {
      this.logger.error(`Error collecting system metrics: ${error.message}`, error.stack);
    }
  }

  /**
   * Get CPU usage
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const cpus = os.cpus();
      const cpuCount = cpus.length;
      
      setTimeout(() => {
        const newCpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        for (let i = 0; i < cpuCount; i++) {
          const oldCpu = cpus[i];
          const newCpu = newCpus[i];
          
          // Calculate difference in CPU times
          const oldTotal = Object.values(oldCpu.times).reduce((a, b) => a + b, 0);
          const newTotal = Object.values(newCpu.times).reduce((a, b) => a + b, 0);
          
          const totalDiff = newTotal - oldTotal;
          const idleDiff = newCpu.times.idle - oldCpu.times.idle;
          
          totalIdle += idleDiff;
          totalTick += totalDiff;
        }
        
        // Calculate CPU usage percentage
        const cpuUsage = 100 - (totalIdle / totalTick * 100);
        resolve(parseFloat(cpuUsage.toFixed(2)));
      }, 1000);
    });
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      total: Math.round(totalMem / (1024 * 1024)),
      used: Math.round(usedMem / (1024 * 1024)),
      free: Math.round(freeMem / (1024 * 1024)),
      usedPercentage: parseFloat(((usedMem / totalMem) * 100).toFixed(2))
    };
  }

  /**
   * Get process stats
   */
  private async getProcessStats() {
    const stats = await pidusage(process.pid);
    
    return {
      cpu: parseFloat(stats.cpu.toFixed(2)),
      memory: Math.round(stats.memory / (1024 * 1024))
    };
  }

  /**
   * Store metric in database
   */
  private async storeMetric(type: string, name: string, value: number, unit: string, timestamp: Date) {
    try {
      // Store in database
      await this.metricModel.create({
        type,
        name,
        value,
        unit,
        timestamp
      });
      
      // Store in memory for quick access
      const key = `${type}.${name}`;
      if (!this.metricHistory.has(key)) {
        this.metricHistory.set(key, []);
      }
      
      const history = this.metricHistory.get(key);
      history.push({ timestamp, value });
      
      // Keep only recent history (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      this.metricHistory.set(
        key,
        history.filter(item => item.timestamp >= oneHourAgo)
      );
      
      // Emit event
      this.eventEmitter.emit('system.metric', {
        type,
        name,
        value,
        unit,
        timestamp
      });
    } catch (error) {
      this.logger.error(`Error storing metric: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for alert conditions
   */
  private async checkAlerts() {
    try {
      // Get all enabled alerts
      const alerts = await this.alertModel.find({ enabled: true }).exec();
      
      for (const alert of alerts) {
        await this.checkAlert(alert);
      }
    } catch (error) {
      this.logger.error(`Error checking alerts: ${error.message}`, error.stack);
    }
  }

  /**
   * Check a specific alert
   */
  private async checkAlert(alert: any) {
    try {
      // Get metric history
      const metricParts = alert.metric.split('.');
      if (metricParts.length !== 2) {
        return;
      }
      
      const metricKey = alert.metric;
      const history = this.metricHistory.get(metricKey);
      
      if (!history || history.length === 0) {
        return;
      }
      
      // Get latest value
      const latest = history[history.length - 1];
      
      // Check condition
      let conditionMet = false;
      
      switch (alert.condition) {
        case '>':
          conditionMet = latest.value > alert.threshold;
          break;
        case '<':
          conditionMet = latest.value < alert.threshold;
          break;
        case '>=':
          conditionMet = latest.value >= alert.threshold;
          break;
        case '<=':
          conditionMet = latest.value <= alert.threshold;
          break;
        case '==':
          conditionMet = latest.value === alert.threshold;
          break;
        case '!=':
          conditionMet = latest.value !== alert.threshold;
          break;
      }
      
      // Check duration if specified
      if (conditionMet && alert.duration > 0) {
        const durationStart = new Date(Date.now() - alert.duration * 1000);
        const historyInDuration = history.filter(item => item.timestamp >= durationStart);
        
        conditionMet = historyInDuration.every(item => {
          switch (alert.condition) {
            case '>': return item.value > alert.threshold;
            case '<': return item.value < alert.threshold;
            case '>=': return item.value >= alert.threshold;
            case '<=': return item.value <= alert.threshold;
            case '==': return item.value === alert.threshold;
            case '!=': return item.value !== alert.threshold;
            default: return false;
          }
        });
      }
      
      // If condition met, trigger alert
      if (conditionMet) {
        await this.triggerAlert(alert, latest.value);
      }
    } catch (error) {
      this.logger.error(`Error checking alert ${alert.name}: ${error.message}`, error.stack);
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(alert: any, currentValue: number) {
    try {
      // Check if alert was recently triggered (within last 15 minutes)
      if (alert.lastTriggeredAt) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (alert.lastTriggeredAt >= fifteenMinutesAgo) {
          // Skip if recently triggered
          return;
        }
      }
      
      // Update last triggered time
      await this.alertModel.updateOne(
        { _id: alert._id },
        {
          lastTriggeredAt: new Date(),
          updatedAt: new Date()
        }
      ).exec();
      
      // Create system alert
      await this.alertService.createAlert({
        title: `System Alert: ${alert.name}`,
        description: alert.description || `System metric ${alert.metric} is ${alert.condition} ${alert.threshold} (current value: ${currentValue})`,
        severity: alert.severity || 'medium',
        source: 'system_monitoring',
        sourceRef: alert._id.toString(),
        status: 'new',
        timestamp: new Date(),
        metadata: {
          metric: alert.metric,
          threshold: alert.threshold,
          condition: alert.condition,
          currentValue,
          alertId: alert._id.toString()
        }
      });
      
      this.logger.log(`Triggered system alert: ${alert.name}, ${alert.metric} ${alert.condition} ${alert.threshold} (current: ${currentValue})`);
    } catch (error) {
      this.logger.error(`Error triggering alert: ${error.message}`, error.stack);
    }
  }

  /**
   * Get metrics with filters
   */
  async getMetrics(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options;
      
      return this.metricModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get metric time series for a specific metric
   */
  async getMetricTimeSeries(type: string, name: string, startTime: Date, endTime: Date, interval: string = '1h') {
    try {
      // Build aggregation pipeline based on interval
      let dateFormat: string;
      let timeField: string;
      
      switch (interval) {
        case '1m':
          dateFormat = '%Y-%m-%d %H:%M';
          timeField = 'minute';
          break;
        case '5m':
          dateFormat = '%Y-%m-%d %H:%M';
          timeField = 'minute5';
          break;
        case '15m':
          dateFormat = '%Y-%m-%d %H:%M';
          timeField = 'minute15';
          break;
        case '1h':
          dateFormat = '%Y-%m-%d %H:00';
          timeField = 'hour';
          break;
        case '1d':
          dateFormat = '%Y-%m-%d';
          timeField = 'day';
          break;
        default:
          dateFormat = '%Y-%m-%d %H:%M';
          timeField = 'minute';
      }
      
      return this.metricModel.aggregate([
        {
          $match: {
            type,
            name,
            timestamp: { $gte: startTime, $lte: endTime }
          }
        },
        {
          $project: {
            value: 1,
            timestamp: 1,
            timeField: {
              $dateToString: { format: dateFormat, date: '$timestamp' }
            }
          }
        },
        {
          $group: {
            _id: '$timeField',
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting metric time series: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get system status overview
   */
  async getSystemStatus() {
    try {
      // Get latest metrics
      const cpuMetric = await this.metricModel
        .findOne({ type: 'system', name: 'cpu_usage' })
        .sort({ timestamp: -1 })
        .exec();
      
      const memoryMetric = await this.metricModel
        .findOne({ type: 'system', name: 'memory_usage' })
        .sort({ timestamp: -1 })
        .exec();
      
      const processMemoryMetric = await this.metricModel
        .findOne({ type: 'process', name: 'process_memory' })
        .sort({ timestamp: -1 })
        .exec();
      
      const processCpuMetric = await this.metricModel
        .findOne({ type: 'process', name: 'process_cpu' })
        .sort({ timestamp: -1 })
        .exec();
      
      // Get active alerts
      const activeAlerts = await this.alertModel.find({
        enabled: true,
        lastTriggeredAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
      }).exec();
      
      // Check overall system health
      const cpuValue = cpuMetric?.value || 0;
      const memoryValue = memoryMetric?.value || 0;
      
      let systemHealth = 'healthy';
      if (cpuValue > this.thresholds.cpuUsage || memoryValue > this.thresholds.memoryUsage) {
        systemHealth = 'warning';
      }
      if (cpuValue > 95 || memoryValue > 95) {
        systemHealth = 'critical';
      }
      
      // Return system status
      return {
        timestamp: new Date(),
        health: systemHealth,
        metrics: {
          cpu: {
            value: cpuValue,
            unit: '%',
            timestamp: cpuMetric?.timestamp
          },
          memory: {
            value: memoryValue,
            unit: '%',
            timestamp: memoryMetric?.timestamp
          },
          processMemory: {
            value: processMemoryMetric?.value || 0,
            unit: 'MB',
            timestamp: processMemoryMetric?.timestamp
          },
          processCpu: {
            value: processCpuMetric?.value || 0,
            unit: '%',
            timestamp: processCpuMetric?.timestamp
          }
        },
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        activeAlerts: activeAlerts.map(alert => ({
          id: alert._id,
          name: alert.name,
          metric: alert.metric,
          severity: alert.severity,
          lastTriggered: alert.lastTriggeredAt
        }))
      };
    } catch (error) {
      this.logger.error(`Error getting system status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up old metrics
   */
  @Cron('0 0 * * * *') // Every hour
  async cleanupOldMetrics() {
    try {
      const retentionDays = this.configService.get('monitoring.metrics.retentionDays') || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const result = await this.metricModel.deleteMany({
        timestamp: { $lt: cutoffDate }
      }).exec();
      
      this.logger.log(`Cleaned up ${result.deletedCount} old metrics`);
    } catch (error) {
      this.logger.error(`Error cleaning up old metrics: ${error.message}`, error.stack);
    }
  }
}