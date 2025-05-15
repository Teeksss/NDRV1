import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { 
  Notification, 
  NotificationDocument 
} from './schemas/notification.schema';
import { 
  NotificationTemplate, 
  NotificationTemplateDocument 
} from './schemas/notification-template.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { EmailProvider } from './providers/email.provider';
import { WebhookProvider } from './providers/webhook.provider';
import { SlackProvider } from './providers/slack.provider';
import { PushProvider } from './providers/push.provider';
import { TemplateRenderer } from './template-renderer.service';
import { LoggerService } from '../logger/logger.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private defaultTemplates: CreateTemplateDto[] = [
    {
      name: 'alert_created',
      type: 'email',
      subject: 'New Alert: {{alert.title}}',
      content: `
        <h1>New Alert: {{alert.title}}</h1>
        <p>Severity: <strong>{{alert.severity}}</strong></p>
        <p>Status: {{alert.status}}</p>
        <p>Description: {{alert.description}}</p>
        <p>Timestamp: {{alert.timestamp | date}}</p>
        <p>View details: <a href="{{baseUrl}}/alerts/{{alert.id}}">Click here</a></p>
      `,
      enabled: true,
    },
    {
      name: 'user_login',
      type: 'email',
      subject: 'New login to your account',
      content: `
        <h1>New login to your account</h1>
        <p>Hello {{user.name}},</p>
        <p>There was a new login to your account at {{timestamp | date}}.</p>
        <p>IP Address: {{ipAddress}}</p>
        <p>Device: {{userAgent}}</p>
        <p>If this wasn't you, please contact your administrator immediately.</p>
      `,
      enabled: true,
    },
    {
      name: 'daily_summary',
      type: 'email',
      subject: 'Daily Security Summary - {{date | date}}',
      content: `
        <h1>Daily Security Summary</h1>
        <p>Date: {{date | date}}</p>
        <h2>Alerts Summary</h2>
        <ul>
          <li>Critical: {{summary.alerts.critical}}</li>
          <li>High: {{summary.alerts.high}}</li>
          <li>Medium: {{summary.alerts.medium}}</li>
          <li>Low: {{summary.alerts.low}}</li>
        </ul>
        <h2>Events Summary</h2>
        <p>Total Events: {{summary.events.total}}</p>
        <p>View dashboard: <a href="{{baseUrl}}/dashboard">Click here</a></p>
      `,
      enabled: true,
    },
    {
      name: 'alert_slack',
      type: 'slack',
      content: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'New Alert: {{alert.title}}',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Severity:* {{alert.severity}}',
              },
              {
                type: 'mrkdwn',
                text: '*Status:* {{alert.status}}',
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '{{alert.description}}',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Alert',
                },
                url: '{{baseUrl}}/alerts/{{alert.id}}',
              },
            ],
          },
        ],
      }),
      enabled: true,
    },
  ];

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationTemplate.name)
    private templateModel: Model<NotificationTemplateDocument>,
    private emailProvider: EmailProvider,
    private webhookProvider: WebhookProvider,
    private slackProvider: SlackProvider,
    private pushProvider: PushProvider,
    private templateRenderer: TemplateRenderer,
    private configService: ConfigService,
    private logger: LoggerService,
    private usersService: UsersService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultTemplatesExist();
    this.logger.log('Notifications service initialized', 'NotificationsService');
  }

  private async ensureDefaultTemplatesExist() {
    // Check if templates exist
    for (const template of this.defaultTemplates) {
      const existingTemplate = await this.templateModel.findOne({
        name: template.name,
        type: template.type,
      }).exec();
      
      if (!existingTemplate) {
        // Create template if it doesn't exist
        await this.createTemplate(template);
        this.logger.log(`Created default ${template.type} template: ${template.name}`, 'NotificationsService');
      }
    }
  }

  // Event handlers for automatic notification generation
  @OnEvent('alert.created')
  async handleAlertCreated(alert: any) {
    try {
      // Find users who should be notified about this alert
      // For example, all users with analyst role
      const users = await this.usersService.findByRole(['admin', 'analyst']);
      
      // Send email notifications
      for (const user of users) {
        // Skip users who have disabled notifications
        if (user.preferences?.disableNotifications) {
          continue;
        }
        
        await this.sendTemplatedNotification('alert_created', {
          alert,
          user,
          baseUrl: this.configService.get('app.baseUrl'),
        }, {
          recipients: [user.email],
          userId: user.id,
        });
      }
      
      // Send Slack notification if configured
      if (this.configService.get('notifications.slack.enabled')) {
        await this.sendTemplatedNotification('alert_slack', {
          alert,
          baseUrl: this.configService.get('app.baseUrl'),
        }, {
          channelId: this.configService.get('notifications.slack.channelId'),
        });
      }
    } catch (error) {
      this.logger.error(`Error handling alert created event: ${error.message}`, error.stack, 'NotificationsService');
    }
  }

  @OnEvent('user.login')
  async handleUserLogin(data: any) {
    try {
      // Send login notification to user
      await this.sendTemplatedNotification('user_login', {
        user: data.user,
        timestamp: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }, {
        recipients: [data.user.email],
        userId: data.user.id,
      });
    } catch (error) {
      this.logger.error(`Error handling user login event: ${error.message}`, error.stack, 'NotificationsService');
    }
  }

  // Core notification methods
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = new this.notificationModel({
        ...createNotificationDto,
        status: 'pending',
        createdAt: new Date(),
      });
      
      // Save notification
      const savedNotification = await notification.save();
      
      // Send notification based on type
      await this.sendNotification(savedNotification);
      
      return savedNotification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`, error.stack, 'NotificationsService');
      throw error;
    }
  }

  async findAll(query: any): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      userId,
      type,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sort = 'createdAt',
      order = 'desc',
    } = query;
    
    // Build filter
    const filter: any = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }
    
    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }
    
    // Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };
    
    // Execute query
    const [data, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);
    
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findOne(id: string): Promise<Notification> {
    return this.notificationModel.findById(id).exec();
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    return this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .exec();
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.notificationModel
      .findByIdAndUpdate(id, { status: 'read', readAt: new Date() }, { new: true })
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId, status: 'sent' },
      { status: 'read', readAt: new Date() }
    );
  }

  async remove(id: string): Promise<void> {
    await this.notificationModel.findByIdAndDelete(id).exec();
  }

  // Template methods
  async createTemplate(createTemplateDto: CreateTemplateDto): Promise<NotificationTemplate> {
    const template = new this.templateModel(createTemplateDto);
    return template.save();
  }

  async findAllTemplates(): Promise<NotificationTemplate[]> {
    return this.templateModel.find().sort({ name: 1 }).exec();
  }

  async findTemplateById(id: string): Promise<NotificationTemplate> {
    return this.templateModel.findById(id).exec();
  }

  async findTemplateByName(name: string, type: string): Promise<NotificationTemplate> {
    return this.templateModel.findOne({ name, type }).exec();
  }

  async updateTemplate(id: string, updateTemplateDto: UpdateTemplateDto): Promise<NotificationTemplate> {
    return this.templateModel
      .findByIdAndUpdate(id, updateTemplateDto, { new: true })
      .exec();
  }

  async removeTemplate(id: string): Promise<void> {
    await this.templateModel.findByIdAndDelete(id).exec();
  }

  // Send methods
  async sendNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(`Sending ${notification.type} notification: ${notification.id}`, 'NotificationsService');
      
      // Update status to sending
      notification.status = 'sending';
      notification.sentAt = new Date();
      await notification.save();
      
      let success = false;
      let error = null;
      
      // Send based on type
      switch (notification.type) {
        case 'email':
          success = await this.emailProvider.send(notification);
          break;
        case 'webhook':
          success = await this.webhookProvider.send(notification);
          break;
        case 'slack':
          success = await this.slackProvider.send(notification);
          break;
        case 'push':
          success = await this.pushProvider.send(notification);
          break;
        default:
          error = `Unsupported notification type: ${notification.type}`;
      }
      
      // Update status
      if (success) {
        notification.status = 'sent';
      } else {
        notification.status = 'failed';
        notification.error = error || 'Failed to send notification';
      }
      
      await notification.save();
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`, error.stack, 'NotificationsService');
      
      // Update notification status
      notification.status = 'failed';
      notification.error = error.message;
      await notification.save();
    }
  }

  async sendTemplatedNotification(
    templateName: string,
    data: any,
    options: any
  ): Promise<Notification> {
    try {
      // Find template
      const template = await this.findTemplateByName(templateName, options.type || 'email');
      
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }
      
      if (!template.enabled) {
        throw new Error(`Template is disabled: ${templateName}`);
      }
      
      // Render template
      const renderedContent = this.templateRenderer.render(template.content, data);
      let renderedSubject = '';
      
      if (template.subject) {
        renderedSubject = this.templateRenderer.render(template.subject, data);
      }
      
      // Create notification
      const notificationData: CreateNotificationDto = {
        type: template.type,
        content: renderedContent,
        recipients: options.recipients,
        userId: options.userId,
        referenceId: options.referenceId,
        metadata: {
          ...options,
          templateName,
          renderedAt: new Date(),
        },
      };
      
      // Add subject for email
      if (template.type === 'email' && renderedSubject) {
        notificationData.subject = renderedSubject;
      }
      
      // Create and send notification
      return this.create(notificationData);
    } catch (error) {
      this.logger.error(`Error sending templated notification: ${error.message}`, error.stack, 'NotificationsService');
      throw error;
    }
  }

  async resendNotification(id: string): Promise<Notification> {
    try {
      const notification = await this.findOne(id);
      
      if (!notification) {
        throw new Error(`Notification not found: ${id}`);
      }
      
      // Reset status and error
      notification.status = 'pending';
      notification.error = null;
      notification.sentAt = null;
      await notification.save();
      
      // Resend
      await this.sendNotification(notification);
      
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error resending notification: ${error.message}`, error.stack, 'NotificationsService');
      throw error;
    }
  }

  // Analytics methods
  async getNotificationStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const match: any = {};
      
      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) {
          match.createdAt.$gte = startDate;
        }
        if (endDate) {
          match.createdAt.$lte = endDate;
        }
      }
      
      const [
        total,
        byType,
        byStatus,
        byDay,
      ] = await Promise.all([
        // Total count
        this.notificationModel.countDocuments(match),
        
        // Count by type
        this.notificationModel.aggregate([
          { $match: match },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        
        // Count by status
        this.notificationModel.aggregate([
          { $match: match },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        
        // Count by day
        this.notificationModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              sent: {
                $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
              },
              failed: {
                $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);
      
      return {
        total,
        byType: byType.map(item => ({
          type: item._id,
          count: item.count,
        })),
        byStatus: byStatus.map(item => ({
          status: item._id,
          count: item.count,
        })),
        byDay: byDay.map(item => ({
          date: item._id,
          count: item.count,
          sent: item.sent,
          failed: item.failed,
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting notification stats: ${error.message}`, error.stack, 'NotificationsService');
      throw error;
    }
  }
}