import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

import { IOC } from './entities/ioc.entity';
import { IOCFeed } from './entities/ioc-feed.entity';
import { IOCMatch } from './entities/ioc-match.entity';
import { AlertService } from '../../alerts/alert.service';

@Injectable()
export class IOCScannerService implements OnModuleInit {
  private readonly logger = new Logger(IOCScannerService.name);
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private alertService: AlertService,
    @InjectModel(IOC.name) private iocModel: Model<IOC>,
    @InjectModel(IOCFeed.name) private feedModel: Model<IOCFeed>,
    @InjectModel(IOCMatch.name) private matchModel: Model<IOCMatch>
  ) {}

  async onModuleInit() {
    if (!this.configService.get('detection.iocScanner.enabled')) {
      this.logger.log('IOC Scanner is disabled');
      return;
    }

    this.logger.log('Initializing IOC Scanner Service');
    
    // Update IOC feeds on startup if configured
    if (this.configService.get('detection.iocScanner.updateOnStartup')) {
      this.updateFeeds().catch(err => {
        this.logger.error(`Error updating IOC feeds on startup: ${err.message}`);
      });
    }
    
    this.isInitialized = true;
    this.logger.log('IOC Scanner Service initialized');
  }

  /**
   * Update IOC feeds
   */
  async updateFeeds() {
    try {
      // Get active feeds
      const feeds = await this.feedModel.find({ active: true }).exec();
      
      if (feeds.length === 0) {
        this.logger.log('No active IOC feeds found');
        return { success: true, message: 'No active IOC feeds found' };
      }
      
      this.logger.log(`Updating ${feeds.length} IOC feeds`);
      
      // Process each feed
      const results = await Promise.all(
        feeds.map(feed => this.updateFeed(feed))
      );
      
      return {
        success: true,
        results
      };
    } catch (error) {
      this.logger.error(`Error updating IOC feeds: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a single feed
   */
  private async updateFeed(feed: any) {
    try {
      this.logger.log(`Updating feed: ${feed.name}`);
      
      // Download feed data
      const data = await this.downloadFeed(feed);
      
      if (!data) {
        throw new Error('Failed to download feed data');
      }
      
      // Parse data based on feed format
      const iocs = await this.parseFeedData(feed, data);
      
      if (!iocs || iocs.length === 0) {
        throw new Error('No IOCs found in feed data');
      }
      
      this.logger.log(`Parsed ${iocs.length} IOCs from feed: ${feed.name}`);
      
      // Update or insert IOCs
      const stats = await this.updateIOCs(feed, iocs);
      
      // Update feed status
      await this.feedModel.updateOne(
        { _id: feed._id },
        {
          lastFetchedAt: new Date(),
          lastStatus: 'success',
          lastStats: stats
        }
      ).exec();
      
      this.logger.log(`Feed update completed: ${feed.name} (added: ${stats.added}, updated: ${stats.updated}, removed: ${stats.removed})`);
      
      return {
        feedId: feed._id,
        name: feed.name,
        success: true,
        stats
      };
    } catch (error) {
      this.logger.error(`Error updating feed ${feed.name}: ${error.message}`, error.stack);
      
      // Update feed status
      await this.feedModel.updateOne(
        { _id: feed._id },
        {
          lastFetchedAt: new Date(),
          lastStatus: 'error',
          lastError: error.message
        }
      ).exec();
      
      return {
        feedId: feed._id,
        name: feed.name,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download feed data
   */
  private async downloadFeed(feed: any): Promise<string> {
    try {
      // Configure request
      const options: any = {
        url: feed.url,
        method: 'GET',
        timeout: 30000, // 30 seconds
        responseType: 'text'
      };
      
      // Add headers if configured
      if (feed.headers) {
        options.headers = feed.headers;
      }
      
      // Make request
      const response = await axios(options);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error downloading feed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse feed data
   */
  private async parseFeedData(feed: any, data: string): Promise<any[]> {
    try {
      switch (feed.format) {
        case 'csv':
          return this.parseCSVFeed(feed, data);
          
        case 'json':
          return this.parseJSONFeed(feed, data);
          
        case 'stix':
          return this.parseSTIXFeed(feed, data);
          
        case 'taxii':
          return this.parseTAXIIFeed(feed, data);
          
        default:
          throw new Error(`Unsupported feed format: ${feed.format}`);
      }
    } catch (error) {
      this.logger.error(`Error parsing feed data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse CSV feed
   */
  private async parseCSVFeed(feed: any, data: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results = [];
      const csvOptions = feed.csvOptions || {};
      
      // Create temp file
      const tempDir = this.configService.get('tempDir') || './tmp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, `ioc_feed_${feed._id}_${Date.now()}.csv`);
      
      try {
        // Write data to temp file
        fs.writeFileSync(tempFile, data);
        
        // Parse CSV
        fs.createReadStream(tempFile)
          .pipe(csv(csvOptions))
          .on('data', (row) => {
            try {
              const ioc = this.mapFeedRowToIOC(feed, row);
              if (ioc) {
                results.push(ioc);
              }
            } catch (err) {
              this.logger.warn(`Error parsing row: ${err.message}`);
            }
          })
          .on('end', () => {
            // Delete temp file
            fs.unlinkSync(tempFile);
            resolve(results);
          })
          .on('error', (err) => {
            fs.unlinkSync(tempFile);
            reject(err);
          });
      } catch (error) {
        // Make sure to clean up temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        reject(error);
      }
    });
  }

  /**
   * Parse JSON feed
   */
  private async parseJSONFeed(feed: any, data: string): Promise<any[]> {
    try {
      // Parse JSON
      const jsonData = JSON.parse(data);
      
      // Extract IOCs based on JSON path
      let items = jsonData;
      
      if (feed.jsonPath) {
        // Split path by dots and navigate object
        const pathParts = feed.jsonPath.split('.');
        
        for (const part of pathParts) {
          if (!items || !items[part]) {
            throw new Error(`Invalid JSON path: ${feed.jsonPath}`);
          }
          
          items = items[part];
        }
      }
      
      if (!Array.isArray(items)) {
        throw new Error('JSON path does not resolve to an array');
      }
      
      // Map items to IOCs
      return items
        .map(item => this.mapFeedRowToIOC(feed, item))
        .filter(ioc => ioc !== null);
    } catch (error) {
      this.logger.error(`Error parsing JSON feed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse STIX feed
   */
  private async parseSTIXFeed(feed: any, data: string): Promise<any[]> {
    // This is a placeholder that would be implemented for STIX format
    this.logger.warn('STIX feed parsing not fully implemented');
    
    return [];
  }

  /**
   * Parse TAXII feed
   */
  private async parseTAXIIFeed(feed: any, data: string): Promise<any[]> {
    // This is a placeholder that would be implemented for TAXII format
    this.logger.warn('TAXII feed parsing not fully implemented');
    
    return [];
  }

  /**
   * Map feed row to IOC
   */
  private mapFeedRowToIOC(feed: any, row: any): any {
    try {
      const mapping = feed.fieldMapping || {};
      
      // Check for required fields
      if (!mapping.type || !mapping.value) {
        throw new Error('Type and value field mappings are required');
      }
      
      // Get IOC type
      const type = this.getValueFromMapping(row, mapping.type);
      
      if (!type) {
        return null;
      }
      
      // Normalize type
      const normalizedType = this.normalizeIOCType(type);
      
      if (!normalizedType) {
        return null;
      }
      
      // Get IOC value
      const value = this.getValueFromMapping(row, mapping.value);
      
      if (!value) {
        return null;
      }
      
      // Create IOC object
      const ioc: any = {
        type: normalizedType,
        value: value.toLowerCase().trim(),
        feedId: feed._id,
        feedName: feed.name,
        description: this.getValueFromMapping(row, mapping.description) || '',
        tlp: this.getValueFromMapping(row, mapping.tlp) || feed.defaultTlp || 'amber',
        confidence: parseInt(this.getValueFromMapping(row, mapping.confidence) || feed.defaultConfidence || '50', 10),
        tags: feed.defaultTags || [],
        active: true
      };
      
      // Add dates if available
      if (mapping.firstSeen) {
        const firstSeen = this.getValueFromMapping(row, mapping.firstSeen);
        if (firstSeen) {
          ioc.firstSeen = new Date(firstSeen);
        }
      }
      
      if (mapping.lastSeen) {
        const lastSeen = this.getValueFromMapping(row, mapping.lastSeen);
        if (lastSeen) {
          ioc.lastSeen = new Date(lastSeen);
        }
      }
      
      // Add tags if available
      if (mapping.tags) {
        const tags = this.getValueFromMapping(row, mapping.tags);
        if (tags) {
          if (Array.isArray(tags)) {
            ioc.tags = [...ioc.tags, ...tags];
          } else if (typeof tags === 'string') {
            ioc.tags = [...ioc.tags, ...tags.split(',').map(tag => tag.trim())];
          }
        }
      }
      
      return ioc;
    } catch (error) {
      this.logger.warn(`Error mapping feed row to IOC: ${error.message}`);
      return null;
    }
  }

  /**
   * Get value from field mapping
   */
  private getValueFromMapping(row: any, mapping: string): any {
    if (!mapping) {
      return null;
    }
    
    if (mapping.includes('.')) {
      // Navigate nested properties
      const parts = mapping.split('.');
      let value = row;
      
      for (const part of parts) {
        if (!value || typeof value !== 'object') {
          return null;
        }
        
        value = value[part];
      }
      
      return value;
    }
    
    return row[mapping];
  }

  /**
   * Normalize IOC type
   */
  private normalizeIOCType(type: string): string | null {
    const lowerType = type.toLowerCase().trim();
    
    // Map common type variations
    const typeMap = {
      'ip': 'ip',
      'ipv4': 'ip',
      'ipv6': 'ip',
      'ip-dst': 'ip',
      'ip-src': 'ip',
      'domain': 'domain',
      'hostname': 'domain',
      'domain-name': 'domain',
      'url': 'url',
      'uri': 'url',
      'hash': 'hash',
      'md5': 'hash',
      'sha1': 'hash',
      'sha256': 'hash',
      'file-hash': 'hash',
      'email': 'email',
      'email-addr': 'email'
    };
    
    return typeMap[lowerType] || null;
  }

  /**
   * Update IOCs for feed
   */
  private async updateIOCs(feed: any, iocs: any[]): Promise<any> {
    try {
      const stats = {
        added: 0,
        updated: 0,
        removed: 0
      };
      
      // Get existing IOCs for feed
      const existingIOCs = await this.iocModel.find({ feedId: feed._id }).exec();
      
      // Create map of existing IOCs by value
      const existingIOCMap = new Map();
      for (const ioc of existingIOCs) {
        existingIOCMap.set(`${ioc.type}:${ioc.value}`, ioc);
      }
      
      // Process each IOC
      for (const ioc of iocs) {
        const key = `${ioc.type}:${ioc.value}`;
        
        if (existingIOCMap.has(key)) {
          // Update existing IOC
          const existingIOC = existingIOCMap.get(key);
          
          await this.iocModel.updateOne(
            { _id: existingIOC._id },
            {
              ...ioc,
              updatedAt: new Date(),
              // Preserve firstSeen if not in new data
              firstSeen: ioc.firstSeen || existingIOC.firstSeen
            }
          );
          
          stats.updated++;
          
          // Remove from map to track which ones to delete
          existingIOCMap.delete(key);
        } else {
          // Create new IOC
          await this.iocModel.create({
            ...ioc,
            createdAt: new Date(),
            firstSeen: ioc.firstSeen || new Date()
          });
          
          stats.added++;
        }
      }
      
      // Handle remaining IOCs (removed from feed)
      if (this.configService.get('detection.iocScanner.deleteIOCsWithFeed')) {
        // Delete IOCs that were removed from feed
        const iocsToDelete = Array.from(existingIOCMap.values());
        
        if (iocsToDelete.length > 0) {
          const ids = iocsToDelete.map(ioc => ioc._id);
          
          await this.iocModel.deleteMany({ _id: { $in: ids } }).exec();
          
          stats.removed = iocsToDelete.length;
        }
      } else {
        // Mark IOCs as inactive
        const iocsToDeactivate = Array.from(existingIOCMap.values());
        
        if (iocsToDeactivate.length > 0) {
          const ids = iocsToDeactivate.map(ioc => ioc._id);
          
          await this.iocModel.updateMany(
            { _id: { $in: ids } },
            { active: false, updatedAt: new Date() }
          ).exec();
          
          stats.removed = iocsToDeactivate.length;
        }
      }
      
      return stats;
    } catch (error) {
      this.logger.error(`Error updating IOCs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle DNS event for IOC scanning
   */
  @OnEvent('dns')
  async handleDNSEvent(event: any) {
    if (!this.isInitialized || !this.configService.get('detection.iocScanner.scanDns')) {
      return;
    }
    
    try {
      // Check domain against IOCs
      if (event.query) {
        await this.checkIOCMatch('domain', event.query, 'dns', event._id, 'query', event);
      }
    } catch (error) {
      this.logger.error(`Error handling DNS event for IOC scanning: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle HTTP event for IOC scanning
   */
  @OnEvent('http')
  async handleHTTPEvent(event: any) {
    if (!this.isInitialized || !this.configService.get('detection.iocScanner.scanHttp')) {
      return;
    }
    
    try {
      // Check URL against IOCs
      if (event.url) {
        await this.checkIOCMatch('url', event.url, 'http', event._id, 'url', event);
      }
      
      // Check domain in URL
      if (event.url) {
        try {
          const url = new URL(event.url);
          await this.checkIOCMatch('domain', url.hostname, 'http', event._id, 'hostname', event);
        } catch (err) {
          // Invalid URL, skip domain check
        }
      }
    } catch (error) {
      this.logger.error(`Error handling HTTP event for IOC scanning: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle flow event for IOC scanning
   */
  @OnEvent('flow.created')
  async handleFlowEvent(event: any) {
    if (!this.isInitialized || !this.configService.get('detection.iocScanner.scanFlows')) {
      return;
    }
    
    try {
      // Check source IP against IOCs
      if (event.sourceIp) {
        await this.checkIOCMatch('ip', event.sourceIp, 'flow', event._id, 'sourceIp', event);
      }
      
      // Check destination IP against IOCs
      if (event.destinationIp) {
        await this.checkIOCMatch('ip', event.destinationIp, 'flow', event._id, 'destinationIp', event);
      }
    } catch (error) {
      this.logger.error(`Error handling flow event for IOC scanning: ${error.message}`, error.stack);
    }
  }

  /**
   * Check IOC match
   */
  private async checkIOCMatch(iocType: string, value: string, eventType: string, eventId: string, matchField: string, eventData: any) {
    try {
      // Normalize value
      const normalizedValue = value.toLowerCase().trim();
      
      // Find matching IOC
      const ioc = await this.iocModel.findOne({
        type: iocType,
        value: normalizedValue,
        active: true
      }).exec();
      
      if (!ioc) {
        return;
      }
      
      this.logger.log(`IOC match found: ${iocType}:${normalizedValue} in ${eventType} event`);
      
      // Create match record
      const match = await this.matchModel.create({
        iocId: ioc._id,
        iocType,
        iocValue: normalizedValue,
        eventType,
        eventId,
        matchField,
        matchValue: normalizedValue,
        eventData: this.sanitizeEventData(eventData),
        timestamp: new Date()
      });
      
      // Emit event
      this.eventEmitter.emit('ioc.match', {
        matchId: match._id,
        iocId: ioc._id,
        iocType,
        iocValue: normalizedValue,
        eventType,
        eventId
      });
      
      // Create alert if enabled
      if (this.configService.get('detection.iocScanner.createAlerts')) {
        await this.createAlertForMatch(match, ioc);
      }
    } catch (error) {
      this.logger.error(`Error checking IOC match: ${error.message}`, error.stack);
    }
  }

  /**
   * Sanitize event data for storage
   */
  private sanitizeEventData(eventData: any): any {
    try {
      // Convert to string and back to remove circular references
      return JSON.parse(JSON.stringify(eventData));
    } catch (error) {
      // If serialization fails, return simplified object
      return {
        _id: eventData._id,
        type: eventData.type,
        timestamp: eventData.timestamp
      };
    }
  }

  /**
   * Create alert for IOC match
   */
  private async createAlertForMatch(match: any, ioc: any) {
    try {
      // Create alert
      await this.alertService.createAlert({
        title: `IOC Match: ${ioc.type.toUpperCase()} - ${ioc.value}`,
        description: ioc.description || `Matched ${ioc.type} indicator of compromise from feed: ${ioc.feedName}`,
        severity: this.mapTLPToSeverity(ioc.tlp),
        source: 'ioc_scanner',
        sourceRef: match._id.toString(),
        status: 'new',
        ipAddress: match.eventData.sourceIp || match.eventData.destinationIp,
        timestamp: match.timestamp,
        metadata: {
          iocId: ioc._id.toString(),
          iocType: ioc.type,
          iocValue: ioc.value,
          feedId: ioc.feedId,
          feedName: ioc.feedName,
          confidence: ioc.confidence,
          tlp: ioc.tlp,
          tags: ioc.tags,
          eventType: match.eventType,
          matchField: match.matchField
        }
      });
    } catch (error) {
      this.logger.error(`Error creating alert for IOC match: ${error.message}`, error.stack);
    }
  }

  /**
   * Map TLP to severity
   */
  private mapTLPToSeverity(tlp: string): string {
    switch (tlp.toLowerCase()) {
      case 'red':
        return 'critical';
      case 'amber':
        return 'high';
      case 'green':
        return 'medium';
      case 'white':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Get IOCs with filters
   */
  async getIOCs(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      return this.iocModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting IOCs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IOC by ID
   */
  async getIOCById(iocId: string) {
    try {
      return this.iocModel.findById(iocId).exec();
    } catch (error) {
      this.logger.error(`Error getting IOC by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new IOC
   */
  async createIOC(iocData: any) {
    try {
      // Validate required fields
      if (!iocData.type) {
        throw new Error('IOC type is required');
      }
      
      if (!iocData.value) {
        throw new Error('IOC value is required');
      }
      
      // Normalize type
      const normalizedType = this.normalizeIOCType(iocData.type);
      
      if (!normalizedType) {
        throw new Error(`Invalid IOC type: ${iocData.type}`);
      }
      
      // Create IOC
      return this.iocModel.create({
        ...iocData,
        type: normalizedType,
        value: iocData.value.toLowerCase().trim(),
        createdAt: new Date(),
        firstSeen: iocData.firstSeen || new Date()
      });
    } catch (error) {
      this.logger.error(`Error creating IOC: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update IOC
   */
  async updateIOC(iocId: string, iocData: any) {
    try {
      // Update IOC
      const ioc = await this.iocModel.findByIdAndUpdate(
        iocId,
        {
          ...iocData,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!ioc) {
        throw new Error(`IOC not found: ${iocId}`);
      }
      
      return ioc;
    } catch (error) {
      this.logger.error(`Error updating IOC: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete IOC
   */
  async deleteIOC(iocId: string) {
    try {
      const ioc = await this.iocModel.findByIdAndDelete(iocId).exec();
      
      if (!ioc) {
        throw new Error(`IOC not found: ${iocId}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting IOC: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get feeds with filters
   */
  async getFeeds(filters: any = {}) {
    try {
      return this.feedModel.find(filters).exec();
    } catch (error) {
      this.logger.error(`Error getting feeds: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get feed by ID
   */
  async getFeedById(feedId: string) {
    try {
      return this.feedModel.findById(feedId).exec();
    } catch (error) {
      this.logger.error(`Error getting feed by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new feed
   */
  async createFeed(feedData: any) {
    try {
      // Validate required fields
      if (!feedData.name) {
        throw new Error('Feed name is required');
      }
      
      if (!feedData.url) {
        throw new Error('Feed URL is required');
      }
      
      if (!feedData.format) {
        throw new Error('Feed format is required');
      }
      
      // Create feed
      return this.feedModel.create({
        ...feedData,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error(`Error creating feed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update feed
   */
  async updateFeed(feedId: string, feedData: any) {
    try {
      // Update feed
      const feed = await this.feedModel.findByIdAndUpdate(
        feedId,
        {
          ...feedData,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!feed) {
        throw new Error(`Feed not found: ${feedId}`);
      }
      
      return feed;
    } catch (error) {
      this.logger.error(`Error updating feed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete feed
   */
  async deleteFeed(feedId: string) {
    try {
      const feed = await this.feedModel.findByIdAndDelete(feedId).exec();
      
      if (!feed) {
        throw new Error(`Feed not found: ${feedId}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting feed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get matches with filters
   */
  async getMatches(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options;
      
      return this.matchModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting matches: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get match by ID
   */
  async getMatchById(matchId: string) {
    try {
      return this.matchModel.findById(matchId).exec();
    } catch (error) {
      this.logger.error(`Error getting match by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IOC statistics
   */
  async getStatistics() {
    try {
      // Count total IOCs
      const totalIOCs = await this.iocModel.countDocuments().exec();
      
      // Count active IOCs
      const activeIOCs = await this.iocModel.countDocuments({ active: true }).exec();
      
      // Count by type
      const iocsByType = await this.iocModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by feed
      const iocsByFeed = await this.iocModel.aggregate([
        { $group: { _id: '$feedId', name: { $first: '$feedName' }, count: { $sum: 1 } } }
      ]).exec();
      
      // Count total matches
      const totalMatches = await this.matchModel.countDocuments().exec();
      
      // Count by IOC type
      const matchesByType = await this.matchModel.aggregate([
        { $group: { _id: '$iocType', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by event type
      const matchesByEventType = await this.matchModel.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]).exec();
      
      // Get recent matches
      const recentMatches = await this.matchModel
        .find()
        .sort({ timestamp: -1 })
        .limit(10)
        .exec();
      
      return {
        totalIOCs,
        activeIOCs,
        iocsByType: iocsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        iocsByFeed: iocsByFeed.map(item => ({
          feedId: item._id,
          name: item.name,
          count: item.count
        })),
        totalMatches,
        matchesByType: matchesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        matchesByEventType: matchesByEventType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentMatches
      };
    } catch (error) {
      this.logger.error(`Error getting IOC statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Schedule feed updates
   */
  @Cron('0 */6 * * *') // Every 6 hours
  async scheduledFeedUpdate() {
    if (!this.isInitialized) {
      return;
    }
    
    try {
      this.logger.log('Running scheduled IOC feed update');
      await this.updateFeeds();
    } catch (error) {
      this.logger.error(`Error in scheduled feed update: ${error.message}`, error.stack);
    }
  }
}