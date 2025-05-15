import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, ActionMetadata } from '../interfaces/action.interface';
import { LoggerService } from '../../../logger/logger.service';

@Injectable()
export class WebhookAction implements Action {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async execute(alert: any, config: any = {}): Promise<any> {
    try {
      // Get webhook URL
      const url = config.url || this.configService.get<string>('notifications.webhook.defaultUrl');
      
      if (!url) {
        throw new Error('Webhook URL not provided');
      }
      
      // Create payload
      const payload = this.buildWebhookPayload(alert, config);
      
      // Log webhook details
      this.logger.log(
        `[WEBHOOK] Sending alert data to: ${url}`,
        'WebhookAction'
      );
      
      // Simulate HTTP POST request
      // In a real implementation, this would use HttpService to make actual HTTP requests
      // For this simulation, we'll just return success
      
      return {
        type: 'webhook',
        url,
        payloadSize: JSON.stringify(payload).length,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error sending webhook for alert ${alert.id}: ${error.message}`,
        error.stack,
        'WebhookAction'
      );
      throw error;
    }
  }

  getMetadata(): ActionMetadata {
    return {
      name: 'Webhook',
      description: 'Sends alert data to an external webhook endpoint',
      enabled: this.configService.get<boolean>('notifications.webhook.enabled', false),
      configSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'The webhook URL to send data to',
          },
          method: {
            type: 'string',
            enum: ['POST', 'PUT'],
            default: 'POST',
            description: 'HTTP method to use',
          },
          headers: {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
            description: 'Additional HTTP headers to include',
          },
          includeFullAlert: {
            type: 'boolean',
            default: true,
            description: 'Whether to include the full alert object',
          },
          format: {
            type: 'string',
            enum: ['json', 'form'],
            default: 'json',
            description: 'Payload format',
          },
        },
        required: ['url'],
      },
      allowedRoles: ['admin'],
      icon: 'webhook',
    };
  }

  private buildWebhookPayload(alert: any, config: any): any {
    const includeFullAlert = config.includeFullAlert !== false;
    
    // Base payload
    const payload = {
      alertId: alert.id,
      title: alert.title,
      severity: alert.severity,
      status: alert.status,
      source: alert.source,
      timestamp: alert.timestamp,
    };
    
    // Add description if available
    if (alert.description) {
      payload['description'] = alert.description;
    }
    
    // Add entity information if available
    if (alert.entityId) {
      payload['entityId'] = alert.entityId;
    }
    
    // Add IP information if available
    if (alert.sourceIp) {
      payload['sourceIp'] = alert.sourceIp;
    }
    if (alert.destinationIp) {
      payload['destinationIp'] = alert.destinationIp;
    }
    
    // Include the full alert if requested
    if (includeFullAlert) {
      payload['alert'] = alert;
    }
    
    // Add custom metadata if provided in config
    if (config.metadata) {
      payload['metadata'] = config.metadata;
    }
    
    return payload;
  }
}