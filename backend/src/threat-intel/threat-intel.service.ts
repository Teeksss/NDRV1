import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { IntelFeed, IntelFeedDocument } from './schemas/intel-feed.schema';
import { Indicator, IndicatorDocument } from './schemas/indicator.schema';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { CreateIntelFeedDto } from './dto/create-intel-feed.dto';
import { UpdateIntelFeedDto } from './dto/update-intel-feed.dto';
import { ThreatIntelManager } from './threat-intel-manager.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ThreatIntelService implements OnModuleInit {
  constructor(
    @InjectModel(IntelFeed.name) private intelFeedModel: Model<IntelFeedDocument>,
    @InjectModel(Indicator.name) private indicatorModel: Model<IndicatorDocument>,
    private threatIntelManager: ThreatIntelManager,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      // Initialize threat intelligence feeds
      await this.initializeFeeds();
      this.logger.log('Threat intelligence service initialized', 'ThreatIntelService');
    } catch (error) {
      this.logger.error(`Error initializing threat intel service: ${error.message}`, error.stack, 'ThreatIntelService');
    }
  }

  private async initializeFeeds() {
    // Check if we have any feeds configured
    const feedCount = await this.intelFeedModel.countDocuments().exec();
    
    if (feedCount === 0) {
      // Create default feeds
      const defaultFeeds = [
        {
          name: 'AlienVault OTX',
          type: 'otx',
          url: 'https://otx.alienvault.com/api/v1/indicators',
          description: 'AlienVault Open Threat Exchange',
          enabled: true,
          updateInterval: 86400, // 24 hours
        },
        {
          name: 'AbuseIPDB',
          type: 'abuseipdb',
          url: 'https://api.abuseipdb.com/api/v2/blacklist',
          description: 'IP address blacklist from AbuseIPDB',
          enabled: true,
          updateInterval: 86400, // 24 hours
        },
        {
          name: 'Tor Exit Nodes',
          type: 'torexitnodes',
          url: 'https://check.torproject.org/exit-addresses',
          description: 'List of Tor exit nodes',
          enabled: true,
          updateInterval: 43200, // 12 hours
        },
      ];
      
      for (const feed of defaultFeeds) {
        await this.createIntelFeed(feed);
      }
      
      this.logger.log(`Initialized ${defaultFeeds.length} default threat intel feeds`, 'ThreatIntelService');
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateFeeds() {
    try {
      this.logger.log('Starting scheduled update of threat intelligence feeds', 'ThreatIntelService');
      
      // Get all enabled feeds
      const feeds = await this.intelFeedModel.find({ enabled: true }).exec();
      
      // Check each feed if it needs to be updated
      const now = new Date();
      
      for (const feed of feeds) {
        // Calculate the next update time based on the last update and interval
        const nextUpdateTime = new Date(feed.lastUpdated || 0);
        nextUpdateTime.setSeconds(nextUpdateTime.getSeconds() + feed.updateInterval);
        
        // If it's time to update this feed
        if (nextUpdateTime <= now) {
          this.logger.log(`Updating feed: ${feed.name}`, 'ThreatIntelService');
          
          // Update the feed
          await this.threatIntelManager.updateFeed(feed);
          
          // Update the last updated timestamp
          feed.lastUpdated = new Date();
          await feed.save();
        }
      }
      
      this.logger.log('Completed scheduled update of threat intelligence feeds', 'ThreatIntelService');
    } catch (error) {
      this.logger.error(`Error updating threat intel feeds: ${error.message}`, error.stack, 'ThreatIntelService');
    }
  }

  @OnEvent('event.created')
  async checkIndicators(event: any) {
    try {
      // Extract all possible IoCs from the event
      const iocs = this.extractIoCs(event);
      
      if (Object.keys(iocs).length === 0) {
        return;
      }
      
      this.logger.log(`Checking threat intelligence for event ${event.id}`, 'ThreatIntelService');
      
      // Check each IoC against our indicators
      const matches = await this.findMatchingIndicators(iocs);
      
      // If we found matches, emit an event
      if (matches.length > 0) {
        this.logger.log(`Found ${matches.length} threat intelligence matches for event ${event.id}`, 'ThreatIntelService');
        
        const enrichedEvent = {
          ...event,
          threatIntel: {
            matches: matches.map(indicator => ({
              id: indicator.id,
              type: indicator.type,
              value: indicator.value,
              feedName: indicator.feedName,
              category: indicator.category,
              severity: indicator.severity,
              confidence: indicator.confidence,
              lastSeen: indicator.lastSeen,
            }))
          }
        };
        
        // Emit the enriched event
        // eventEmitter.emit('event.enriched', enrichedEvent);
      }
    } catch (error) {
      this.logger.error(`Error checking indicators for event ${event.id}: ${error.message}`, error.stack, 'ThreatIntelService');
    }
  }

  private extractIoCs(event: any): any {
    const iocs: any = {};
    
    // Extract IPs
    if (event.sourceIp) {
      iocs.ip = iocs.ip || [];
      iocs.ip.push(event.sourceIp);
    }
    
    if (event.destinationIp) {
      iocs.ip = iocs.ip || [];
      iocs.ip.push(event.destinationIp);
    }
    
    // Extract domains
    if (event.domain) {
      iocs.domain = iocs.domain || [];
      iocs.domain.push(event.domain);
    }
    
    // Extract URLs
    if (event.url) {
      iocs.url = iocs.url || [];
      iocs.url.push(event.url);
    }
    
    // Extract hashes
    if (event.md5) {
      iocs.md5 = iocs.md5 || [];
      iocs.md5.push(event.md5);
    }
    
    if (event.sha1) {
      iocs.sha1 = iocs.sha1 || [];
      iocs.sha1.push(event.sha1);
    }
    
    if (event.sha256) {
      iocs.sha256 = iocs.sha256 || [];
      iocs.sha256.push(event.sha256);
    }
    
    // Extract from payload if exists
    if (event.payload) {
      // Extract IPs from payload using regex
      const ipMatches = JSON.stringify(event.payload).match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
      if (ipMatches) {
        iocs.ip = iocs.ip || [];
        iocs.ip.push(...ipMatches);
      }
      
      // Extract domains from payload using regex
      const domainMatches = JSON.stringify(event.payload).match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi);
      if (domainMatches) {
        iocs.domain = iocs.domain || [];
        iocs.domain.push(...domainMatches);
      }
    }
    
    // Remove duplicates
    for (const type in iocs) {
      iocs[type] = [...new Set(iocs[type])];
    }
    
    return iocs;
  }

  private async findMatchingIndicators(iocs: any): Promise<Indicator[]> {
    const matches: Indicator[] = [];
    
    // For each IoC type
    for (const type in iocs) {
      const values = iocs[type];
      
      // Find indicators matching this type and values
      const indicators = await this.indicatorModel.find({
        type,
        value: { $in: values },
        enabled: true,
      }).exec();
      
      matches.push(...indicators);
    }
    
    return matches;
  }

  // Intel Feed CRUD operations
  async createIntelFeed(createIntelFeedDto: CreateIntelFeedDto): Promise<IntelFeed> {
    const feed = new this.intelFeedModel(createIntelFeedDto);
    return feed.save();
  }

  async findAllIntelFeeds(params: any = {}): Promise<{
    data: IntelFeed[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      name,
      type,
      enabled,
      page = 1,
      limit = 10,
      sort = 'name',
      order = 'asc',
    } = params;
    
    // Build filter
    const filter: any = {};
    
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (enabled !== undefined) {
      filter.enabled = enabled === 'true' || enabled === true;
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };
    
    // Execute query
    const [data, total] = await Promise.all([
      this.intelFeedModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.intelFeedModel.countDocuments(filter),
    ]);
    
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findIntelFeed(id: string): Promise<IntelFeed> {
    return this.intelFeedModel.findById(id).exec();
  }

  async updateIntelFeed(id: string, updateIntelFeedDto: UpdateIntelFeedDto): Promise<IntelFeed> {
    return this.intelFeedModel
      .findByIdAndUpdate(id, updateIntelFeedDto, { new: true })
      .exec();
  }

  async removeIntelFeed(id: string): Promise<void> {
    await this.intelFeedModel.findByIdAndDelete(id).exec();
  }

  // Manually trigger feed update
  async refreshFeed(id: string): Promise<any> {
    const feed = await this.intelFeedModel.findById(id).exec();
    
    if (!feed) {
      throw new Error(`Feed with ID ${id} not found`);
    }
    
    // Update the feed
    const result = await this.threatIntelManager.updateFeed(feed);
    
    // Update the last updated timestamp
    feed.lastUpdated = new Date();
    await feed.save();
    
    return {
      id: feed.id,
      name: feed.name,
      updateResult: result,
      updatedAt: feed.lastUpdated,
    };
  }

  // Indicator CRUD operations
  async createIndicator(createIndicatorDto: CreateIndicatorDto): Promise<Indicator> {
    const indicator = new this.indicatorModel(createIndicatorDto);
    return indicator.save();
  }

  async findAllIndicators(params: any = {}): Promise<{
    data: Indicator[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      type,
      value,
      feedId,
      category,
      severity,
      confidence,
      enabled,
      page = 1,
      limit = 50,
      sort = 'lastSeen',
      order = 'desc',
    } = params;
    
    // Build filter
    const filter: any = {};
    
    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }
    
    if (value) {
      filter.value = { $regex: value, $options: 'i' };
    }
    
    if (feedId) {
      filter.feedId = feedId;
    }
    
    if (category) {
      filter.category = Array.isArray(category) ? { $in: category } : category;
    }
    
    if (severity) {
      filter.severity = Array.isArray(severity) ? { $in: severity } : severity;
    }
    
    if (confidence) {
      filter.confidence = { $gte: Number(confidence) };
    }
    
    if (enabled !== undefined) {
      filter.enabled = enabled === 'true' || enabled === true;
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };
    
    // Execute query
    const [data, total] = await Promise.all([
      this.indicatorModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.indicatorModel.countDocuments(filter),
    ]);
    
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findIndicator(id: string): Promise<Indicator> {
    return this.indicatorModel.findById(id).exec();
  }

  async updateIndicator(id: string, updateIndicatorDto: UpdateIndicatorDto): Promise<Indicator> {
    return this.indicatorModel
      .findByIdAndUpdate(id, updateIndicatorDto, { new: true })
      .exec();
  }

  async removeIndicator(id: string): Promise<void> {
    await this.indicatorModel.findByIdAndDelete(id).exec();
  }

  // Check a specific value against threat intelligence
  async checkIoC(type: string, value: string): Promise<Indicator[]> {
    return this.indicatorModel
      .find({
        type,
        value,
        enabled: true,
      })
      .exec();
  }

  // Get statistics about the threat intelligence data
  async getStatistics(): Promise<any> {
    const [
      feedCount,
      feedStats,
      totalIndicators,
      indicatorsByType,
      indicatorsBySeverity,
      indicatorsByFeed,
      recentIndicators,
    ] = await Promise.all([
      // Count of feeds
      this.intelFeedModel.countDocuments(),
      
      // Feed statistics
      this.intelFeedModel.aggregate([
        {
          $group: {
            _id: {
              type: '$type',
              enabled: '$enabled',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      
      // Total indicators
      this.indicatorModel.countDocuments(),
      
      // Indicators by type
      this.indicatorModel.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      
      // Indicators by severity
      this.indicatorModel.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),
      
      // Indicators by feed
      this.indicatorModel.aggregate([
        {
          $group: {
            _id: '$feedName',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      
      // Recent indicators
      this.indicatorModel
        .find()
        .sort({ lastSeen: -1 })
        .limit(10)
        .select('type value category severity lastSeen feedName'),
    ]);
    
    // Process feed statistics
    const feedsByType = {};
    feedStats.forEach(stat => {
      const type = stat._id.type;
      const enabled = stat._id.enabled;
      
      if (!feedsByType[type]) {
        feedsByType[type] = { total: 0, enabled: 0 };
      }
      
      feedsByType[type].total += stat.count;
      if (enabled) {
        feedsByType[type].enabled += stat.count;
      }
    });
    
    return {
      feeds: {
        total: feedCount,
        byType: feedsByType,
      },
      indicators: {
        total: totalIndicators,
        byType: indicatorsByType.map(i => ({ type: i._id, count: i.count })),
        bySeverity: indicatorsBySeverity.map(i => ({ severity: i._id, count: i.count })),
        byFeed: indicatorsByFeed.map(i => ({ feed: i._id, count: i.count })),
        recent: recentIndicators,
      },
    };
  }
}