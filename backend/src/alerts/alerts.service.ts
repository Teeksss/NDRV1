import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { EventsService } from '../events/events.service';
import { EntitiesService } from '../entities/entities.service';
import { LoggerService } from '../logger/logger.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    private eventsService: EventsService,
    private entitiesService: EntitiesService,
    private logger: LoggerService,
    private websocketGateway: WebsocketGateway,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    try {
      const newAlert = new this.alertModel(createAlertDto);
      
      // Add initial status history
      if (!newAlert.statusHistory) {
        newAlert.statusHistory = [];
      }
      
      newAlert.statusHistory.push({
        status: newAlert.status || 'open',
        timestamp: new Date(),
        user: createAlertDto.createdBy || 'system',
      });
      
      const alert = await newAlert.save();
      
      // Emit event for other parts of the application
      this.eventEmitter.emit('alert.created', alert);
      
      // Notify connected clients about new alert
      this.websocketGateway.broadcastAlert(alert);
      
      // Log alert creation
      this.logger.log(`Alert created: ${alert.id}`, 'AlertsService');
      
      // Update entity with alert reference if entity ID provided
      if (alert.entityId) {
        await this.entitiesService.addAlertToEntity(alert.entityId, alert.id);
      }
      
      return alert;
    } catch (error) {
      this.logger.error(`Error creating alert: ${error.message}`, error.stack, 'AlertsService');
      throw new BadRequestException(`Failed to create alert: ${error.message}`);
    }
  }

  async findAll(query: any = {}): Promise<Alert[]> {
    const {
      severity,
      status,
      source,
      entityId,
      type,
      startDate,
      endDate,
      search,
      sort = 'timestamp',
      order = 'desc',
      limit = 100,
      page = 1,
    } = query;

    const filter: any = {};

    if (severity) {
      filter.severity = Array.isArray(severity) ? { $in: severity } : severity;
    }

    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (source) {
      filter.source = source;
    }

    if (entityId) {
      filter.entityId = entityId;
    }

    if (type) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

    return this.alertModel
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertModel.findById(id).exec();
    
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    
    return alert;
  }

  async update(id: string, updateAlertDto: UpdateAlertDto, userId: string): Promise<Alert> {
    const alert = await this.findOne(id);
    
    // Update alert fields
    Object.assign(alert, updateAlertDto);
    
    // Update updatedBy field
    if (userId) {
      alert.updatedBy = userId;
    }
    
    const updatedAlert = await alert.save();
    
    // Emit event for other parts of the application
    this.eventEmitter.emit('alert.updated', updatedAlert);
    
    return updatedAlert;
  }

  async updateStatus(id: string, status: string, notes: string = null, userId: string): Promise<Alert> {
    const alert = await this.findOne(id);
    
    // Update status
    alert.status = status;
    
    // Add to status history
    if (!alert.statusHistory) {
      alert.statusHistory = [];
    }
    
    alert.statusHistory.push({
      status,
      notes,
      timestamp: new Date(),
      user: userId || 'system',
    });
    
    // Update updatedBy field
    if (userId) {
      alert.updatedBy = userId;
    }
    
    const updatedAlert = await alert.save();
    
    // Emit event for other parts of the application
    this.eventEmitter.emit('alert.statusChanged', {
      alert: updatedAlert,
      previousStatus: alert.status,
      newStatus: status,
      userId,
    });
    
    // Notify connected clients about status change
    this.websocketGateway.broadcastToChannel('alerts', 'alert_status_changed', {
      id: updatedAlert.id,
      status: updatedAlert.status,
      timestamp: new Date(),
    });
    
    return updatedAlert;
  }

  async addComment(id: string, text: string, userId: string): Promise<Alert> {
    const alert = await this.findOne(id);
    
    // Add comment
    if (!alert.comments) {
      alert.comments = [];
    }
    
    alert.comments.push({
      text,
      timestamp: new Date(),
      user: userId,
    });
    
    // Update updatedBy field
    alert.updatedBy = userId;
    
    return alert.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.alertModel.deleteOne({ _id: id }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    
    // Emit event for other parts of the application
    this.eventEmitter.emit('alert.deleted', { id });
  }

  // Additional methods for dashboard statistics and aggregation

  async getAlertStatistics(startDate?: string, endDate?: string): Promise<any> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const filter = {
      timestamp: { $gte: start, $lte: end }
    };
    
    const [
      totalCount,
      bySeverity,
      byStatus,
      bySource,
      byHour
    ] = await Promise.all([
      this.alertModel.countDocuments(filter),
      this.getAlertsBySeverity(startDate, endDate),
      this.getAlertsByStatus(startDate, endDate),
      this.getAlertsBySource(startDate, endDate),
      this.getAlertsByHour(startDate, endDate)
    ]);
    
    return {
      total: totalCount,
      bySeverity,
      byStatus,
      bySource,
      byHour,
      timeRange: {
        start,
        end
      }
    };
  }

  async getAlertsBySeverity(startDate?: string, endDate?: string): Promise<any> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const result = await this.alertModel.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]).exec();
    
    // Format to object with severities as keys
    const formatted = result.reduce((acc, item) => {
      acc[item._id || 'unknown'] = item.count;
      return acc;
    }, {});
    
    // Ensure all severities are present
    return {
      critical: formatted.critical || 0,
      high: formatted.high || 0,
      medium: formatted.medium || 0,
      low: formatted.low || 0,
      info: formatted.info || 0
    };
  }

  async getAlertsByStatus(startDate?: string, endDate?: string): Promise<any> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const result = await this.alertModel.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).exec();
    
    // Format to object with statuses as keys
    const formatted = result.reduce((acc, item) => {
      acc[item._id || 'unknown'] = item.count;
      return acc;
    }, {});
    
    // Ensure all statuses are present
    return {
      open: formatted.open || 0,
      in_progress: formatted.in_progress || 0,
      resolved: formatted.resolved || 0,
      closed: formatted.closed || 0,
      false_positive: formatted.false_positive || 0
    };
  }

  // More methods for alert processing, correlation, and analysis
}