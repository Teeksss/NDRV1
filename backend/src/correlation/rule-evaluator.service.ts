import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CorrelationRule } from './schemas/correlation-rule.schema';
import { LoggerService } from '../logger/logger.service';
import { EventsService } from '../events/events.service';
import { AlertsService } from '../alerts/alerts.service';
import * as moment from 'moment';

interface EvaluationContext {
  rule: CorrelationRule;
  events: any[];
  entity?: any;
  variables: Record<string, any>;
  alertData?: any;
}

@Injectable()
export class RuleEvaluatorService {
  constructor(
    private logger: LoggerService,
    private eventsService: EventsService,
    private alertsService: AlertsService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Evaluate a correlation rule against event(s)
   */
  async evaluateRule(rule: CorrelationRule, triggeringEvent: any): Promise<boolean> {
    try {
      this.logger.debug(`Evaluating rule ${rule.id} (${rule.name}) for event ${triggeringEvent.id}`, 'RuleEvaluatorService');

      // Create initial evaluation context
      const context: EvaluationContext = {
        rule,
        events: [triggeringEvent],
        variables: {
          event: triggeringEvent,
          timestamp: new Date(),
        },
      };

      // Get entity data if an entity is associated with the event
      if (triggeringEvent.entityId) {
        context.entity = { id: triggeringEvent.entityId };
        context.variables.entityId = triggeringEvent.entityId;
      }

      // Evaluate rule based on type
      let result = false;
      switch (rule.type) {
        case 'simple':
          result = await this.evaluateSimpleRule(context);
          break;
        case 'threshold':
          result = await this.evaluateThresholdRule(context);
          break;
        case 'sequence':
          result = await this.evaluateSequenceRule(context);
          break;
        case 'aggregation':
          result = await this.evaluateAggregationRule(context);
          break;
        case 'pattern':
          result = await this.evaluatePatternRule(context);
          break;
        default:
          this.logger.warn(`Unknown rule type: ${rule.type}`, 'RuleEvaluatorService');
          return false;
      }

      // If rule matched, generate alert
      if (result) {
        await this.generateAlert(context);
      }

      // Emit evaluation event for metrics and tracking
      this.eventEmitter.emit('correlation.rule.evaluated', {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        eventId: triggeringEvent.id,
        matched: result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error evaluating rule ${rule.id} (${rule.name}): ${error.message}`,
        error.stack,
        'RuleEvaluatorService'
      );
      return false;
    }
  }

  /**
   * Evaluate a simple rule (single event match)
   */
  private async evaluateSimpleRule(context: EvaluationContext): Promise<boolean> {
    const { rule, events } = context;
    const event = events[0]; // Simple rules only look at the triggering event

    try {
      // Check if event matches conditions
      const conditionsMet = await this.evaluateConditions(rule.conditions, event, context);

      return conditionsMet;
    } catch (error) {
      this.logger.error(`Error evaluating simple rule: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Evaluate a threshold rule (count of matching events)
   */
  private async evaluateThresholdRule(context: EvaluationContext): Promise<boolean> {
    const { rule, events } = context;
    const event = events[0];
    const config = rule.config || {};

    try {
      // Get threshold parameters
      const threshold = config.threshold || 5;
      const timeWindow = config.timeWindow || 60; // seconds
      const groupBy = config.groupBy || null;

      // Build query to find matching events
      const startDate = moment().subtract(timeWindow, 'seconds').toDate();
      const endDate = new Date();

      let query: any = {
        startDate,
        endDate,
        limit: threshold + 1, // Get one more than threshold to optimize
      };

      // Add entity filter if specified
      if (config.sameEntity && event.entityId) {
        query.entityId = event.entityId;
      }

      // Add type filter if specified
      if (config.eventType) {
        query.type = config.eventType;
      }

      // Add source filter if specified
      if (config.eventSource) {
        query.source = config.eventSource;
      }

      // Get matching events
      const matchingEvents = await this.eventsService.findAll(query);

      // Count events that match the conditions
      let matchCount = 0;
      const groupCounts = new Map<string, number>();

      for (const evt of matchingEvents.data) {
        const conditionsMet = await this.evaluateConditions(rule.conditions, evt, {
          ...context,
          events: [evt],
        });

        if (conditionsMet) {
          matchCount++;

          // Track group counts if grouping is enabled
          if (groupBy) {
            const groupValue = evt[groupBy] || 'unknown';
            groupCounts.set(groupValue, (groupCounts.get(groupValue) || 0) + 1);
          }
        }
      }

      // Check if threshold is met
      if (groupBy) {
        // For grouped events, at least one group must meet the threshold
        for (const [group, count] of groupCounts.entries()) {
          if (count >= threshold) {
            // Add group information to the context for alert generation
            context.variables.groupValue = group;
            context.variables.groupCount = count;
            return true;
          }
        }
        return false;
      } else {
        // For non-grouped events, total count must meet threshold
        context.variables.eventCount = matchCount;
        return matchCount >= threshold;
      }
    } catch (error) {
      this.logger.error(`Error evaluating threshold rule: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Evaluate a sequence rule (specific order of events)
   */
  private async evaluateSequenceRule(context: EvaluationContext): Promise<boolean> {
    const { rule, events } = context;
    const triggeringEvent = events[0];
    const config = rule.config || {};

    try {
      // Get sequence parameters
      const timeWindow = config.timeWindow || 300; // seconds
      const startDate = moment().subtract(timeWindow, 'seconds').toDate();
      const endDate = new Date();

      // Get sequence steps
      const steps = config.sequence || [];
      if (steps.length === 0) {
        return false;
      }

      // Check if the triggering event matches the last step
      const lastStep = steps[steps.length - 1];
      const lastStepMatches = await this.evaluateConditions(lastStep.conditions, triggeringEvent, context);

      if (!lastStepMatches) {
        return false;
      }

      // Query for previous events
      let query: any = {
        startDate,
        endDate,
        limit: 1000, // High limit to ensure we get enough events
        sort: 'timestamp',
        order: 'asc',
      };

      // Add entity filter if specified
      if (config.sameEntity && triggeringEvent.entityId) {
        query.entityId = triggeringEvent.entityId;
      }

      // Get events in the time window
      const eventsResult = await this.eventsService.findAll(query);
      const timeWindowEvents = eventsResult.data;

      // Find events for each step in the sequence
      const matchedEvents = [triggeringEvent]; // Last step already matched
      let remainingSteps = steps.slice(0, -1).reverse();

      for (let i = timeWindowEvents.length - 1; i >= 0 && remainingSteps.length > 0; i--) {
        const event = timeWindowEvents[i];
        
        // Skip the current triggering event
        if (event.id === triggeringEvent.id) {
          continue;
        }

        // Check if this event matches the current step
        const step = remainingSteps[0];
        const stepMatches = await this.evaluateConditions(step.conditions, event, {
          ...context,
          events: [event],
        });

        if (stepMatches) {
          // Match found for this step
          matchedEvents.unshift(event);
          remainingSteps.shift();
        }
      }

      // Sequence matches if we found events for all steps
      if (remainingSteps.length === 0) {
        // Add matched events to context for alert generation
        context.events = matchedEvents;
        context.variables.matchedEvents = matchedEvents;
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error evaluating sequence rule: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Evaluate an aggregation rule (statistical analysis)
   */
  private async evaluateAggregationRule(context: EvaluationContext): Promise<boolean> {
    const { rule, events } = context;
    const event = events[0];
    const config = rule.config || {};

    try {
      // Get aggregation parameters
      const timeWindow = config.timeWindow || 300; // seconds
      const aggregationType = config.aggregationType || 'count';
      const fieldName = config.fieldName || null;
      const operator = config.operator || 'gt';
      const threshold = config.threshold || 0;
      const groupBy = config.groupBy || null;

      // Build query to find events for aggregation
      const startDate = moment().subtract(timeWindow, 'seconds').toDate();
      const endDate = new Date();

      let query: any = {
        startDate,
        endDate,
        limit: 1000, // High limit to ensure we get enough events
      };

      // Add entity filter if specified
      if (config.sameEntity && event.entityId) {
        query.entityId = event.entityId;
      }

      // Add type filter if specified
      if (config.eventType) {
        query.type = config.eventType;
      }

      // Get events for aggregation
      const eventsResult = await this.eventsService.findAll(query);
      const aggregationEvents = eventsResult.data;

      // Apply conditions filter to the events
      const filteredEvents = [];
      for (const evt of aggregationEvents) {
        const conditionsMet = await this.evaluateConditions(rule.conditions, evt, {
          ...context,
          events: [evt],
        });

        if (conditionsMet) {
          filteredEvents.push(evt);
        }
      }

      // Perform aggregation
      if (aggregationType === 'count') {
        // Count aggregation
        if (groupBy) {
          // Group by specific field
          const groups = new Map<string, number>();
          for (const evt of filteredEvents) {
            const groupValue = evt[groupBy] || 'unknown';
            groups.set(groupValue, (groups.get(groupValue) || 0) + 1);
          }

          // Check if any group meets the threshold
          for (const [group, count] of groups.entries()) {
            if (this.compareValue(count, threshold, operator)) {
              // Add group information to the context for alert generation
              context.variables.groupValue = group;
              context.variables.groupCount = count;
              return true;
            }
          }
          return false;
        } else {
          // Simple count
          const count = filteredEvents.length;
          context.variables.eventCount = count;
          return this.compareValue(count, threshold, operator);
        }
      } else if (fieldName) {
        // Other aggregation types need a field to operate on
        let result: number;
        
        // Extract values
        const values = filteredEvents
          .map(evt => evt[fieldName])
          .filter(val => val !== undefined && val !== null && !isNaN(Number(val)))
          .map(val => Number(val));

        // Calculate aggregation
        switch (aggregationType) {
          case 'avg':
            result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'sum':
            result = values.reduce((a, b) => a + b, 0);
            break;
          case 'min':
            result = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            result = values.length > 0 ? Math.max(...values) : 0;
            break;
          default:
            this.logger.warn(`Unknown aggregation type: ${aggregationType}`, 'RuleEvaluatorService');
            return false;
        }

        // Add aggregation result to context
        context.variables.aggregationResult = result;
        context.variables.aggregationType = aggregationType;
        context.variables.fieldName = fieldName;

        // Compare result to threshold
        return this.compareValue(result, threshold, operator);
      }

      return false;
    } catch (error) {
      this.logger.error(`Error evaluating aggregation rule: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Evaluate a pattern rule (complex patterns across events)
   */
  private async evaluatePatternRule(context: EvaluationContext): Promise<boolean> {
    const { rule, events } = context;
    const event = events[0];
    const config = rule.config || {};

    try {
      // Get pattern parameters
      const timeWindow = config.timeWindow || 600; // seconds
      const pattern = config.pattern || '';
      const patternType = config.patternType || 'regex';

      // Build query to find events for pattern matching
      const startDate = moment().subtract(timeWindow, 'seconds').toDate();
      const endDate = new Date();

      let query: any = {
        startDate,
        endDate,
        limit: 1000, // High limit to ensure we get enough events
        sort: 'timestamp',
        order: 'asc',
      };

      // Add entity filter if specified
      if (config.sameEntity && event.entityId) {
        query.entityId = event.entityId;
      }

      // Get events in the time window
      const eventsResult = await this.eventsService.findAll(query);
      const timeWindowEvents = [...eventsResult.data, event]; // Include current event

      // Apply conditions filter to the events
      const filteredEvents = [];
      for (const evt of timeWindowEvents) {
        const conditionsMet = await this.evaluateConditions(rule.conditions, evt, {
          ...context,
          events: [evt],
        });

        if (conditionsMet) {
          filteredEvents.push(evt);
        }
      }

      // Generate the event sequence string based on the pattern type
      let eventSequence = '';
      if (patternType === 'regex' || patternType === 'simple') {
        // For regex patterns, we'll create a string representation of events
        const field = config.field || 'type';
        eventSequence = filteredEvents.map(evt => evt[field] || '').join(',');
      }

      // Match pattern
      let patternMatched = false;
      if (patternType === 'regex') {
        try {
          const regex = new RegExp(pattern);
          patternMatched = regex.test(eventSequence);
        } catch (error) {
          this.logger.error(`Invalid regex pattern: ${pattern}`, error.stack, 'RuleEvaluatorService');
          return false;
        }
      } else if (patternType === 'simple') {
        // Simple pattern matching with wildcards
        patternMatched = this.matchSimplePattern(eventSequence, pattern);
      }

      if (patternMatched) {
        // Add matched events to context for alert generation
        context.events = filteredEvents;
        context.variables.matchedEvents = filteredEvents;
        context.variables.eventSequence = eventSequence;
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error evaluating pattern rule: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Generate an alert from a correlation match
   */
  private async generateAlert(context: EvaluationContext): Promise<void> {
    const { rule, events, variables } = context;

    try {
      // Build alert payload
      const alertData = {
        title: this.interpolateTemplate(rule.alertTemplate?.title || `${rule.name} Alert`, variables),
        description: this.interpolateTemplate(rule.alertTemplate?.description || rule.description || '', variables),
        severity: rule.severity,
        source: 'correlation_engine',
        type: rule.type,
        status: 'open',
        eventIds: events.map(event => event.id),
        timestamp: new Date(),
        payload: {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          variables,
        },
      };

      // Add entity information if available
      if (events[0].entityId) {
        alertData['entityId'] = events[0].entityId;
      }

      // Add MITRE ATT&CK information if available
      if (rule.mitre?.tactic) {
        alertData['tactic'] = rule.mitre.tactic;
      }
      if (rule.mitre?.technique) {
        alertData['technique'] = rule.mitre.technique;
      }

      // Store alert data in context for access by other methods
      context.alertData = alertData;

      // Create the alert
      const alert = await this.alertsService.create(alertData);
      this.logger.log(`Generated alert ${alert.id} from rule ${rule.id}`, 'RuleEvaluatorService');

      // Update rule statistics
      this.eventEmitter.emit('correlation.rule.triggered', {
        ruleId: rule.id,
        alertId: alert.id,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error generating alert for rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
    }
  }

  /**
   * Evaluate conditions against an event
   */
  private async evaluateConditions(conditions: any[], event: any, context: EvaluationContext): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means it matches
    }

    try {
      // Get the logical operator (default to AND)
      const logicalOperator = conditions[0]?.logicalOperator?.toLowerCase() || 'and';

      // For AND logic, all conditions must be true
      // For OR logic, at least one condition must be true
      let result = logicalOperator === 'and';

      for (const condition of conditions) {
        // Handle nested condition groups
        if (condition.conditions) {
          const nestedResult = await this.evaluateConditions(condition.conditions, event, context);
          
          if (logicalOperator === 'and') {
            // AND: if any condition is false, the result is false
            if (!nestedResult) {
              return false;
            }
          } else {
            // OR: if any condition is true, the result is true
            if (nestedResult) {
              return true;
            }
          }
          
          continue;
        }

        // Skip the logicalOperator entry
        if (condition.logicalOperator) {
          continue;
        }

        // Evaluate a single condition
        const conditionResult = this.evaluateCondition(condition, event, context);

        if (logicalOperator === 'and') {
          // AND: if any condition is false, the result is false
          if (!conditionResult) {
            return false;
          }
        } else {
          // OR: if any condition is true, the result is true
          if (conditionResult) {
            return true;
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error evaluating conditions: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: any, event: any, context: EvaluationContext): boolean {
    try {
      const { field, operator, value } = condition;

      // Get actual field value from event
      // Handle nested fields with dot notation
      let actualValue = this.getFieldValue(event, field);

      // Special handling for null/undefined values
      if (actualValue === undefined || actualValue === null) {
        if (operator === 'exists') {
          return false;
        } else if (operator === 'notExists') {
          return true;
        } else if (operator === 'eq' || operator === '==' || operator === '===') {
          return value === null || value === undefined || value === 'null' || value === 'undefined';
        } else if (operator === 'neq' || operator === '!=' || operator === '!==') {
          return value !== null && value !== undefined && value !== 'null' && value !== 'undefined';
        }
        
        // Most other operations on null/undefined will return false
        return false;
      }
      
      // Type conversions
      if (typeof value === 'string' && typeof actualValue === 'number') {
        // Try to convert string value to number for comparison
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          return this.compareValue(actualValue, numValue, operator);
        }
      } else if (typeof value === 'number' && typeof actualValue === 'string') {
        // Try to convert string field value to number
        const numActualValue = Number(actualValue);
        if (!isNaN(numActualValue)) {
          return this.compareValue(numActualValue, value, operator);
        }
      }
      
      // Compare based on operator
      return this.compareValue(actualValue, value, operator);
    } catch (error) {
      this.logger.error(`Error evaluating condition: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Get field value, supporting nested properties with dot notation
   */
  private getFieldValue(obj: any, field: string): any {
    if (!field) return undefined;
    
    // Handle direct properties
    if (!field.includes('.')) {
      return obj[field];
    }
    
    // Handle nested properties
    const parts = field.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }

  /**
   * Compare values based on operator
   */
  private compareValue(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'eq':
      case '==':
      case '===':
        return actual == expected;
      
      case 'neq':
      case '!=':
      case '!==':
        return actual != expected;
      
      case 'gt':
      case '>':
        return actual > expected;
      
      case 'gte':
      case '>=':
        return actual >= expected;
      
      case 'lt':
      case '<':
        return actual < expected;
      
      case 'lte':
      case '<=':
        return actual <= expected;
      
      case 'in':
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        if (typeof expected === 'string' && typeof actual === 'string') {
          return expected.split(',').map(v => v.trim()).includes(actual);
        }
        return false;
      
      case 'nin':
      case 'notIn':
        if (Array.isArray(expected)) {
          return !expected.includes(actual);
        }
        if (typeof expected === 'string' && typeof actual === 'string') {
          return !expected.split(',').map(v => v.trim()).includes(actual);
        }
        return true;
      
      case 'contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.toLowerCase().includes(expected.toLowerCase());
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return false;
      
      case 'notContains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return !actual.toLowerCase().includes(expected.toLowerCase());
        }
        if (Array.isArray(actual)) {
          return !actual.includes(expected);
        }
        return true;
      
      case 'startsWith':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.toLowerCase().startsWith(expected.toLowerCase());
        }
        return false;
      
      case 'endsWith':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.toLowerCase().endsWith(expected.toLowerCase());
        }
        return false;
      
      case 'match':
      case 'regex':
        if (typeof actual === 'string' && typeof expected === 'string') {
          try {
            const regex = new RegExp(expected);
            return regex.test(actual);
          } catch (error) {
            this.logger.error(`Invalid regex pattern: ${expected}`, error.stack, 'RuleEvaluatorService');
            return false;
          }
        }
        return false;
      
      case 'exists':
        return actual !== undefined && actual !== null;
      
      case 'notExists':
        return actual === undefined || actual === null;
        
      default:
        this.logger.warn(`Unknown operator: ${operator}`, 'RuleEvaluatorService');
        return false;
    }
  }

  /**
   * Simple pattern matching with wildcards
   */
  private matchSimplePattern(text: string, pattern: string): boolean {
    // Convert simple pattern to regex
    // * matches any sequence of characters
    // ? matches any single character
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(text);
    } catch (error) {
      this.logger.error(`Invalid simple pattern: ${pattern}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  /**
   * Interpolate a template string with variables
   */
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    if (!template) {
      return '';
    }

    try {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = this.getVariableValue(variables, path.trim());
        return value !== undefined ? String(value) : match;
      });
    } catch (error) {
      this.logger.error(`Error interpolating template: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return template;
    }
  }

  /**
   * Get variable value from path (supports dot notation)
   */
  private getVariableValue(variables: Record<string, any>, path: string): any {
    // Split path by dots to handle nested properties
    const parts = path.split('.');
    let value = variables;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
}