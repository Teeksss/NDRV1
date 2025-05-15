import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CorrelationRule, CorrelationRuleDocument } from './schemas/correlation-rule.schema';
import { CorrelationEvent, CorrelationEventDocument } from './schemas/correlation-event.schema';
import { RuleEvaluatorService } from './helpers/rule-evaluator.service';
import { PatternMatcherService } from './helpers/pattern-matcher.service';
import { AlertsService } from '../alerts/alerts.service';
import { EventsService } from '../events/events.service';
import { EntitiesService } from '../entities/entities.service';
import { LoggerService } from '../logger/logger.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CorrelationMetricsService } from './correlation-metrics.service';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class CorrelationEngineService implements OnModuleInit {
  private activeRules: Map<string, CorrelationRule> = new Map();
  private thresholdCounters: Map<string, Map<string, any>> = new Map();
  private sequenceTrackers: Map<string, Map<string, any[]>> = new Map();
  private processingQueue: any[] = [];
  private isProcessing: boolean = false;
  private lastGarbageCollection: Date = new Date();
  private maxEventsTtl: number;
  private maxQueueSize: number;
  private evaluationThreads: number;
  private engineStatus: {
    status: 'running' | 'stopped' | 'initializing';
    rulesLoaded: number;
    eventsProcessed: number;
    alertsGenerated: number;
    lastEventTime: Date | null;
    startTime: Date;
    metrics: {
      avgProcessingTime: number;
      eventsPerSecond: number;
      queueSize: number;
      memoryUsage: any;
    };
  };

  constructor(
    @InjectModel(CorrelationRule.name) private correlationRuleModel: Model<CorrelationRuleDocument>,
    @InjectModel(CorrelationEvent.name) private correlationEventModel: Model<CorrelationEventDocument>,
    private ruleEvaluatorService: RuleEvaluatorService,
    private patternMatcherService: PatternMatcherService,
    private alertsService: AlertsService,
    private eventsService: EventsService,
    private entitiesService: EntitiesService,
    private eventEmitter: EventEmitter2,
    private logger: LoggerService,
    private websocketGateway: WebsocketGateway,
    private correlationMetricsService: CorrelationMetricsService,
    private configService: ConfigService
  ) {
    // Get configuration
    this.maxEventsTtl = this.configService.get('correlation.eventsTtl', 24 * 60 * 60) * 1000; // Default 24 hours in ms
    this.maxQueueSize = this.configService.get('correlation.maxQueueSize', 10000);
    this.evaluationThreads = this.configService.get('correlation.evaluationThreads', 4);
    
    // Initialize engine status
    this.engineStatus = {
      status: 'initializing',
      rulesLoaded: 0,
      eventsProcessed: 0,
      alertsGenerated: 0,
      lastEventTime: null,
      startTime: new Date(),
      metrics: {
        avgProcessingTime: 0,
        eventsPerSecond: 0,
        queueSize: 0,
        memoryUsage: process.memoryUsage()
      }
    };
  }

  async onModuleInit() {
    // Load all active rules on startup
    await this.loadActiveRules();
    
    // Begin processing events from the queue
    this.startProcessingQueue();
    
    // Set engine status to running
    this.engineStatus.status = 'running';
    
    this.logger.log(`Correlation engine started with ${this.activeRules.size} active rules`, 'CorrelationEngineService');
  }

  private async loadActiveRules() {
    try {
      const rules = await this.correlationRuleModel.find({ enabled: true }).exec();
      
      // Clear existing rules
      this.activeRules.clear();
      
      // Load rules into memory
      for (const rule of rules) {
        this.activeRules.set(rule.id, rule);
      }
      
      this.engineStatus.rulesLoaded = this.activeRules.size;
      
      this.logger.log(`Loaded ${this.activeRules.size} active correlation rules`, 'CorrelationEngineService');
    } catch (error) {
      this.logger.error(`Error loading correlation rules: ${error.message}`, error.stack, 'CorrelationEngineService');
    }
  }

  async reloadRules() {
    await this.loadActiveRules();
    
    // Reset tracking structures
    this.thresholdCounters.clear();
    this.sequenceTrackers.clear();
    
    return {
      success: true,
      rulesLoaded: this.activeRules.size,
      timestamp: new Date()
    };
  }

  @OnEvent('event.created')
  async handleEventCreated(event: any) {
    // Add event to processing queue
    this.addToProcessingQueue(event);
  }

  @OnEvent('event.updated')
  async handleEventUpdated(event: any) {
    // For updated events, we might need to reassess
    this.addToProcessingQueue(event);
  }

  @OnEvent('correlation.rule.created')
  async handleRuleCreated(rule: CorrelationRule) {
    if (rule.enabled) {
      this.activeRules.set(rule.id, rule);
      this.engineStatus.rulesLoaded = this.activeRules.size;
      this.logger.log(`Added new correlation rule to engine: ${rule.name}`, 'CorrelationEngineService');
    }
  }

  @OnEvent('correlation.rule.updated')
  async handleRuleUpdated(rule: CorrelationRule) {
    // If rule is enabled, update or add it
    if (rule.enabled) {
      this.activeRules.set(rule.id, rule);
      this.logger.log(`Updated correlation rule in engine: ${rule.name}`, 'CorrelationEngineService');
    } 
    // If rule is disabled, remove it
    else if (this.activeRules.has(rule.id)) {
      this.activeRules.delete(rule.id);
      this.logger.log(`Removed disabled correlation rule from engine: ${rule.name}`, 'CorrelationEngineService');
    }
    
    this.engineStatus.rulesLoaded = this.activeRules.size;
  }

  @OnEvent('correlation.rule.statusChanged')
  async handleRuleStatusChanged(data: { rule: CorrelationRule, enabled: boolean }) {
    // Add or remove rule based on enabled status
    if (data.enabled) {
      this.activeRules.set(data.rule.id, data.rule);
      this.logger.log(`Added enabled correlation rule to engine: ${data.rule.name}`, 'CorrelationEngineService');
    } else {
      this.activeRules.delete(data.rule.id);
      this.logger.log(`Removed disabled correlation rule from engine: ${data.rule.name}`, 'CorrelationEngineService');
    }
    
    this.engineStatus.rulesLoaded = this.activeRules.size;
  }

  @OnEvent('correlation.rule.deleted')
  async handleRuleDeleted(data: { id: string, rule: CorrelationRule }) {
    // Remove rule from active rules
    this.activeRules.delete(data.id);
    this.engineStatus.rulesLoaded = this.activeRules.size;
    this.logger.log(`Removed deleted correlation rule from engine: ${data.rule.name}`, 'CorrelationEngineService');
  }

  private addToProcessingQueue(event: any) {
    // Check if queue is too large
    if (this.processingQueue.length >= this.maxQueueSize) {
      this.logger.warn(`Correlation engine queue is full, dropping event: ${event.id}`, 'CorrelationEngineService');
      return;
    }
    
    // Add event to queue
    this.processingQueue.push({
      event,
      timestamp: new Date()
    });
    
    this.engineStatus.metrics.queueSize = this.processingQueue.length;
    
    // Start processing if not already processing
    if (!this.isProcessing) {
      this.startProcessingQueue();
    }
  }

  private startProcessingQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processNextInQueue();
  }

  private async processNextInQueue() {
    if (this.processingQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    // Process next batch of events
    const startTime = Date.now();
    const batchSize = Math.min(this.evaluationThreads, this.processingQueue.length);
    const batch = this.processingQueue.splice(0, batchSize);
    
    try {
      // Process events in parallel
      await Promise.all(batch.map(item => this.correlateEvent(item.event)));
      
      // Update metrics
      const processingTime = Date.now() - startTime;
      this.engineStatus.eventsProcessed += batch.length;
      this.engineStatus.lastEventTime = new Date();
      this.engineStatus.metrics.avgProcessingTime = 
        (this.engineStatus.metrics.avgProcessingTime * 0.9) + (processingTime / batch.length * 0.1);
      this.engineStatus.metrics.eventsPerSecond = 
        batch.length / (processingTime / 1000);
      this.engineStatus.metrics.queueSize = this.processingQueue.length;
      this.engineStatus.metrics.memoryUsage = process.memoryUsage();
      
      // Run garbage collection if needed
      if (Date.now() - this.lastGarbageCollection.getTime() > 60000) { // Every minute
        this.garbageCollect();
        this.lastGarbageCollection = new Date();
      }
    } catch (error) {
      this.logger.error(`Error processing event batch: ${error.message}`, error.stack, 'CorrelationEngineService');
    }
    
    // Continue processing queue
    process.nextTick(() => this.processNextInQueue());
  }

  private async correlateEvent(event: any) {
    try {
      // Skip events that don't have required fields
      if (!event.id || !event.type) {
        return;
      }
      
      // Build context for rule evaluation
      const context = await this.buildCorrelationContext(event);
      
      // Store event for future correlation
      await this.storeCorrelationEvent(event);
      
      // Evaluate all active rules against this event
      for (const rule of this.activeRules.values()) {
        // Skip if rule doesn't apply to this event type
        if (rule.eventTypes && rule.eventTypes.length > 0 && !rule.eventTypes.includes(event.type)) {
          continue;
        }
        
        try {
          // Evaluate rule
          const startTime = Date.now();
          const result = await this.ruleEvaluatorService.evaluateRule(rule, context);
          const evaluationTime = Date.now() - startTime;
          
          // Update metrics
          this.correlationMetricsService.recordRuleEvaluation(rule.id, evaluationTime, result.matched);
          
          // If rule matched, execute actions
          if (result.matched) {
            await this.executeRuleActions(rule, event, context, result);
          }
        } catch (error) {
          this.logger.error(
            `Error evaluating rule ${rule.id} for event ${event.id}: ${error.message}`,
            error.stack,
            'CorrelationEngineService'
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error correlating event ${event.id}: ${error.message}`, error.stack, 'CorrelationEngineService');
    }
  }

  private async buildCorrelationContext(event: any) {
    try {
      // Get time window for fetching related events (default to 24 hours)
      const timeWindow = 24 * 60 * 60 * 1000; // 24 hours in ms
      const timeThreshold = new Date(Date.now() - timeWindow);
      
      // Get related events based on common identifiers
      let relatedEvents = [];
      
      // If event has an entity ID, get events for that entity
      if (event.entityId) {
        const entityEvents = await this.eventsService.findByEntityId(
          event.entityId,
          { startDate: timeThreshold }
        );
        relatedEvents = [...relatedEvents, ...entityEvents];
      }
      
      // If event has source or destination IP, get events for those IPs
      if (event.sourceIp) {
        const sourceIpEvents = await this.eventsService.findByIp(
          event.sourceIp,
          { startDate: timeThreshold }
        );
        relatedEvents = [...relatedEvents, ...sourceIpEvents];
      }
      
      if (event.destinationIp) {
        const destIpEvents = await this.eventsService.findByIp(
          event.destinationIp,
          { startDate: timeThreshold }
        );
        relatedEvents = [...relatedEvents, ...destIpEvents];
      }
      
      // Remove duplicates and the current event itself
      relatedEvents = relatedEvents
        .filter((e: any) => e.id !== event.id)
        .filter((e: any, index: number, self: any[]) => 
          index === self.findIndex((t: any) => t.id === e.id)
        );
      
      return {
        currentEvent: event,
        relatedEvents,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(
        `Error building correlation context for event ${event.id}: ${error.message}`,
        error.stack,
        'CorrelationEngineService'
      );
      
      // Return basic context if there's an error
      return {
        currentEvent: event,
        relatedEvents: [],
        timestamp: new Date()
      };
    }
  }

  private async storeCorrelationEvent(event: any) {
    try {
      // Create correlation event record
      const correlationEvent = new this.correlationEventModel({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp || new Date(),
        entityId: event.entityId,
        sourceIp: event.sourceIp,
        destinationIp: event.destinationIp,
        data: {
          ...event
        }
      });
      
      await correlationEvent.save();
    } catch (error) {
      this.logger.error(
        `Error storing correlation event ${event.id}: ${error.message}`,
        error.stack,
        'CorrelationEngineService'
      );
    }
  }

  private async executeRuleActions(rule: CorrelationRule, triggerEvent: any, context: any, result: any) {
    try {
      this.logger.log(`Rule triggered: ${rule.name} for event ${triggerEvent.id}`, 'CorrelationEngineService');
      
      // Update rule trigger count
      await this.correlationRuleModel.updateOne(
        { _id: rule.id },
        {
          $inc: { triggerCount: 1 },
          $set: { lastTriggeredAt: new Date() }
        }
      );
      
      // Execute each action defined in the rule
      for (const action of rule.actions || []) {
        switch (action.type) {
          case 'create_alert':
            await this.createAlert(rule, triggerEvent, context, action.parameters, result);
            break;
          case 'update_entity':
            await this.updateEntity(triggerEvent, action.parameters);
            break;
          case 'send_notification':
            await this.sendNotification(rule, triggerEvent, action.parameters);
            break;
          default:
            this.logger.warn(`Unknown action type: ${action.type}`, 'CorrelationEngineService');
        }
      }
      
      // Update metrics
      this.correlationMetricsService.recordRuleTrigger(rule.id);
    } catch (error) {
      this.logger.error(
        `Error executing actions for rule ${rule.id}: ${error.message}`,
        error.stack,
        'CorrelationEngineService'
      );
    }
  }

  private async createAlert(rule: CorrelationRule, triggerEvent: any, context: any, parameters: any, result: any) {
    try {
      // Build alert data
      const alertData = {
        title: parameters?.title || rule.name,
        description: parameters?.description || `Alert generated by correlation rule: ${rule.name}`,
        severity: parameters?.severity || rule.severity || 'medium',
        source: 'correlation_engine',
        type: parameters?.type || 'correlated',
        category: rule.category || rule.type,
        eventIds: [triggerEvent.id, ...context.relatedEvents.map((e: any) => e.id)],
        entityId: triggerEvent.entityId,
        timestamp: new Date(),
        isCorrelated: true,
        correlationRuleId: rule.id,
        sourceIp: triggerEvent.sourceIp,
        destinationIp: triggerEvent.destinationIp,
        tactic: rule.tactic,
        technique: rule.technique,
        tags: rule.tags || [],
        payload: {
          rule: {
            id: rule.id,
            name: rule.name,
            type: rule.type
          },
          evaluationResult: result,
          triggerEvent: {
            id: triggerEvent.id,
            type: triggerEvent.type
          }
        }
      };
      
      // Create alert
      const alert = await this.alertsService.create(alertData);
      
      // Update engine metrics
      this.engineStatus.alertsGenerated++;
      
      this.logger.log(`Created alert ${alert.id} from rule ${rule.name}`, 'CorrelationEngineService');
      
      return alert;
    } catch (error) {
      this.logger.error(
        `Error creating alert from rule ${rule.id}: ${error.message}`,
        error.stack,
        'CorrelationEngineService'
      );
    }
  }

  private async updateEntity(triggerEvent: any, parameters: any) {
    try {
      if (!triggerEvent.entityId) return;
      
      // Update entity
      const updates: any = {};
      
      // Set risk score if provided
      if (parameters?.riskScore) {
        updates.riskScore = parameters.riskScore;
      }
      
      // Add tag if provided
      if (parameters?.tag) {
        await this.entitiesService.addTagToEntity(triggerEvent.entityId, parameters.tag);
      }
      
      // Set status if provided
      if (parameters?.status) {
        updates.status = parameters.status;
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await this.entitiesService.updateEntity(triggerEvent.entityId, updates);
        this.logger.log(`Updated entity ${triggerEvent.entityId} with correlation data`, 'CorrelationEngineService');
      }
    } catch (error) {
      this.logger.error(
        `Error updating entity ${triggerEvent.entityId}: ${error.message}`,
        error.stack,
        'CorrelationEngineService'
      );
    }
  }

  private async sendNotification(rule: CorrelationRule, triggerEvent: any, parameters: any) {
    try {
      // Build notification data
      const notification = {
        title: parameters?.title || `Rule "${rule.name}" triggered`,
        message: parameters?.message || `Correlation rule "${rule.name}" was triggered by event ${triggerEvent.id}`,
        type: parameters?.type || rule.severity || 'warning',
        timestamp: new Date(),
        source: 'correlation_engine',
        ruleId: rule.id,
        eventId: triggerEvent.id,
        entityId: triggerEvent.entityId,
        data: {
          rule: {
            id: rule.id,
            name: rule.name
          },
          event: {
            id: triggerEvent.id,
            type: triggerEvent.type
          }
        }
      };
      
      // Send notification
      this.websocketGateway.broadcastNotification(notification);
      
      // Also emit event for other parts of the system to handle
      this.eventEmitter.emit('notification.created', notification);
      
      this.logger.log(`Sent notification for rule ${rule.name}`, 'CorrelationEngineService');
    } catch (error) {
      this.logger.error(
        `Error sending notification for rule ${rule.id}: ${error.message}`,
        error.stack,
        'CorrelationEngineService'
      );
    }
  }

  @Interval(3600000) // Every hour
  private async garbageCollect() {
    try {
      const cutoffTime = new Date(Date.now() - this.maxEventsTtl);
      
      // Remove old correlation events
      const result = await this.correlationEventModel.deleteMany({
        timestamp: { $lt: cutoffTime }
      });
      
      this.logger.log(`Garbage collection removed ${result.deletedCount} old correlation events`, 'CorrelationEngineService');
      
      // Clean up threshold counters and sequence trackers
      for (const [ruleId, counters] of this.thresholdCounters.entries()) {
        for (const [key, data] of counters.entries()) {
          if (data.lastUpdate < cutoffTime) {
            counters.delete(key);
          }
        }
        
        // Remove rule entry if empty
        if (counters.size === 0) {
          this.thresholdCounters.delete(ruleId);
        }
      }
      
      for (const [ruleId, trackers] of this.sequenceTrackers.entries()) {
        for (const [key, events] of trackers.entries()) {
          // Remove old events
          const filteredEvents = events.filter(e => e.timestamp >= cutoffTime);
          
          if (filteredEvents.length === 0) {
            trackers.delete(key);
          } else {
            trackers.set(key, filteredEvents);
          }
        }
        
        // Remove rule entry if empty
        if (trackers.size === 0) {
          this.sequenceTrackers.delete(ruleId);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error during garbage collection: ${error.message}`,
        error.stack,
        'CorrelationEngineService'
      );
    }
  }

  getStatus() {
    return {
      ...this.engineStatus,
      activeRules: this.activeRules.size,
      maxQueueSize: this.maxQueueSize,
      currentQueueSize: this.processingQueue.length,
      evaluationThreads: this.evaluationThreads,
      isProcessing: this.isProcessing,
      memory: process.memoryUsage()
    };
  }
}