import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import * as ejs from 'ejs';

import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationChannel } from './entities/notification-channel.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransport: any;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(NotificationTemplate.name) private templateModel: Model<NotificationTemplate>,
    @InjectModel(NotificationChannel.name) private channelModel: Model<NotificationChannel>
  ) {
    // Initialize email transport if enabled
    const emailConfig = this.configService.get('notification.email');
    if (emailConfig && emailConfig.enabled) {
      this.emailTransport = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth
      });
    }
  }

  /**
   * Get notifications with filters
   */
  async getNotifications(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      return this.notificationModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string) {
    try {
      return this.notificationModel.findById(notificationId).exec();
    } catch (error) {
      this.logger.error(`Error getting notification by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send alert notification
   */
  async sendAlertNotification(alert: any, template?: any) {
    try {
      // Find default template if not provided
      if (!template) {
        template = await this.templateModel.findOne({
          type: 'alert',
          isDefault: true
        }).exec();
      }
      
      if (!template) {
        this.logger.warn('No template found for alert notification');
        return;
      }
      
      // Get channels to notify
      const channelIds = template.notificationChannels || [];
      if (channelIds.length === 0) {
        this.logger.warn('No channels configured for notification template');
        return;
      }
      
      const channels = await this.channelModel.find({
        _id: { $in: channelIds },
        enabled: true
      }).exec();
      
      if (channels.length === 0) {
        this.logger.warn('No enabled channels found for notification');
        return;
      }
      
      // Prepare notification data
      const notificationData = {
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        timestamp: alert.timestamp,
        source: alert.source,
        ipAddress: alert.ipAddress,
        status: alert.status,
        id: alert._id.toString()
      };
      
      // Send to each channel
      for (const channel of channels) {
        await this.sendNotificationToChannel(channel, notificationData, template);
      }
      
      // Create notification record
      await this.notificationModel.create({
        type: 'alert',
        alert: alert._id,
        title: alert.title,
        channels: channels.map(c => c._id),
        timestamp: new Date()
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error sending alert notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification to channel
   */
  private async sendNotificationToChannel(channel: any, data: any, template: any) {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel, data, template);
          break;
        case 'slack':
          await this.sendSlackNotification(channel, data, template);
          break;
        case 'webhook':
          await this.sendWebhookNotification(channel, data, template);
          break;
        default:
          this.logger.warn(`Unsupported channel type: ${channel.type}`);
      }
    } catch (error) {
      this.logger.error(`Error sending notification to channel ${channel.name}: ${error.message}`, error.stack);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: any, data: any, template: any) {
    if (!this.emailTransport) {
      this.logger.warn('Email transport not configured');
      return;
    }
    
    try {
      // Render email template
      const htmlContent = await this.renderTemplate(template.content, data);
      
      // Send email
      await this.emailTransport.sendMail({
        from: this.configService.get('notification.email.from'),
        to: channel.config.recipients.join(','),
        subject: this.renderSimpleTemplate(template.subject, data),
        html: htmlContent
      });
      
      this.logger.log(`Email notification sent to ${channel.config.recipients.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error sending email notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(channel: any, data: any, template: any) {
    try {
      if (!channel.config.webhookUrl) {
        throw new Error('Slack webhook URL not configured');
      }
      
      // Prepare Slack message
      const message = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: this.renderSimpleTemplate(template.subject, data)
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: this.renderSimpleTemplate(template.content, data)
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Severity:* ${data.severity} | *Time:* ${new Date(data.timestamp).toLocaleString()}`
              }
            ]
          }
        ]
      };
      
      // Add color based on severity
      const color = this.getSeverityColor(data.severity);
      if (color) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ' '
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Alert'
            },
            value: `alert_${data.id}`,
            url: `${this.configService.get('app.frontendUrl')}/alerts/${data.id}`
          }
        });
      }
      
      // Send to Slack
      await axios.post(channel.config.webhookUrl, message);
      
      this.logger.log(`Slack notification sent to webhook`);
    } catch (error) {
      this.logger.error(`Error sending Slack notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: any, data: any, template: any) {
    try {
      if (!channel.config.url) {
        throw new Error('Webhook URL not configured');
      }
      
      // Prepare webhook payload
      const payload = {
        ...data,
        title: this.renderSimpleTemplate(template.subject, data),
        message: this.renderSimpleTemplate(template.content, data),
        notificationTime: new Date()
      };
      
      // Send to webhook
      await axios.post(channel.config.url, payload, {
        headers: channel.config.headers || {}
      });
      
      this.logger.log(`Webhook notification sent to ${channel.config.url}`);
    } catch (error) {
      this.logger.error(`Error sending webhook notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Render simple template
   */
  private renderSimpleTemplate(template: string, data: any): string {
    try {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value = data;
        
        for (const k of keys) {
          if (value === undefined || value === null) {
            return '';
          }
          value = value[k];
        }
        
        return value !== undefined && value !== null ? value : '';
      });
    } catch (error) {
      this.logger.error(`Error rendering simple template: ${error.message}`, error.stack);
      return template;
    }
  }

  /**
   * Render template with EJS
   */
  private async renderTemplate(template: string, data: any): Promise<string> {
    try {
      return await ejs.render(template, data, { async: true });
    } catch (error) {
      this.logger.error(`Error rendering template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get severity color
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#FF0000';
      case 'high':
        return '#FF9900';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#00CC00';
      case 'info':
        return '#0099CC';
      default:
        return '#999999';
    }
  }

  /**
   * Get channels
   */
  async getChannels(filters: any = {}) {
    try {
      return this.channelModel.find(filters).exec();
    } catch (error) {
      this.logger.error(`Error getting channels: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create channel
   */
  async createChannel(channelData: any) {
    try {
      // Validate required fields
      if (!channelData.name) {
        throw new Error('Channel name is required');
      }
      
      if (!channelData.type) {
        throw new Error('Channel type is required');
      }
      
      // Validate channel config based on type
      this.validateChannelConfig(channelData.type, channelData.config);
      
      // Create channel
      return this.channelModel.create({
        ...channelData,
        enabled: channelData.enabled !== false,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error(`Error creating channel: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update channel
   */
  async updateChannel(channelId: string, channelData: any) {
    try {
      // Validate channel config based on type
      if (channelData.type && channelData.config) {
        this.validateChannelConfig(channelData.type, channelData.config);
      }
      
      // Update channel
      const channel = await this.channelModel.findByIdAndUpdate(
        channelId,
        {
          ...channelData,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!channel) {
        throw new Error(`Channel not found: ${channelId}`);
      }
      
      return channel;
    } catch (error) {
      this.logger.error(`Error updating channel: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete channel
   */
  async deleteChannel(channelId: string) {
    try {
      const channel = await this.channelModel.findByIdAndDelete(channelId).exec();
      
      if (!channel) {
        throw new Error(`Channel not found: ${channelId}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting channel: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate channel config
   */
  private validateChannelConfig(type: string, config: any) {
    if (!config) {
      throw new Error('Channel configuration is required');
    }
    
    switch (type) {
      case 'email':
        if (!config.recipients || config.recipients.length === 0) {
          throw new Error('Email recipients are required');
        }
        break;
      case 'slack':
        if (!config.webhookUrl) {
          throw new Error('Slack webhook URL is required');
        }
        break;
      case 'webhook':
        if (!config.url) {
          throw new Error('Webhook URL is required');
        }
        break;
      default:
        throw new Error(`Unsupported channel type: ${type}`);
    }
  }

  /**
   * Get templates
   */
  async getTemplates(filters: any = {}) {
    try {
      return this.templateModel.find(filters).exec();
    } catch (error) {
      this.logger.error(`Error getting templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create template
   */
  async createTemplate(templateData: any) {
    try {
      // Validate required fields
      if (!templateData.name) {
        throw new Error('Template name is required');
      }
      
      if (!templateData.type) {
        throw new Error('Template type is required');
      }
      
      if (!templateData.subject) {
        throw new Error('Template subject is required');
      }
      
      if (!templateData.content) {
        throw new Error('Template content is required');
      }
      
      // Create template
      return this.templateModel.create({
        ...templateData,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error(`Error creating template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, templateData: any) {
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
      this.logger.error(`Error updating template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string) {
    try {
      const template = await this.templateModel.findByIdAndDelete(templateId).exec();
      
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Test channel
   */
  async testChannel(channelId: string) {
    try {
      // Get channel
      const channel = await this.channelModel.findById(channelId).exec();
      
      if (!channel) {
        throw new Error(`Channel not found: ${channelId}`);
      }
      
      if (!channel.enabled) {
        throw new Error('Channel is disabled');
      }
      
      // Prepare test data
      const testData = {
        title: 'Test Notification',
        description: 'This is a test notification to verify channel configuration.',
        severity: 'info',
        timestamp: new Date(),
        source: 'system',
        ipAddress: '127.0.0.1',
        status: 'test',
        id: 'test-notification'
      };
      
      // Create basic template
      const template = {
        subject: 'Test Notification from NDR Korelasyon Motoru',
        content: 'This is a test notification sent at {{timestamp}} to verify that {{severity}} notifications are working correctly.'
      };
      
      // Send test notification
      await this.sendNotificationToChannel(channel, testData, template);
      
      return { success: true, message: `Test notification sent to ${channel.name}` };
    } catch (error) {
      this.logger.error(`Error testing channel: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }
}