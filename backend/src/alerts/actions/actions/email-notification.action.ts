import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, ActionMetadata } from '../interfaces/action.interface';
import { LoggerService } from '../../../logger/logger.service';

@Injectable()
export class EmailNotificationAction implements Action {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async execute(alert: any, config: any = {}): Promise<any> {
    try {
      // In a real implementation, this would connect to an SMTP server and send emails
      // For this example, we'll just log the email details
      
      // Get recipients
      const recipients = config.recipients || [];
      
      // Create email subject
      const subject = config.subject || `[NDR Korelasyon Motoru] Alert: ${alert.title}`;
      
      // Create email body
      const body = this.formatEmailBody(alert, config);
      
      // Log email details
      this.logger.log(
        `[EMAIL NOTIFICATION] To: ${recipients.join(', ')}, Subject: ${subject}`,
        'EmailNotificationAction'
      );
      
      // Return success result
      return {
        type: 'email_notification',
        recipients,
        subject,
        bodyLength: body.length,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error sending email notification for alert ${alert.id}: ${error.message}`,
        error.stack,
        'EmailNotificationAction'
      );
      throw error;
    }
  }

  getMetadata(): ActionMetadata {
    return {
      name: 'Email Notification',
      description: 'Sends email notifications about alerts to specified recipients',
      enabled: this.configService.get<boolean>('notifications.email.enabled', false),
      configSchema: {
        type: 'object',
        properties: {
          recipients: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email',
            },
            description: 'Email addresses to send notifications to',
          },
          subject: {
            type: 'string',
            description: 'Custom email subject (optional)',
          },
          template: {
            type: 'string',
            enum: ['default', 'detailed', 'minimal'],
            default: 'default',
            description: 'Email template to use',
          },
          includeDetails: {
            type: 'boolean',
            default: true,
            description: 'Whether to include detailed alert information',
          },
        },
        required: ['recipients'],
      },
      allowedRoles: ['admin', 'analyst'],
      icon: 'email',
    };
  }

  private formatEmailBody(alert: any, config: any): string {
    // Template selection
    const template = config.template || 'default';
    const includeDetails = config.includeDetails !== false;
    
    // Basic content that all templates share
    let content = `
Alert ID: ${alert.id}
Title: ${alert.title}
Severity: ${alert.severity}
Source: ${alert.source}
Status: ${alert.status}
Timestamp: ${new Date(alert.timestamp).toLocaleString()}
`;
    
    // Add description
    if (alert.description) {
      content += `\nDescription: ${alert.description}\n`;
    }
    
    // Add details if requested
    if (includeDetails) {
      if (alert.entityId) {
        content += `\nAffected Entity: ${alert.entityId}\n`;
      }
      
      if (alert.sourceIp) {
        content += `Source IP: ${alert.sourceIp}\n`;
      }
      
      if (alert.destinationIp) {
        content += `Destination IP: ${alert.destinationIp}\n`;
      }
      
      // Add MITRE info if available
      if (alert.tactic || alert.technique) {
        content += '\nMITRE ATT&CK Information:\n';
        if (alert.tactic) {
          content += `Tactic: ${alert.tactic}\n`;
        }
        if (alert.technique) {
          content += `Technique: ${alert.technique}\n`;
        }
      }
    }
    
    // Add footer
    content += '\n\nThis is an automated alert notification from NDR Korelasyon Motoru.';
    
    return content;
  }
}