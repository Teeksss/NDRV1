import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Subject, Observable } from 'rxjs';
import { throttleTime, scan } from 'rxjs/operators';

@Injectable()
export class LiveMonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LiveMonitoringService.name);
  private eventSubjects = new Map<string, Subject<any>>();
  private eventCounts = new Map<string, number>();
  private bufferIntervalMs: number;
  private bufferLimits = new Map<string, number>();
  private isMonitoringEnabled = true;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2
  ) {
    this.bufferIntervalMs = this.configService.get('monitoring.liveBufferIntervalMs') || 1000;
    
    // Set buffer limits from config
    const bufferLimits = this.configService.get('monitoring.eventBufferLimits') || {};
    for (const [eventType, limit] of Object.entries(bufferLimits)) {
      this.bufferLimits.set(eventType, limit as number);
    }
  }

  onModuleInit() {
    this.logger.log('Initializing Live Monitoring Service');
    
    // Get enabled state from config
    this.isMonitoringEnabled = this.configService.get('monitoring.liveMonitoring.enabled') !== false;
    
    if (this.isMonitoringEnabled) {
      this.setupEventListeners();
      this.logger.log('Live Monitoring Service initialized');
    } else {
      this.logger.log('Live Monitoring Service is disabled');
    }
  }

  onModuleDestroy() {
    // Close all subjects
    for (const subject of this.eventSubjects.values()) {
      subject.complete();
    }
    this.eventSubjects.clear();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    // Listen for all events
    this.eventEmitter.onAny((event, data) => {
      this.handleEvent(event, data);
    });
  }

  /**
   * Handle incoming event
   */
  private handleEvent(eventType: string, data: any) {
    if (!this.isMonitoringEnabled) {
      return;
    }
    
    try {
      // Increment event counter
      this.eventCounts.set(eventType, (this.eventCounts.get(eventType) || 0) + 1);
      
      // Check if we have subscribers for this event type
      if (this.eventSubjects.has(eventType) && !this.eventSubjects.get(eventType).closed) {
        const subject = this.eventSubjects.get(eventType);
        
        // Apply throttling limits for high-frequency events
        const limit = this.bufferLimits.get(eventType) || 0;
        if (limit > 0) {
          const count = this.eventCounts.get(eventType) || 0;
          if (count % limit !== 0) {
            return; // Skip this event
          }
        }
        
        // Push event to subject
        subject.next({
          type: eventType,
          timestamp: new Date(),
          data
        });
      }
      
      // Push to combined feed
      if (this.eventSubjects.has('all') && !this.eventSubjects.get('all').closed) {
        this.eventSubjects.get('all').next({
          type: eventType,
          timestamp: new Date(),
          data
        });
      }
    } catch (error) {
      this.logger.error(`Error handling event ${eventType}: ${error.message}`, error.stack);
    }
  }

  /**
   * Get event observable for specific event type
   */
  getEventStream(eventType: string): Observable<any> {
    // Create subject if it doesn't exist
    if (!this.eventSubjects.has(eventType)) {
      const subject = new Subject<any>();
      
      // Apply throttling to prevent overwhelming clients
      const throttled = subject.pipe(
        throttleTime(this.bufferIntervalMs)
      );
      
      this.eventSubjects.set(eventType, subject);
    }
    
    return this.eventSubjects.get(eventType).asObservable();
  }

  /**
   * Get combined event stream
   */
  getAllEvents(): Observable<any> {
    if (!this.eventSubjects.has('all')) {
      const subject = new Subject<any>();
      
      // Apply throttling and batching
      const throttled = subject.pipe(
        throttleTime(this.bufferIntervalMs),
        scan((acc, event) => {
          acc.push(event);
          if (acc.length > 100) {
            acc.shift(); // Keep last 100 events
          }
          return acc;
        }, [])
      );
      
      this.eventSubjects.set('all', subject);
    }
    
    return this.eventSubjects.get('all').asObservable();
  }

  /**
   * Get monitoring status
   */
  async getMonitoringStatus() {
    // Get event counts
    const eventTypeCounts = Object.fromEntries(this.eventCounts);
    
    // Get active subscriptions
    const subscriptions = {};
    for (const [eventType, subject] of this.eventSubjects.entries()) {
      subscriptions[eventType] = !subject.closed;
    }
    
    return {
      enabled: this.isMonitoringEnabled,
      stats: {
        eventCounts: eventTypeCounts,
        activeSubscriptions: subscriptions,
        bufferInterval: this.bufferIntervalMs
      }
    };
  }

  /**
   * Enable or disable monitoring
   */
  setMonitoringEnabled(enabled: boolean) {
    this.isMonitoringEnabled = enabled;
    return { enabled };
  }

  /**
   * Clear event counts
   */
  clearEventCounts() {
    this.eventCounts.clear();
    return { success: true };
  }
}