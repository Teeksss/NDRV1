import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

import { TrafficAnomaly } from './entities/traffic-anomaly.entity';
import { BaselineStats } from './entities/baseline-stats.entity';
import { AlertService } from '../../alerts/alert.service';
import { FlowService } from '../../network/flow-analyzer/flow.service';

@Injectable()
export class TrafficAnomalyDetectorService implements OnModuleInit {
  private readonly logger = new Logger(TrafficAnomalyDetectorService.name);
  private isInitialized = false;
  private flowCache = new Map<string, any[]>();
  private maxCacheSize = 1000;
  private baselinePeriodDays = 7;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private alertService: AlertService,
    private flowService: FlowService,
    @InjectModel(TrafficAnomaly.name) private anomalyModel: Model<TrafficAnomaly>,
    @InjectModel(BaselineStats.name) private baselineModel: Model<BaselineStats>
  ) {}

  async onModuleInit() {
    if (!this.configService.get('detection.trafficAnomaly.enabled')) {
      this.logger.log('Traffic Anomaly Detection is disabled');
      return;
    }

    this.logger.log('Initializing Traffic Anomaly Detector Service');
    
    // Load configuration
    this.maxCacheSize = this.configService.get('detection.trafficAnomaly.flowCacheSize') || 1000;
    this.baselinePeriodDays = this.configService.get('detection.trafficAnomaly.baselineDays') || 7;
    
    this.isInitialized = true;
    this.logger.log('Traffic Anomaly Detector Service initialized');
  }

  /**
   * Handle flow creation
   */
  @OnEvent('flow.created')
  async handleFlowCreated(flow: any) {
    if (!this.isInitialized) {
      return;
    }
    
    try {
      // Add to flow cache
      this.addToFlowCache(flow);
      
      // Check for anomalies
      await this.detectFlowAnomalies(flow);
    } catch (error) {
      this.logger.error(`Error handling flow event: ${error.message}`, error.stack);
    }
  }

  /**
   * Add flow to cache
   */
  private addToFlowCache(flow: any) {
    try {
      // Check if cache is full
      if (this.flowCache.size >= this.maxCacheSize) {
        // Remove oldest entry
        const oldestKey = this.flowCache.keys().next().value;
        this.flowCache.delete(oldestKey);
      }
      
      // Add source IP to cache
      if (flow.sourceIp) {
        const sourceKey = `src:${flow.sourceIp}`;
        const sourceFlows = this.flowCache.get(sourceKey) || [];
        sourceFlows.push({
          timestamp: flow.timestamp,
          bytes: flow.bytes,
          packets: flow.packets,
          destinationIp: flow.destinationIp,
          destinationPort: flow.destinationPort,
          protocol: flow.protocol
        });
        this.flowCache.set(sourceKey, sourceFlows);
      }
      
      // Add destination IP to cache
      if (flow.destinationIp) {
        const destKey = `dst:${flow.destinationIp}`;
        const destFlows = this.flowCache.get(destKey) || [];
        destFlows.push({
          timestamp: flow.timestamp,
          bytes: flow.bytes,
          packets: flow.packets,
          sourceIp: flow.sourceIp,
          sourcePort: flow.sourcePort,
          protocol: flow.protocol
        });
        this.flowCache.set(destKey, destFlows);
      }
    } catch (error) {
      this.logger.error(`Error adding flow to cache: ${error.message}`, error.stack);
    }
  }

  /**
   * Detect flow anomalies
   */
  private async detectFlowAnomalies(flow: any) {
    try {
      // Get baseline stats for source and destination
      const sourceBaseline = await this.getBaselineStats(flow.sourceIp, 'source');
      const destBaseline = await this.getBaselineStats(flow.destinationIp, 'destination');
      
      // Check for anomalies
      await this.checkVolumeAnomaly(flow, sourceBaseline, destBaseline);
      await this.checkConnectionAnomaly(flow, sourceBaseline, destBaseline);
      await this.checkNewHostAnomaly(flow);
    } catch (error) {
      this.logger.error(`Error detecting flow anomalies: ${error.message}`, error.stack);
    }
  }

  /**
   * Get baseline stats for host
   */
  private async getBaselineStats(ipAddress: string, direction: string): Promise<any> {
    if (!ipAddress) {
      return null;
    }
    
    try {
      // Check if baseline exists
      const baseline = await this.baselineModel.findOne({
        ipAddress,
        direction
      }).exec();
      
      return baseline;
    } catch (error) {
      this.logger.error(`Error getting baseline stats: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Check for volume anomaly
   */
  private async checkVolumeAnomaly(flow: any, sourceBaseline: any, destBaseline: any) {
    try {
      if (!flow.bytes) {
        return;
      }
      
      // Check source volume
      if (sourceBaseline && sourceBaseline.avgBytesPerFlow > 0) {
        const ratio = flow.bytes / sourceBaseline.avgBytesPerFlow;
        
        if (ratio > 10 && flow.bytes > 1000000) { // 1MB threshold
          await this.createAnomaly('volume', {
            sourceIp: flow.sourceIp,
            destinationIp: flow.destinationIp,
            protocol: flow.protocol,
            bytesRatio: ratio,
            bytes: flow.bytes,
            baseline: sourceBaseline.avgBytesPerFlow,
            severity: this.calculateVolumeSeverity(ratio, flow.bytes),
            description: `Unusual outbound traffic volume from ${flow.sourceIp} to ${flow.destinationIp} (${Math.round(ratio)}x normal)`
          }, flow);
        }
      }
      
      // Check destination volume
      if (destBaseline && destBaseline.avgBytesPerFlow > 0) {
        const ratio = flow.bytes / destBaseline.avgBytesPerFlow;
        
        if (ratio > 10 && flow.bytes > 1000000) { // 1MB threshold
          await this.createAnomaly('volume', {
            sourceIp: flow.sourceIp,
            destinationIp: flow.destinationIp,
            protocol: flow.protocol,
            bytesRatio: ratio,
            bytes: flow.bytes,
            baseline: destBaseline.avgBytesPerFlow,
            severity: this.calculateVolumeSeverity(ratio, flow.bytes),
            description: `Unusual inbound traffic volume to ${flow.destinationIp} from ${flow.sourceIp} (${Math.round(ratio)}x normal)`
          }, flow);
        }
      }
    } catch (error) {
      this.logger.error(`Error checking volume anomaly: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for connection anomaly
   */
  private async checkConnectionAnomaly(flow: any, sourceBaseline: any, destBaseline: any) {
    try {
      // Skip if not established connection or missing port
      if (!flow.destinationPort) {
        return;
      }
      
      // Check if destination port is unusual for this source
      if (sourceBaseline && sourceBaseline.commonPorts && sourceBaseline.commonPorts.length > 0) {
        if (!sourceBaseline.commonPorts.includes(flow.destinationPort)) {
          // Check if this is a low port (potentially more sensitive)
          const isLowPort = flow.destinationPort < 1024;
          
          // Check cache to see if this source has connected to this port recently
          const sourceKey = `src:${flow.sourceIp}`;
          const sourceFlows = this.flowCache.get(sourceKey) || [];
          
          const recentPortUse = sourceFlows.some(f => 
            f.destinationPort === flow.destinationPort && 
            f.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
          );
          
          if (!recentPortUse || isLowPort) {
            await this.createAnomaly('connection', {
              sourceIp: flow.sourceIp,
              destinationIp: flow.destinationIp,
              protocol: flow.protocol,
              port: flow.destinationPort,
              commonPorts: sourceBaseline.commonPorts,
              severity: isLowPort ? 'high' : 'medium',
              description: `Unusual connection from ${flow.sourceIp} to ${flow.destinationIp}:${flow.destinationPort}`
            }, flow);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking connection anomaly: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for new host anomaly
   */
  private async checkNewHostAnomaly(flow: any) {
    // Skip if feature is disabled
    if (!this.configService.get('detection.trafficAnomaly.detectNewHosts')) {
      return;
    }
    
    try {
      // Check if source is a new host
      if (flow.sourceIp) {
        const sourceBaseline = await this.baselineModel.findOne({
          ipAddress: flow.sourceIp
        }).exec();
        
        if (!sourceBaseline) {
          await this.createAnomaly('new_host', {
            sourceIp: flow.sourceIp,
            destinationIp: flow.destinationIp,
            protocol: flow.protocol,
            severity: 'medium',
            description: `New host detected: ${flow.sourceIp}`
          }, flow);
        }
      }
    } catch (error) {
      this.logger.error(`Error checking new host anomaly: ${error.message}`, error.stack);
    }
  }

  /**
   * Calculate volume anomaly severity
   */
  private calculateVolumeSeverity(ratio: number, bytes: number): string {
    if (ratio > 100 && bytes > 100000000) { // 100x normal, 100MB
      return 'critical';
    } else if (ratio > 50 && bytes > 10000000) { // 50x normal, 10MB
      return 'high';
    } else if (ratio > 20) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Create anomaly record
   */
  private async createAnomaly(type: string, data: any, flow: any) {
    try {
      // Lookup existing similar anomaly within the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const existingAnomaly = await this.anomalyModel.findOne({
        type,
        'details.sourceIp': data.sourceIp,
        'details.destinationIp': data.destinationIp,
        detectedAt: { $gte: oneHourAgo }
      }).exec();
      
      if (existingAnomaly) {
        // Update existing anomaly
        await this.anomalyModel.updateOne(
          { _id: existingAnomaly._id },
          {
            $set: {
              lastSeenAt: new Date(),
              updatedAt: new Date(),
              status: 'active'
            },
            $inc: {
              occurrences: 1
            }
          }
        ).exec();
        
        return;
      }
      
      // Create new anomaly
      const anomaly = await this.anomalyModel.create({
        type,
        details: data,
        flowId: flow._id,
        sourceIp: data.sourceIp,
        destinationIp: data.destinationIp,
        severity: data.severity,
        status: 'active',
        occurrences: 1,
        description: data.description,
        detectedAt: new Date(),
        lastSeenAt: new Date()
      });
      
      // Emit event
      this.eventEmitter.emit('anomaly.detected', {
        anomalyId: anomaly._id,
        type,
        sourceIp: data.sourceIp,
        destinationIp: data.destinationIp,
        severity: data.severity
      });
      
      // Create alert if enabled
      if (this.configService.get('detection.trafficAnomaly.createAlerts')) {
        await this.alertService.createAlert({
          title: `Traffic Anomaly: ${this.formatAnomalyType(type)}`,
          description: data.description,
          severity: data.severity,
          source: 'traffic_anomaly',
          sourceRef: anomaly._id.toString(),
          status: 'new',
          ipAddress: data.sourceIp,
          timestamp: new Date(),
          metadata: {
            anomalyId: anomaly._id.toString(),
            type,
            flowId: flow._id.toString(),
            sourceIp: data.sourceIp,
            destinationIp: data.destinationIp,
            ...data
          }
        });
      }
    } catch (error) {
      this.logger.error(`Error creating anomaly: ${error.message}`, error.stack);
    }
  }

  /**
   * Format anomaly type for display
   */
  private formatAnomalyType(type: string): string {
    switch (type) {
      case 'volume':
        return 'Unusual Traffic Volume';
      case 'connection':
        return 'Unusual Connection';
      case 'new_host':
        return 'New Host Detected';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  /**
   * Update baseline statistics
   */
  @Cron('0 0 * * *') // Every day at midnight
  async updateBaselineStats() {
    if (!this.isInitialized) {
      return;
    }
    
    try {
      this.logger.log('Updating baseline statistics');
      
      // Get date range
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - this.baselinePeriodDays);
      
      // Update source IP baselines
      await this.updateHostBaselines(startDate, endDate, 'source');
      
      // Update destination IP baselines
      await this.updateHostBaselines(startDate, endDate, 'destination');
      
      this.logger.log('Baseline statistics update completed');
    } catch (error) {
      this.logger.error(`Error updating baseline stats: ${error.message}`, error.stack);
    }
  }

  /**
   * Update host baselines for a specific direction
   */
  private async updateHostBaselines(startDate: Date, endDate: Date, direction: string) {
    try {
      // Get field names based on direction
      const ipField = direction === 'source' ? 'sourceIp' : 'destinationIp';
      
      // Get top hosts by flow count
      const topHosts = await this.flowService.getTopSources(startDate, 1000);
      
      // Process each host
      for (const host of topHosts) {
        const ipAddress = host._id;
        
        if (!ipAddress) {
          continue;
        }
        
        // Skip non-IP addresses (sometimes flow sources can be other identifiers)
        if (!this.isValidIpAddress(ipAddress)) {
          continue;
        }
        
        // Get flow statistics for this host
        const filters: any = {};
        filters[ipField] = ipAddress;
        filters.timestamp = { $gte: startDate, $lte: endDate };
        
        const flows = await this.flowService.getFlows(filters, { limit: 10000 });
        
        if (flows.length === 0) {
          continue;
        }
        
        // Calculate metrics
        const metrics = this.calculateHostMetrics(flows, direction);
        
        // Update or create baseline stats
        await this.baselineModel.updateOne(
          {
            ipAddress,
            direction
          },
          {
            $set: {
              ipAddress,
              direction,
              totalFlows: flows.length,
              totalBytes: metrics.totalBytes,
              totalPackets: metrics.totalPackets,
              avgBytesPerFlow: metrics.avgBytesPerFlow,
              avgPacketsPerFlow: metrics.avgPacketsPerFlow,
              commonPorts: metrics.commonPorts,
              commonProtocols: metrics.commonProtocols,
              commonDestinations: metrics.commonDestinations,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        ).exec();
      }
    } catch (error) {
      this.logger.error(`Error updating ${direction} host baselines: ${error.message}`, error.stack);
    }
  }

  /**
   * Calculate host metrics
   */
  private calculateHostMetrics(flows: any[], direction: string): any {
    const totalBytes = flows.reduce((sum, flow) => sum + (flow.bytes || 0), 0);
    const totalPackets = flows.reduce((sum, flow) => sum + (flow.packets || 0), 0);
    
    // Calculate average bytes/packets per flow
    const avgBytesPerFlow = Math.round(totalBytes / flows.length);
    const avgPacketsPerFlow = Math.round(totalPackets / flows.length);
    
    // Get port statistics
    const portCounts: any = {};
    const protocolCounts: any = {};
    const destinationCounts: any = {};
    
    for (const flow of flows) {
      // Count ports
      if (flow.destinationPort) {
        portCounts[flow.destinationPort] = (portCounts[flow.destinationPort] || 0) + 1;
      }
      
      // Count protocols
      if (flow.protocol) {
        protocolCounts[flow.protocol] = (protocolCounts[flow.protocol] || 0) + 1;
      }
      
      // Count destinations
      if (direction === 'source' && flow.destinationIp) {
        destinationCounts[flow.destinationIp] = (destinationCounts[flow.destinationIp] || 0) + 1;
      }
    }
    
    // Sort and get most common
    const commonPorts = Object.entries(portCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 20)
      .map(entry => parseInt(entry[0]));
    
    const commonProtocols = Object.entries(protocolCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)
      .map(entry => entry[0]);
    
    const commonDestinations = Object.entries(destinationCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 50)
      .map(entry => entry[0]);
    
    return {
      totalBytes,
      totalPackets,
      avgBytesPerFlow,
      avgPacketsPerFlow,
      commonPorts,
      commonProtocols,
      commonDestinations
    };
  }

  /**
   * Check if string is a valid IP address
   */
  private isValidIpAddress(ip: string): boolean {
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    return ipRegex.test(ip);
  }

  /**
   * Get anomalies with filters
   */
  async getAnomalies(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { detectedAt: -1 } } = options;
      
      return this.anomalyModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting anomalies: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get anomaly by ID
   */
  async getAnomalyById(anomalyId: string) {
    try {
      return this.anomalyModel.findById(anomalyId).exec();
    } catch (error) {
      this.logger.error(`Error getting anomaly by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update anomaly status
   */
  async updateAnomalyStatus(anomalyId: string, status: string, notes?: string) {
    try {
      // Validate status
      const validStatuses = ['active', 'investigating', 'resolved', 'false_positive'];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Update status
      const anomaly = await this.anomalyModel.findByIdAndUpdate(
        anomalyId,
        {
          status,
          notes: notes || undefined,
          updatedAt: new Date(),
          resolvedAt: ['resolved', 'false_positive'].includes(status) ? new Date() : undefined
        },
        { new: true }
      ).exec();
      
      if (!anomaly) {
        throw new Error(`Anomaly not found: ${anomalyId}`);
      }
      
      // Emit event
      this.eventEmitter.emit('anomaly.status_updated', {
        anomalyId,
        status,
        previousStatus: anomaly.status
      });
      
      return anomaly;
    } catch (error) {
      this.logger.error(`Error updating anomaly status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get anomaly statistics
   */
  async getAnomalyStatistics(days: number = 7) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      
      // Count total anomalies
      const totalAnomalies = await this.anomalyModel.countDocuments({
        detectedAt: { $gte: startDate, $lte: endDate }
      }).exec();
      
      // Count by type
      const byType = await this.anomalyModel.aggregate([
        { $match: { detectedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by severity
      const bySeverity = await this.anomalyModel.aggregate([
        { $match: { detectedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by status
      const byStatus = await this.anomalyModel.aggregate([
        { $match: { detectedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by day
      const dailyData = await this.anomalyModel.aggregate([
        { $match: { detectedAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$detectedAt' },
              month: { $month: '$detectedAt' },
              day: { $dayOfMonth: '$detectedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]).exec();
      
      // Format daily data
      const formattedDailyData = dailyData.map(day => {
        const date = new Date(day._id.year, day._id.month - 1, day._id.day);
        return {
          date: date.toISOString().split('T')[0],
          count: day.count
        };
      });
      
      return {
        totalAnomalies,
        byType: byType.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        dailyData: formattedDailyData,
        timeRange: {
          start: startDate,
          end: endDate,
          days
        }
      };
    } catch (error) {
      this.logger.error(`Error getting anomaly statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up old anomalies
   */
  @Cron('0 2 * * *') // 2 AM every day
  async cleanupOldAnomalies() {
    try {
      const retentionDays = this.configService.get('detection.trafficAnomaly.retentionDays') || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const result = await this.anomalyModel.deleteMany({
        detectedAt: { $lt: cutoffDate },
        status: { $in: ['resolved', 'false_positive'] }
      }).exec();
      
      this.logger.log(`Cleaned up ${result.deletedCount} old anomalies`);
    } catch (error) {
      this.logger.error(`Error cleaning up old anomalies: ${error.message}`, error.stack);
    }
  }
}