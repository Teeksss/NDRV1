import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Flow } from './entities/flow.entity';
import { TopN } from './entities/top-n.entity';
import { FlowStats } from './entities/flow-stats.entity';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @InjectModel(Flow.name) private flowModel: Model<Flow>,
    @InjectModel(TopN.name) private topNModel: Model<TopN>,
    @InjectModel(FlowStats.name) private flowStatsModel: Model<FlowStats>
  ) {}

  /**
   * Get flows with filters
   */
  async getFlows(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options;
      
      return this.flowModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting flows: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get recent flows
   */
  async getRecentFlows(limit: number = 100) {
    try {
      return this.flowModel
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting recent flows: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new flow
   */
  async createFlow(flowData: any) {
    try {
      // Set timestamp if not provided
      if (!flowData.timestamp) {
        flowData.timestamp = new Date();
      }
      
      // Create flow
      const flow = await this.flowModel.create(flowData);
      
      // Emit flow creation event
      this.eventEmitter.emit('flow.created', flow);
      
      return flow;
    } catch (error) {
      this.logger.error(`Error creating flow: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get flow statistics since date
   */
  async getFlowStatistics(sinceDate: Date) {
    try {
      // Use existing stats if available
      const existingStats = await this.flowStatsModel
        .findOne({
          'period.start': { $lte: sinceDate },
          'period.end': { $gte: new Date() }
        })
        .sort({ timestamp: -1 })
        .exec();
      
      if (existingStats) {
        return {
          totalFlows: existingStats.flowCount,
          totalBytes: existingStats.bytes,
          totalPackets: existingStats.packets,
          uniqueIPs: existingStats.uniqueIPCount,
          byProtocol: existingStats.protocolDistribution
        };
      }
      
      // Calculate statistics from raw flow data
      const flowCount = await this.flowModel.countDocuments({
        timestamp: { $gte: sinceDate }
      }).exec();
      
      // Calculate total bytes and packets
      const totals = await this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: null, 
            totalBytes: { $sum: '$bytes' }, 
            totalPackets: { $sum: '$packets' } 
          } 
        }
      ]).exec();
      
      // Count by protocol
      const protocolCounts = await this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: '$protocol', 
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' }
          } 
        }
      ]).exec();
      
      // Count by port
      const portCounts = await this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: '$destinationPort', 
            count: { $sum: 1 }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).exec();
      
      // Count unique IPs
      const uniqueSourceIPs = await this.flowModel.distinct('sourceIp', {
        timestamp: { $gte: sinceDate }
      }).exec();
      
      const uniqueDestIPs = await this.flowModel.distinct('destinationIp', {
        timestamp: { $gte: sinceDate }
      }).exec();
      
      // Combine unique IPs
      const uniqueIPs = new Set([...uniqueSourceIPs, ...uniqueDestIPs]);
      
      // Format protocol distribution
      const protocolDistribution = {};
      protocolCounts.forEach(p => {
        if (p._id) {
          protocolDistribution[p._id] = {
            count: p.count,
            bytes: p.bytes
          };
        }
      });
      
      // Format port distribution
      const portDistribution = {};
      portCounts.forEach(p => {
        if (p._id) {
          portDistribution[p._id] = p.count;
        }
      });
      
      return {
        totalFlows: flowCount,
        totalBytes: totals.length > 0 ? totals[0].totalBytes : 0,
        totalPackets: totals.length > 0 ? totals[0].totalPackets : 0,
        uniqueIPs: uniqueIPs.size,
        byProtocol: protocolDistribution,
        byPort: portDistribution
      };
    } catch (error) {
      this.logger.error(`Error getting flow statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get top sources
   */
  async getTopSources(sinceDate: Date, limit: number = 10) {
    try {
      // Use existing top-n data if available
      const existingTopN = await this.topNModel
        .findOne({
          'period.start': { $lte: sinceDate },
          'period.end': { $gte: new Date() }
        })
        .sort({ timestamp: -1 })
        .exec();
      
      if (existingTopN && existingTopN.topSources && existingTopN.topSources.length > 0) {
        return existingTopN.topSources.slice(0, limit);
      }
      
      // Calculate from raw flow data
      return this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: '$sourceIp', 
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            packets: { $sum: '$packets' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting top sources: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get top destinations
   */
  async getTopDestinations(sinceDate: Date, limit: number = 10) {
    try {
      // Use existing top-n data if available
      const existingTopN = await this.topNModel
        .findOne({
          'period.start': { $lte: sinceDate },
          'period.end': { $gte: new Date() }
        })
        .sort({ timestamp: -1 })
        .exec();
      
      if (existingTopN && existingTopN.topDestinations && existingTopN.topDestinations.length > 0) {
        return existingTopN.topDestinations.slice(0, limit);
      }
      
      // Calculate from raw flow data
      return this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: '$destinationIp', 
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            packets: { $sum: '$packets' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting top destinations: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get top conversations
   */
  async getTopConversations(sinceDate: Date, limit: number = 10) {
    try {
      // Use existing top-n data if available
      const existingTopN = await this.topNModel
        .findOne({
          'period.start': { $lte: sinceDate },
          'period.end': { $gte: new Date() }
        })
        .sort({ timestamp: -1 })
        .exec();
      
      if (existingTopN && existingTopN.topConversations && existingTopN.topConversations.length > 0) {
        return existingTopN.topConversations.slice(0, limit);
      }
      
      // Calculate from raw flow data
      return this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: { 
              source: '$sourceIp', 
              destination: '$destinationIp' 
            },
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            packets: { $sum: '$packets' }
          } 
        },
        { $sort: { bytes: -1 } },
        { $limit: limit }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting top conversations: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get top applications (based on protocol/port)
   */
  async getTopApplications(sinceDate: Date, limit: number = 10) {
    try {
      return this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: { 
              protocol: '$protocol', 
              port: '$destinationPort' 
            },
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            protocol: '$_id.protocol',
            port: '$_id.port',
            count: 1,
            bytes: 1,
            application: {
              $cond: [
                { $ne: ['$_id.port', null] },
                {
                  $cond: [
                    { $eq: ['$_id.port', 80] },
                    'HTTP',
                    {
                      $cond: [
                        { $eq: ['$_id.port', 443] },
                        'HTTPS',
                        {
                          $cond: [
                            { $eq: ['$_id.port', 53] },
                            'DNS',
                            {
                              $cond: [
                                { $eq: ['$_id.port', 22] },
                                'SSH',
                                {
                                  $cond: [
                                    { $eq: ['$_id.port', 21] },
                                    'FTP',
                                    {
                                      $concat: [
                                        { $toString: '$_id.protocol' },
                                        '/',
                                        { $toString: '$_id.port' }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                { $toString: '$_id.protocol' }
              ]
            }
          }
        }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting top applications: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get top ports
   */
  async getTopPorts(sinceDate: Date, limit: number = 10) {
    try {
      return this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        { 
          $group: { 
            _id: '$destinationPort', 
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' }
          } 
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting top ports: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get hourly traffic statistics
   */
  async getHourlyTrafficStats(sinceDate: Date) {
    try {
      return this.flowModel.aggregate([
        { $match: { timestamp: { $gte: sinceDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' }
            },
            flowCount: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            packets: { $sum: '$packets' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        {
          $project: {
            _id: 0,
            timestamp: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
                hour: '$_id.hour'
              }
            },
            flowCount: 1,
            bytes: 1,
            packets: 1
          }
        }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting hourly traffic stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get destinations for source
   */
  async getDestinationsForSource(sourceIp: string, sinceDate: Date, limit: number = 100) {
    try {
      return this.flowModel.aggregate([
        { 
          $match: { 
            sourceIp,
            timestamp: { $gte: sinceDate } 
          } 
        },
        { 
          $group: { 
            _id: '$destinationIp', 
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            firstSeen: { $min: '$timestamp' },
            lastSeen: { $max: '$timestamp' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting destinations for source: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get ports for source
   */
  async getPortsForSource(sourceIp: string, sinceDate: Date, limit: number = 100) {
    try {
      return this.flowModel.aggregate([
        { 
          $match: { 
            sourceIp,
            timestamp: { $gte: sinceDate } 
          } 
        },
        { 
          $group: { 
            _id: '$destinationPort', 
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            destinations: { $addToSet: '$destinationIp' }
          } 
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $project: {
            port: '$_id',
            _id: 0,
            count: 1,
            bytes: 1,
            uniqueDestinations: { $size: '$destinations' }
          }
        }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error getting ports for source: ${error.message}`, error.stack);
      throw error;
    }
  }
}