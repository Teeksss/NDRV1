import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Event } from './entities/event.entity';
import { AggregatedEvent } from './entities/aggregated-event.entity';
import { EntityService } from '../entity/entity.service';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private aggregationEnabled = true;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private entityService: EntityService,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(AggregatedEvent.name) private aggregatedEventModel: Model<AggregatedEvent>
  ) {
    // Get aggregation configuration
    this.aggregationEnabled = this.configService.get('events.aggregation.enabled') !== false;
  }

  /**
   * Get events with filters
   */
  async getEvents(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options;
      
      return this.eventModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string) {
    try {
      return this.eventModel.findById(eventId).exec();
    } catch (error) {
      this.logger.error(`Error getting event by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: any) {
    try {
      // Set default timestamp if not provided
      if (!eventData.timestamp) {
        eventData.timestamp = new Date();
      }
      
      // Update entity last seen if source IP is provided
      if (eventData.sourceIp) {
        this.entityService.updateEntityLastSeen(eventData.sourceIp)
          .catch(err => this.logger.error(`Error updating entity last seen: ${err.message}`));
      }
      
      // Create event
      const event = await this.eventModel.create(eventData);
      
      // Emit event creation event
      this.eventEmitter.emit('event.created', event);
      
      // Emit specific event type event
      if (event.type) {
        this.eventEmitter.emit(`event.${event.type}`, event);
      }
      
      // Aggregate event if enabled
      if (this.aggregationEnabled) {
        this.aggregateEvent(event)
          .catch(err => this.logger.error(`Error aggregating event: ${err.message}`));
      }
      
      return event;
    } catch (error) {
      this.logger.error(`Error creating event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Aggregate event
   */
  private async aggregateEvent(event: any) {
    try {
      // Skip aggregation for certain event types
      const skipAggregation = this.configService.get('events.aggregation.skipTypes') || [];
      if (skipAggregation.includes(event.type)) {
        return;
      }
      
      // Build aggregation key based on event type
      let aggregationKey = `type:${event.type}`;
      
      if (event.sourceIp) {
        aggregationKey += `:src:${event.sourceIp}`;
      }
      
      if (event.destinationIp) {
        aggregationKey += `:dst:${event.destinationIp}`;
      }
      
      if (event.status) {
        aggregationKey += `:status:${event.status}`;
      }
      
      // Find existing aggregated event or create new one
      const existingAggregation = await this.aggregatedEventModel.findOne({
        aggregationKey,
        // Only aggregate events in the last 15 minutes
        lastTimestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      }).exec();
      
      if (existingAggregation) {
        // Update existing aggregation
        await this.aggregatedEventModel.updateOne(
          { _id: existingAggregation._id },
          {
            $inc: { count: 1 },
            lastTimestamp: event.timestamp,
            $push: {
              sampleEvents: {
                $each: [
                  {
                    _id: event._id,
                    timestamp: event.timestamp,
                    sourceIp: event.sourceIp,
                    destinationIp: event.destinationIp,
                    status: event.status
                  }
                ],
                $slice: -5 // Keep only latest 5 sample events
              }
            }
          }
        ).exec();
      } else {
        // Create new aggregation
        await this.aggregatedEventModel.create({
          type: event.type,
          source: event.source,
          count: 1,
          firstTimestamp: event.timestamp,
          lastTimestamp: event.timestamp,
          aggregationKey,
          sourceIp: event.sourceIp,
          destinationIp: event.destinationIp,
          status: event.status,
          severity: event.severity,
          entityId: event.entityId,
          sampleEvents: [
            {
              _id: event._id,
              timestamp: event.timestamp,
              sourceIp: event.sourceIp,
              destinationIp: event.destinationIp,
              status: event.status
            }
          ]
        });
      }
      
      // Emit aggregated event
      this.eventEmitter.emit('event.aggregated', {
        type: event.type,
        aggregationKey,
        count: existingAggregation ? existingAggregation.count + 1 : 1
      });
    } catch (error) {
      this.logger.error(`Error aggregating event: ${error.message}`, error.stack);
    }
  }

  /**
   * Get aggregated events with filters
   */
  async getAggregatedEvents(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { lastTimestamp: -1 } } = options;
      
      return this.aggregatedEventModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting aggregated events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get aggregated event by ID
   */
  async getAggregatedEventById(eventId: string) {
    try {
      return this.aggregatedEventModel.findById(eventId).exec();
    } catch (error) {
      this.logger.error(`Error getting aggregated event by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(hours: number = 24) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
      
      // Count total events
      const totalEvents = await this.eventModel.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate }
      }).exec();
      
      // Count by type
      const byType = await this.eventModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).exec();
      
      // Count by source
      const bySource = await this.eventModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).exec();
      
      // Count by severity
      const bySeverity = await this.eventModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by hour
      const hourlyData = await this.eventModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
      ]).exec();
      
      // Format hourly data
      const formattedHourlyData = hourlyData.map(hour => {
        const date = new Date(
          hour._id.year, 
          hour._id.month - 1, 
          hour._id.day, 
          hour._id.hour
        );
        return {
          hour: date.toISOString(),
          count: hour.count
        };
      });
      
      return {
        totalEvents,
        byType: byType.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        bySource: bySource.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        hourlyData: formattedHourlyData,
        timeRange: {
          start: startDate,
          end: endDate,
          hours
        }
      };
    } catch (error) {
      this.logger.error(`Error getting event statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
}