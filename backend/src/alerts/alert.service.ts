import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

import { Alert } from './entities/alert.entity';
import { AlertTemplate } from './entities/alert-template.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AlertService implements OnModuleInit {
  private readonly logger = new Logger(AlertService.name);
  private deduplicationEnabled = true;
  private deduplicationWindow = 300; // 5 minutes in seconds
  private deduplicationFields = ['source', 'sourceRef', 'title'];
  private severityCounts = {
    critical: 100,
    high: 70,
    medium: 40,
    low: 10,
    info: 0
  };

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private notificationService: NotificationService,
    @InjectModel(Alert.name) private alertModel: Model<Alert>,
    @InjectModel(AlertTemplate.name) private templateModel: Model<AlertTemplate>
  ) {}

  async onModuleInit() {
    // Load configuration
    this.deduplicationEnabled = this.configService.get('alerts.deduplication.enabled') !== false;
    
    const configWindow = this.configService.get('alerts.deduplication.window');
    if (configWindow) {
      this.deduplicationWindow = configWindow;
    }
    
    const configFields = this.configService.get('alerts.deduplication.fields');
    if (configFields && Array.isArray(configFields)) {
      this.deduplicationFields = configFields;
    }
    
    const severityCounts = this.configService.get('alerts.defaultSeverityCounts');
    if (severityCounts) {
      this.severityCounts = { ...this.severityCounts, ...severityCounts };
    }
    
    this.logger.log(`Alert service initialized (deduplication: ${this.deduplicationEnabled ? 'enabled' : 'disabled'})`);
  }

  /**
   * Create a new alert
   */
  async createAlert(alertData: any) {
    try {
      // Check deduplication
      if (this.deduplicationEnabled) {
        const duplicateAlert = await this.checkForDuplicateAlert(alertData);
        
        if (duplicateAlert) {
          this.logger.log(`Duplicate alert detected: ${duplicateAlert._id}`);
          
          // Update timestamp and increment count in existing alert
          const comments = duplicateAlert.comments || [];
          comments.push({
            user: 'system',
            text: `Duplicate alert suppressed: ${alertData.title}`,
            timestamp: new Date()
          });
          
          await this.alertModel.updateOne(
            { _id: duplicateAlert._id },
            { 
              updatedAt: new Date(),
              comments
            }
          );
          
          return duplicateAlert;
        }
      }
      
      // Calculate score if not provided
      if (!alertData.score) {
        alertData.score = this.calculateAlertScore(alertData);
      }
      
      // Create alert
      const alert = await this.alertModel.create({
        ...alertData,
        createdAt: new Date()
      });
      
      // Emit event
      this.eventEmitter.emit('alert.created', alert);
      
      // Send notifications
      this.sendAlertNotifications(alert)
        .catch(err => this.logger.error(`Error sending alert notifications: ${err.message}`));
      
      return alert;
    } catch (error) {
      this.logger.error(`Error creating alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check for duplicate alert
   */
  private async checkForDuplicateAlert(alertData: any): Promise<any> {
    try {
      // Skip deduplication if source is not provided
      if (!alertData.source) {
        return null;
      }
      
      // Build query
      const query: any = {
        status: { $nin: ['resolved', 'closed', 'false_positive'] }
      };
      
      // Add deduplication fields
      for (const field of this.deduplicationFields) {
        if (alertData[field]) {
          query[field] = alertData[field];
        }
      }
      
      // Add time window
      const windowStart = new Date(Date.now() - this.deduplicationWindow * 1000);
      query.timestamp = { $gte: windowStart };
      
      // Find duplicate
      return this.alertModel.findOne(query).exec();
    } catch (error) {
      this.logger.error(`Error checking for duplicate alert: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Calculate alert score
   */
  private calculateAlertScore(alertData: any): number {
    try {
      // Base score from severity
      let score = this.severityCounts[alertData.severity] || 50;
      
      // Modify score based on other factors
      if (alertData.source === 'ioc_scanner') {
        score += 10;
      }
      
      if (alertData.source === 'correlation') {
        score += 20;
      }
      
      if (alertData.metadata?.confidence) {
        score = score * (alertData.metadata.confidence / 100);
      }
      
      return Math.min(100, Math.max(0, Math.round(score)));
    } catch (error) {
      this.logger.error(`Error calculating alert score: ${error.message}`, error.stack);
      return 50; // Default score
    }
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: any) {
    try {
      // Find matching template
      const template = await this.findMatchingTemplate(alert);
      
      if (!template) {
        return;
      }
      
      // Send notifications
      await this.notificationService.sendAlertNotification(alert, template);
    } catch (error) {
      this.logger.error(`Error sending alert notifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Find matching alert template
   */
  private async findMatchingTemplate(alert: any) {
    try {
      // Try to find specific template for this alert
      const query: any = {
        enabled: true
      };
      
      // Match by source
      if (alert.source) {
        query.source = alert.source;
      }
      
      // Match by severity
      if (alert.severity) {
        query.alertSeverities = alert.severity;
      }
      
      // Find best matching template
      const templates = await this.templateModel.find(query).exec();
      
      if (templates.length === 0) {
        // Try to find default template
        return this.templateModel.findOne({ 
          enabled: true,
          isDefault: true
        }).exec();
      }
      
      // Return first matching template
      return templates[0];
    } catch (error) {
      this.logger.error(`Error finding matching template: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get alerts with filters
   */
  async getAlerts(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options;
      
      return this.alertModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting alerts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string) {
    try {
      return this.alertModel.findById(alertId).exec();
    } catch (error) {
      this.logger.error(`Error getting alert by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(alertId: string, status: string, notes?: string, assignedTo?: string) {
    try {
      // Validate status
      const validStatuses = ['new', 'in_progress', 'resolved', 'false_positive', 'closed'];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Get updates
      const updates: any = {
        status,
        updatedAt: new Date()
      };
      
      // Add assignee if provided
      if (assignedTo) {
        updates.assignedTo = assignedTo;
      }
      
      // Add resolution notes if status is resolved or false_positive
      if (['resolved', 'false_positive'].includes(status)) {
        updates.resolvedAt = new Date();
        updates.resolvedBy = assignedTo;
        
        if (notes) {
          updates.resolutionNotes = notes;
        }
      }
      
      // Add closed timestamp if status is closed
      if (status === 'closed') {
        updates.closedAt = new Date();
      }
      
      // Update alert
      const alert = await this.alertModel.findByIdAndUpdate(
        alertId,
        updates,
        { new: true }
      ).exec();
      
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }
      
      // Add comment if notes provided
      if (notes && !['resolved', 'false_positive'].includes(status)) {
        await this.addComment(alertId, notes, assignedTo || 'system');
      }
      
      // Emit event
      this.eventEmitter.emit('alert.status_updated', {
        alertId,
        status,
        previousStatus: alert.status,
        updatedBy: assignedTo
      });
      
      return alert;
    } catch (error) {
      this.logger.error(`Error updating alert status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update alert severity
   */
  async updateAlertSeverity(alertId: string, severity: string, notes?: string) {
    try {
      // Validate severity
      const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
      
      if (!validSeverities.includes(severity)) {
        throw new Error(`Invalid severity: ${severity}. Must be one of: ${validSeverities.join(', ')}`);
      }
      
      // Update alert
      const alert = await this.alertModel.findByIdAndUpdate(
        alertId,
        {
          severity,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }
      
      // Add comment if notes provided
      if (notes) {
        await this.addComment(alertId, `Severity changed to ${severity}: ${notes}`, 'system');
      }
      
      // Emit event
      this.eventEmitter.emit('alert.severity_updated', {
        alertId,
        severity,
        previousSeverity: alert.severity
      });
      
      return alert;
    } catch (error) {
      this.logger.error(`Error updating alert severity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add comment to alert
   */
  async addComment(alertId: string, comment: string, user: string) {
    try {
      // Validate
      if (!comment) {
        throw new Error('Comment text is required');
      }
      
      // Update alert
      const alert = await this.alertModel.findByIdAndUpdate(
        alertId,
        {
          $push: {
            comments: {
              user,
              text: comment,
              timestamp: new Date()
            }
          },
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }
      
      // Emit event
      this.eventEmitter.emit('alert.comment_added', {
        alertId,
        user,
        comment
      });
      
      return alert;
    } catch (error) {
      this.logger.error(`Error adding comment to alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get alert templates
   */
  async getAlertTemplates(filters: any = {}) {
    try {
      return this.templateModel.find(filters).exec();
    } catch (error) {
      this.logger.error(`Error getting alert templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create alert template
   */
  async createAlertTemplate(templateData: any) {
    try {
      // Validate required fields
      if (!templateData.name) {
        throw new Error('Template name is required');
      }
      
      // Create template
      return this.templateModel.create({
        ...templateData,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error(`Error creating alert template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update alert template
   */
  async updateAlertTemplate(templateId: string, templateData: any) {
    try {
      // Update template
      const template = await this.templateModel.findByIdAndUpdate(
        templateId,
        {
          ...templateData,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }
      
      return template;
    } catch (error) {
      this.logger.error(`Error updating alert template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete alert template
   */
  async deleteAlertTemplate(templateId: string) {
    try {
      const template = await this.templateModel.findByIdAndDelete(templateId).exec();
      
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting alert template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(days: number = 7) {
    try {
      // Calculate start date
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      
      // Count total alerts
      const totalAlerts = await this.alertModel.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate }
      }).exec();
      
      // Count by severity
      const bySeverity = await this.alertModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by status
      const byStatus = await this.alertModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by source
      const bySource = await this.alertModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).exec();
      
      // Count by day
      const dailyData = await this.alertModel.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
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
      
      // Get recent alerts
      const recentAlerts = await this.alertModel
        .find({ timestamp: { $gte: startDate, $lte: endDate } })
        .sort({ timestamp: -1 })
        .limit(10)
        .exec();
      
      return {
        totalAlerts,
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        bySource: bySource.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        dailyData: formattedDailyData,
        recentAlerts,
        timeRange: {
          start: startDate,
          end: endDate,
          days
        }
      };
    } catch (error) {
      this.logger.error(`Error getting alert statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up old alerts
   */
  @Cron('0 1 * * *') // 1 AM every day
  async cleanupOldAlerts() {
    try {
      const retentionDays = this.configService.get('alerts.retention.days') || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const result = await this.alertModel.deleteMany({
        timestamp: { $lt: cutoffDate },
        status: { $in: ['resolved', 'false_positive', 'closed'] }
      }).exec();
      
      this.logger.log(`Cleaned up ${result.deletedCount} old alerts`);
    } catch (error) {
      this.logger.error(`Error cleaning up old alerts: ${error.message}`, error.stack);
    }
  }
}