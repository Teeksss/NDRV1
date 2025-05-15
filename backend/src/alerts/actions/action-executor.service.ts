import { Injectable } from '@nestjs/common';
import { Action } from './interfaces/action.interface';
import { EmailNotificationAction } from './actions/email-notification.action';
import { WebhookAction } from './actions/webhook.action';
import { EscalationAction } from './actions/escalation.action';
import { RemediationAction } from './actions/remediation.action';
import { TicketCreationAction } from './actions/ticket-creation.action';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class ActionExecutorService {
  private actions: Map<string, Action> = new Map();

  constructor(
    private emailNotificationAction: EmailNotificationAction,
    private webhookAction: WebhookAction,
    private escalationAction: EscalationAction,
    private remediationAction: RemediationAction,
    private ticketCreationAction: TicketCreationAction,
    private logger: LoggerService,
  ) {
    this.registerActions();
  }

  private registerActions() {
    this.actions.set('email_notification', this.emailNotificationAction);
    this.actions.set('webhook', this.webhookAction);
    this.actions.set('escalation', this.escalationAction);
    this.actions.set('remediation', this.remediationAction);
    this.actions.set('ticket_creation', this.ticketCreationAction);
  }

  async executeAction(actionType: string, alert: any, actionConfig: any = {}): Promise<any> {
    try {
      const action = this.actions.get(actionType);
      
      if (!action) {
        throw new Error(`Action type '${actionType}' not found.`);
      }
      
      this.logger.log(`Executing action '${actionType}' for alert ID ${alert.id}`, 'ActionExecutorService');
      
      const result = await action.execute(alert, actionConfig);
      
      this.logger.log(`Action '${actionType}' completed successfully for alert ID ${alert.id}`, 'ActionExecutorService');
      
      return {
        success: true,
        actionType,
        alertId: alert.id,
        result,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error executing action '${actionType}' for alert ID ${alert.id}: ${error.message}`, error.stack, 'ActionExecutorService');
      
      return {
        success: false,
        actionType,
        alertId: alert.id,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  async executeActions(actions: Array<{ type: string; config: any }>, alert: any): Promise<any[]> {
    try {
      const results = [];
      
      for (const action of actions) {
        const result = await this.executeAction(action.type, alert, action.config);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      this.logger.error(`Error executing multiple actions for alert ID ${alert.id}: ${error.message}`, error.stack, 'ActionExecutorService');
      throw error;
    }
  }

  getAvailableActions(): string[] {
    return Array.from(this.actions.keys());
  }

  getActionMetadata(actionType: string): any {
    const action = this.actions.get(actionType);
    
    if (!action) {
      return null;
    }
    
    return action.getMetadata();
  }

  getAllActionsMetadata(): any[] {
    const metadata = [];
    
    for (const [type, action] of this.actions.entries()) {
      metadata.push({
        type,
        ...action.getMetadata(),
      });
    }
    
    return metadata;
  }
}