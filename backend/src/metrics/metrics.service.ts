import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SystemMetric, SystemMetricDocument } from './schemas/system-metric.schema';
import { ApplicationMetric, ApplicationMetricDocument } from './schemas/application-metric.schema';
import * as os from 'os';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class MetricsService implements OnModuleInit {
  private startTime: Date;
  private metricsCache: Map<string, any> = new Map();
  private counterMetrics: Map<string, number> = new Map();

  constructor(
    @InjectModel(SystemMetric.name) private systemMetricModel: Model<SystemMetricDocument>,
    @InjectModel(ApplicationMetric.name) private applicationMetricModel: Model<ApplicationMetricDocument>,
    private eventEmitter: EventEmitter2,
    private logger: LoggerService,
  ) {
    this.startTime = new Date();
  }

  async onModuleInit() {
    // Initialize counter metrics with zero values
    this.initializeCounters();
    
    // Collect initial system metrics
    await this.collectSystemMetrics();
    
    this.logger.log('Metrics service initialized', 'MetricsService');
  }

  private initializeCounters() {
    // Initialize counters for all metric types we want to track
    this.counterMetrics.set('events.total', 0);
    this.counterMetrics.set('events.authentication', 0);
    this.counterMetrics.set('events.network', 0);
    this.counterMetrics.set('events.security', 0);
    this.counterMetrics.set('alerts.total', 0);
    this.counterMetrics.set('alerts.critical', 0);
    this.counterMetrics.set('alerts.high', 0);
    this.counterMetrics.set('alerts.medium', 0);
    this.counterMetrics.set('alerts.low', 0);
    this.counterMetrics.set('api.requests', 0);
    this.counterMetrics.set('api.errors', 0);
    this.counterMetrics.set('correlation.evaluations', 0);
    this.counterMetrics.set('correlation.matches', 0);
  }

  // Increment a counter metric
  incrementCounter(metricName: string, value: number = 1) {
    if (this.counterMetrics.has(metricName)) {
      const currentValue = this.counterMetrics.get(metricName) || 0;
      this.counterMetrics.set(metricName, currentValue + value);
    } else {
      // If the counter doesn't exist, create it
      this.counterMetrics.set(metricName, value);
    }
  }

  // Set a gauge metric
  setGauge(metricName: string, value: any) {
    this.metricsCache.set(metricName, value);
  }

  // Get a specific metric
  getMetric(metricName: string): any {
    if (this.counterMetrics.has(metricName)) {
      return this.counterMetrics.get(metricName);
    }
    
    if (this.metricsCache.has(metricName)) {
      return this.metricsCache.get(metricName);
    }
    
    return null;
  }

  // Get all current metrics
  getAllMetrics(): any {
    const metrics = {
      counters: Object.fromEntries(this.counterMetrics),
      gauges: Object.fromEntries(this.metricsCache),
      system: {
        uptime: this.getUptime(),
        memory: this.getMemoryUsage(),
        cpu: this.getCpuUsage(),
      },
      timestamp: new Date(),
    };
    
    return metrics;
  }

  // Event handlers to track metrics
  @OnEvent('event.created')
  handleEventCreated(event: any) {
    // Increment total events counter
    this.incrementCounter('events.total');
    
    // Increment specific event type counter if applicable
    if (event.type) {
      this.incrementCounter(`events.${event.type}`);
    }
  }

  @OnEvent('alert.created')
  handleAlertCreated(alert: any) {
    // Increment total alerts counter
    this.incrementCounter('alerts.total');
    
    // Increment specific alert severity counter
    if (alert.severity) {
      this.incrementCounter(`alerts.${alert.severity}`);
    }
  }

  @OnEvent('http.request')
  handleHttpRequest(data: any) {
    // Increment API request counter
    this.incrementCounter('api.requests');
    
    // Track endpoint-specific metrics if needed
    if (data.endpoint) {
      this.incrementCounter(`api.endpoints.${data.endpoint}`);
    }
  }

  @OnEvent('http.error')
  handleHttpError(data: any) {
    // Increment API error counter
    this.incrementCounter('api.errors');
    
    // Track status-code specific metrics
    if (data.statusCode) {
      this.incrementCounter(`api.errors.${data.statusCode}`);
    }
  }

  @OnEvent('correlation.rule.evaluated')
  handleCorrelationEvaluation(data: any) {
    // Increment correlation evaluation counter
    this.incrementCounter('correlation.evaluations');
    
    // If rule matched, increment matches counter
    if (data.matched) {
      this.incrementCounter('correlation.matches');
    }
  }

  // System metrics collection
  @Cron(CronExpression.EVERY_MINUTE)
  async collectSystemMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        cpu: {
          loadAvg: os.loadavg(),
          cpus: os.cpus().length,
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        },
        process: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        system: {
          uptime: os.uptime(),
          platform: process.platform,
          hostname: os.hostname(),
        },
      };
      
      // Update metrics cache with current values
      this.setGauge('system.memory', metrics.memory);
      this.setGauge('system.cpu', metrics.cpu);
      this.setGauge('process.memory', metrics.process.memory);
      
      // Save to database for historical tracking
      const systemMetric = new this.systemMetricModel(metrics);
      await systemMetric.save();
      
      this.logger.debug('System metrics collected', 'MetricsService');
    } catch (error) {
      this.logger.error(`Error collecting system metrics: ${error.message}`, error.stack, 'MetricsService');
    }
  }

  // Application metrics collection and persistence
  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectApplicationMetrics() {
    try {
      // Create a snapshot of current counter metrics
      const counterSnapshot = Object.fromEntries(this.counterMetrics);
      
      // Create metric document
      const applicationMetric = new this.applicationMetricModel({
        timestamp: new Date(),
        counters: counterSnapshot,
        // Include other application-specific metrics here
      });
      
      // Save to database
      await applicationMetric.save();
      
      this.logger.debug('Application metrics collected and persisted', 'MetricsService');
    } catch (error) {
      this.logger.error(`Error collecting application metrics: ${error.message}`, error.stack, 'MetricsService');
    }
  }

  // Get historical metrics
  async getHistoricalMetrics(
    metricType: string,
    startTime: Date,
    endTime: Date,
    interval: string = 'hour'
  ): Promise<any[]> {
    try {
      // Determine which collection to query
      const isSystemMetric = metricType.startsWith('system.') || metricType.startsWith('process.');
      const model = isSystemMetric ? this.systemMetricModel : this.applicationMetricModel;
      
      // Build match stage for time range
      const matchStage = {
        timestamp: {
          $gte: startTime,
          $lte: endTime,
        },
      };
      
      // Build time grouping based on requested interval
      let timeFormat: string;
      switch (interval) {
        case 'minute':
          timeFormat = '%Y-%m-%d %H:%M';
          break;
        case 'hour':
          timeFormat = '%Y-%m-%d %H:00';
          break;
        case 'day':
          timeFormat = '%Y-%m-%d';
          break;
        case 'week':
          timeFormat = '%Y-W%V';
          break;
        case 'month':
          timeFormat = '%Y-%m';
          break;
        default:
          timeFormat = '%Y-%m-%d %H:00';
      }
      
      // Pipeline for system metrics is different from application metrics
      let pipeline: any[];
      
      if (isSystemMetric) {
        // For system metrics (cpu, memory, etc.)
        // Extract metric path components
        const metricPath = metricType.split('.');
        
        // Build projection for the specific metric
        const projectionField = {};
        projectionField[metricType] = 1;
        
        pipeline = [
          { $match: matchStage },
          {
            $project: {
              timestamp: 1,
              value: `$${metricPath.join('.')}`,
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: timeFormat, date: '$timestamp' } },
              avg: { $avg: '$value' },
              min: { $min: '$value' },
              max: { $max: '$value' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ];
      } else {
        // For application metrics (counters)
        // Extract metric name for counters
        const metricName = metricType.replace('counters.', '');
        
        pipeline = [
          { $match: matchStage },
          {
            $project: {
              timestamp: 1,
              value: `$counters.${metricName}`,
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: timeFormat, date: '$timestamp' } },
              value: { $max: '$value' }, // Use max for counters as they are always increasing
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ];
      }
      
      // Execute aggregation
      const results = await model.aggregate(pipeline).exec();
      
      return results.map(item => ({
        timestamp: item._id,
        ...item,
      }));
    } catch (error) {
      this.logger.error(`Error retrieving historical metrics: ${error.message}`, error.stack, 'MetricsService');
      throw error;
    }
  }

  // Get dashboard metrics summary
  async getDashboardMetrics(): Promise<any> {
    try {
      // Get current values
      const currentMetrics = this.getAllMetrics();
      
      // Get some historical data for trends
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const [
        eventsTrend,
        alertsTrend,
        apiRequestsTrend,
        systemMetricsTrend,
      ] = await Promise.all([
        this.getHistoricalMetrics('counters.events.total', oneDayAgo, new Date(), 'hour'),
        this.getHistoricalMetrics('counters.alerts.total', oneDayAgo, new Date(), 'hour'),
        this.getHistoricalMetrics('counters.api.requests', oneDayAgo, new Date(), 'hour'),
        this.getHistoricalMetrics('system.memory.usagePercent', oneDayAgo, new Date(), 'hour'),
      ]);
      
      return {
        current: currentMetrics,
        trends: {
          events: eventsTrend,
          alerts: alertsTrend,
          apiRequests: apiRequestsTrend,
          systemMetrics: systemMetricsTrend,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard metrics: ${error.message}`, error.stack, 'MetricsService');
      throw error;
    }
  }

  // Utility methods
  private getUptime(): number {
    return (new Date().getTime() - this.startTime.getTime()) / 1000;
  }

  private getMemoryUsage(): any {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      percentUsed: (usedMem / totalMem) * 100,
    };
  }

  private getCpuUsage(): any {
    return {
      loadAvg: os.loadavg(),
      cpus: os.cpus().length,
    };
  }
}