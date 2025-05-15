import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { LoggerService } from '../logger/logger.service';
import { EntitiesService } from '../entities/entities.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private logger: LoggerService,
    private entitiesService: EntitiesService,
    private websocketGateway: WebsocketGateway,
    private eventEmitter: EventEmitter2
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    try {
      // Create event
      const event = new this.eventModel(createEventDto);
      const savedEvent = await event.save();
      
      this.logger.log(`Event created: ${savedEvent.id} - Type: ${savedEvent.type}`, 'EventsService');
      
      // Link to entity if an entity ID is provided
      if (createEventDto.entityId) {
        try {
          await this.entitiesService.addEventToEntity(createEventDto.entityId, savedEvent.id);
        } catch (error) {
          this.logger.warn(`Failed to link event ${savedEvent.id} to entity ${createEventDto.entityId}: ${error.message}`, 'EventsService');
        }
      }
      
      // If source IP is provided, try to find or create the entity
      if (createEventDto.sourceIp && !createEventDto.entityId) {
        try {
          const sourceEntity = await this.entitiesService.findOrCreateByIp(createEventDto.sourceIp, {
            name: `Host ${createEventDto.sourceIp}`,
            type: 'unknown'
          });
          
          await this.entitiesService.addEventToEntity(sourceEntity.id, savedEvent.id);
          
          // Update event with entity ID
          savedEvent.entityId = sourceEntity.id;
          await savedEvent.save();
        } catch (error) {
          this.logger.warn(`Failed to link event ${savedEvent.id} to source IP entity: ${error.message}`, 'EventsService');
        }
      }
      
      // Emit event created event for correlation engine
      this.eventEmitter.emit('event.created', savedEvent);
      
      // Broadcast to websocket clients if it's a significant event
      if (this.isSignificantEvent(savedEvent)) {
        this.websocketGateway.broadcastEvent(savedEvent);
      }
      
      return savedEvent;
    } catch (error) {
      this.logger.error(`Error creating event: ${error.message}`, error.stack, 'EventsService');
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to create event: ${error.message}`);
    }
  }

  async findAll(query: any = {}): Promise<{
    data: Event[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        type,
        severity,
        source,
        entityId,
        sourceIp,
        destinationIp,
        startDate,
        endDate,
        search,
        sort = 'timestamp',
        order = 'desc',
        page = 1,
        limit = 50,
      } = query;
      
      // Build filter
      const filter: any = {};
      
      if (type) {
        filter.type = Array.isArray(type) ? { $in: type } : type;
      }
      
      if (severity) {
        filter.severity = Array.isArray(severity) ? { $in: severity } : severity;
      }
      
      if (source) {
        filter.source = Array.isArray(source) ? { $in: source } : source;
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      if (sourceIp) {
        filter.sourceIp = sourceIp;
      }
      
      if (destinationIp) {
        filter.destinationIp = destinationIp;
      }
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.timestamp.$lte = new Date(endDate);
        }
      }
      
      // Text search
      if (search) {
        filter.$or = [
          { description: { $regex: search, $options: 'i' } },
          { sourceIp: { $regex: search, $options: 'i' } },
          { destinationIp: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Execute query with pagination
      const skip = (Number(page) - 1) * Number(limit);
      const sortOption = { [sort]: order === 'asc' ? 1 : -1 };
      
      const [data, total] = await Promise.all([
        this.eventModel
          .find(filter)
          .sort(sortOption)
          .skip(skip)
          .limit(Number(limit))
          .exec(),
        this.eventModel.countDocuments(filter).exec(),
      ]);
      
      return {
        data,
        total,
        page: Number(page),
        limit: Number(limit),
      };
    } catch (error) {
      this.logger.error(`Error finding events: ${error.message}`, error.stack, 'EventsService');
      throw error;
    }
  }

  async findOne(id: string): Promise<Event> {
    try {
      const event = await this.eventModel.findById(id).exec();
      
      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }
      
      return event;
    } catch (error) {
      this.logger.error(`Error finding event ${id}: ${error.message}`, error.stack, 'EventsService');
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }

  async findByEntityId(entityId: string, query: any = {}): Promise<Event[]> {
    try {
      const { startDate, endDate, limit = 100 } = query;
      
      // Build filter
      const filter: any = { entityId };
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.timestamp.$lte = new Date(endDate);
        }
      }
      
      return this.eventModel
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .exec();
    } catch (error) {
      this.logger.error(`Error finding events for entity ${entityId}: ${error.message}`, error.stack, 'EventsService');
      throw error;
    }
  }

  async findByIp(ip: string, query: any = {}): Promise<Event[]> {
    try {
      const { startDate, endDate, limit = 100 } = query;
      
      // Build filter
      const filter: any = {
        $or: [
          { sourceIp: ip },
          { destinationIp: ip }
        ]
      };
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.timestamp.$lte = new Date(endDate);
        }
      }
      
      return this.eventModel
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .exec();
    } catch (error) {
      this.logger.error(`Error finding events for IP ${ip}: ${error.message}`, error.stack, 'EventsService');
      throw error;
    }
  }

  async getEventStatistics(query: any = {}): Promise<any> {
    try {
      const { startDate, endDate } = query;
      
      // Build filter
      const filter: any = {};
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.timestamp.$lte = new Date(endDate);
        }
      }
      
      const [
        total,
        byType,
        bySeverity,
        bySource,
        topSourceIps,
        topDestinationIps
      ] = await Promise.all([
        // Total count
        this.eventModel.countDocuments(filter).exec(),
        
        // Count by type
        this.eventModel.aggregate([
          { $match: filter },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).exec(),
        
        // Count by severity
        this.eventModel.aggregate([
          { $match: filter },
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).exec(),
        
        // Count by source
        this.eventModel.aggregate([
          { $match: filter },
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).exec(),
        
        // Top source IPs
        this.eventModel.aggregate([
          { $match: { ...filter, sourceIp: { $exists: true, $ne: null } } },
          { $group: { _id: '$sourceIp', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).exec(),
        
        // Top destination IPs
        this.eventModel.aggregate([
          { $match: { ...filter, destinationIp: { $exists: true, $ne: null } } },
          { $group: { _id: '$destinationIp', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).exec()
      ]);
      
      return {
        total,
        byType: byType.map(item => ({ type: item._id || 'unknown', count: item.count })),
        bySeverity: bySeverity.map(item => ({ severity: item._id || 'unknown', count: item.count })),
        bySource: bySource.map(item => ({ source: item._id || 'unknown', count: item.count })),
        topSourceIps: topSourceIps.map(item => ({ ip: item._id, count: item.count })),
        topDestinationIps: topDestinationIps.map(item => ({ ip: item._id, count: item.count }))
      };
    } catch (error) {
      this.logger.error(`Error getting event statistics: ${error.message}`, error.stack, 'EventsService');
      throw error;
    }
  }

  async getEventTrend(startDate?: string, endDate?: string, interval: string = 'hour'): Promise<any> {
    try {
      // Determine date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
      const end = endDate ? new Date(endDate) : new Date();
      
      // Determine time interval in milliseconds
      let intervalMs: number;
      let dateFormat: string;
      switch (interval) {
        case 'minute':
          intervalMs = 60 * 1000;
          dateFormat = '%Y-%m-%d %H:%M';
          break;
        case 'hour':
          intervalMs = 60 * 60 * 1000;
          dateFormat = '%Y-%m-%d %H:00';
          break;
        case 'day':
          intervalMs = 24 * 60 * 60 * 1000;
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          intervalMs = 7 * 24 * 60 * 60 * 1000;
          dateFormat = '%Y-W%V';
          break;
        case 'month':
          intervalMs = 30 * 24 * 60 * 60 * 1000;
          dateFormat = '%Y-%m';
          break;
        default:
          intervalMs = 60 * 60 * 1000; // Default to hourly
          dateFormat = '%Y-%m-%d %H:00';
      }
      
      // Generate time series using MongoDB aggregation
      const result = await this.eventModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: dateFormat, date: '$timestamp' } },
              type: '$type'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        },
        {
          $group: {
            _id: '$_id.date',
            types: {
              $push: {
                type: '$_id.type',
                count: '$count'
              }
            },
            total: { $sum: '$count' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).exec();
      
      // Build response
      return {
        start: start.toISOString(),
        end: end.toISOString(),
        interval,
        data: result.map(item => ({
          timestamp: item._id,
          total: item.total,
          types: item.types
        }))
      };
    } catch (error) {
      this.logger.error(`Error getting event trend: ${error.message}`, error.stack, 'EventsService');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.eventModel.deleteOne({ _id: id }).exec();
      
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }
      
      this.logger.log(`Event deleted: ${id}`, 'EventsService');
    } catch (error) {
      this.logger.error(`Error removing event ${id}: ${error.message}`, error.stack, 'EventsService');
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to delete event: ${error.message}`);
    }
  }

  // Helper methods
  private isSignificantEvent(event: Event): boolean {
    // Determine if event should be broadcast to websocket clients
    // For example, high severity events or specific types
    return (
      event.severity === 'critical' ||
      event.severity === 'high' ||
      event.type === 'security_breach' ||
      event.type === 'malware_detected' ||
      event.type === 'authentication_failure'
    );
  }
}