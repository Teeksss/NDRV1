import { Injectable } from '@nestjs/common';
import { CorrelationRule } from '../schemas/correlation-rule.schema';
import { PatternMatcherService } from './pattern-matcher.service';
import { ConditionBuilderService } from './condition-builder.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class RuleEvaluatorService {
  constructor(
    private patternMatcherService: PatternMatcherService,
    private conditionBuilderService: ConditionBuilderService,
    private logger: LoggerService
  ) {}

  async evaluateRule(rule: CorrelationRule, context: any): Promise<{ matched: boolean; details: any }> {
    try {
      // Select the appropriate evaluation method based on rule type
      switch (rule.type) {
        case 'threshold':
          return this.evaluateThresholdRule(rule, context);
        case 'sequence':
          return this.evaluateSequenceRule(rule, context);
        case 'aggregation':
          return this.evaluateAggregationRule(rule, context);
        case 'pattern':
          return this.evaluatePatternRule(rule, context);
        case 'behavioral':
          return this.evaluateBehavioralRule(rule, context);
        case 'simple':
          return this.evaluateSimpleRule(rule, context);
        default:
          return { matched: false, details: { error: 'Unknown rule type' } };
      }
    } catch (error) {
      this.logger.error(`Error evaluating rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async evaluateThresholdRule(rule: CorrelationRule, context: any): Promise<{ matched: boolean; details: any }> {
    const { currentEvent, relatedEvents } = context;
    
    // Get time window for threshold rule
    const timeWindow = rule.timeWindow || 3600; // default 1 hour in seconds
    const timeThreshold = new Date(Date.now() - timeWindow * 1000);
    
    // Initialize return details
    const details = {
      thresholdCount: rule.threshold || 5,
      matchedCount: 0,
      timeWindow,
      events: []
    };
    
    try {
      // Check if conditions match the current event
      const currentEventMatch = await this.evaluateConditions(rule.conditions, currentEvent);
      
      if (!currentEventMatch) {
        return { matched: false, details };
      }
      
      // Filter related events within time window
      const eventsInWindow = relatedEvents.filter(event => 
        new Date(event.timestamp) >= timeThreshold
      );
      
      // Count matching events within window
      let matchingEvents = [currentEvent];
      
      for (const event of eventsInWindow) {
        const matches = await this.evaluateConditions(rule.conditions, event);
        if (matches) {
          matchingEvents.push(event);
        }
      }
      
      // Update details
      details.matchedCount = matchingEvents.length;
      details.events = matchingEvents.map(e => e.id);
      
      // Check if we've reached the threshold
      return {
        matched: matchingEvents.length >= rule.threshold,
        details
      };
    } catch (error) {
      this.logger.error(`Error evaluating threshold rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async evaluateSequenceRule(rule: CorrelationRule, context: any): Promise<{ matched: boolean; details: any }> {
    // For sequence rules, we check if a specific sequence of events has occurred
    const { currentEvent, relatedEvents } = context;
    
    // Get time window
    const timeWindow = rule.timeWindow || 3600; // default 1 hour in seconds
    const timeThreshold = new Date(Date.now() - timeWindow * 1000);
    
    // Check if rule has sequential stages defined
    if (!rule.sequence || !Array.isArray(rule.sequence) || rule.sequence.length === 0) {
      return { 
        matched: false, 
        details: { error: 'Sequence rule does not have properly defined sequence stages' } 
      };
    }
    
    try {
      // Prepare all events including current event
      const allEvents = [...relatedEvents, currentEvent]
        .filter(event => new Date(event.timestamp) >= timeThreshold)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Track which events match each sequence stage
      const stageMatches = [];
      
      // For each stage in the sequence
      for (let stageIndex = 0; stageIndex < rule.sequence.length; stageIndex++) {
        const stage = rule.sequence[stageIndex];
        let stageMatched = false;
        
        // Find the first event that matches this stage and comes after all previous stages
        const previousStageLastEventIndex = stageIndex > 0 && stageMatches[stageIndex - 1].length > 0 
          ? allEvents.indexOf(stageMatches[stageIndex - 1][stageMatches[stageIndex - 1].length - 1])
          : -1;
        
        const matchingEvents = [];
        
        for (let i = previousStageLastEventIndex + 1; i < allEvents.length; i++) {
          const event = allEvents[i];
          const matches = await this.evaluateConditions(stage.conditions, event);
          
          if (matches) {
            matchingEvents.push(event);
            stageMatched = true;
            
            // If we don't need multiple matches for this stage, break
            if (!stage.multipleMatches) {
              break;
            }
          }
        }
        
        // Store matches for this stage
        stageMatches.push(matchingEvents);
        
        // If any stage doesn't match, the sequence doesn't match
        if (!stageMatched) {
          return {
            matched: false,
            details: {
              stages: rule.sequence.map((s, idx) => ({
                name: s.name || `Stage ${idx + 1}`,
                matched: idx < stageIndex,
                events: idx < stageIndex ? stageMatches[idx].map(e => e.id) : []
              })),
              currentStage: stageIndex + 1,
              totalStages: rule.sequence.length
            }
          };
        }
      }
      
      // If we get here, all stages matched in sequence
      return {
        matched: true,
        details: {
          stages: rule.sequence.map((s, idx) => ({
            name: s.name || `Stage ${idx + 1}`,
            matched: true,
            events: stageMatches[idx].map(e => e.id)
          })),
          currentStage: rule.sequence.length,
          totalStages: rule.sequence.length
        }
      };
    } catch (error) {
      this.logger.error(`Error evaluating sequence rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async evaluateAggregationRule(rule: CorrelationRule, context: any): Promise<{ matched: boolean; details: any }> {
    // Aggregation rules look for a pattern across multiple events, computing aggregated values
    const { currentEvent, relatedEvents } = context;
    
    // Get time window
    const timeWindow = rule.timeWindow || 3600; // default 1 hour in seconds
    const timeThreshold = new Date(Date.now() - timeWindow * 1000);
    
    try {
      // First check if the current event matches the trigger conditions
      const currentEventMatch = await this.evaluateConditions(rule.conditions, currentEvent);
      
      if (!currentEventMatch) {
        return { matched: false, details: { matchedTrigger: false } };
      }
      
      // Prepare all relevant events for analysis
      const relevantEvents = relatedEvents
        .filter(event => new Date(event.timestamp) >= timeThreshold);
      
      // Compute aggregations
      const aggregations = [];
      
      for (const agg of rule.aggregations || []) {
        let result: any = null;
        
        switch (agg.type) {
          case 'count':
            result = this.computeCount(relevantEvents, agg);
            break;
          case 'sum':
            result = this.computeSum(relevantEvents, agg);
            break;
          case 'average':
            result = this.computeAverage(relevantEvents, agg);
            break;
          case 'max':
            result = this.computeMax(relevantEvents, agg);
            break;
          case 'min':
            result = this.computeMin(relevantEvents, agg);
            break;
          case 'distinct':
            result = this.computeDistinct(relevantEvents, agg);
            break;
          default:
            this.logger.warn(`Unknown aggregation type: ${agg.type}`, 'RuleEvaluatorService');
            continue;
        }
        
        aggregations.push({
          name: agg.name,
          type: agg.type,
          field: agg.field,
          value: result,
          threshold: agg.threshold,
          operator: agg.operator,
          matched: this.compareAggregation(result, agg.threshold, agg.operator)
        });
      }
      
      // Check if all aggregations passed
      const allAggregationsMatched = aggregations.every(agg => agg.matched);
      
      return {
        matched: allAggregationsMatched,
        details: {
          matchedTrigger: true,
          aggregations,
          relevantEventsCount: relevantEvents.length,
          timeWindow
        }
      };
    } catch (error) {
      this.logger.error(`Error evaluating aggregation rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async evaluatePatternRule(rule: CorrelationRule, context: any): Promise<{ matched: boolean; details: any }> {
    // Pattern rules use the pattern matcher to identify complex patterns
    const { currentEvent, relatedEvents } = context;
    
    try {
      // Use pattern matcher to evaluate rule
      return this.patternMatcherService.matchPattern(rule, currentEvent, relatedEvents);
    } catch (error) {
      this.logger.error(`Error evaluating pattern rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async evaluateBehavioralRule(rule: CorrelationRule, context: any): Promise<{ matched: boolean; details: any }> {
    // Behavioral rules compare current behavior to established baselines
    // This is a simplified implementation - in a real system, this would use machine learning models
    
    const { currentEvent } = context;
    
    try {
      // For demo purposes, just check if event matches conditions
      const matches = await this.evaluateConditions(rule.conditions, currentEvent);
      
      return {
        matched: matches,
        details: {
          message: 'Behavioral rule evaluation is simplified in demo',
          matchedConditions: matches
        }
      };
    } catch (error) {
      this.logger.error(`Error evaluating behavioral rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async evaluateSimpleRule(rule: CorrelationRule, context: any): Promise<{ matched: boolean; details: any }> {
    // Simple rules just check conditions on the current event
    const { currentEvent } = context;
    
    try {
      const matches = await this.evaluateConditions(rule.conditions, currentEvent);
      
      return {
        matched: matches,
        details: {
          event: currentEvent.id,
          matchedConditions: matches
        }
      };
    } catch (error) {
      this.logger.error(`Error evaluating simple rule ${rule.id}: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async evaluateConditions(conditions: any[], event: any): Promise<boolean> {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return false;
    }
    
    try {
      const conditionFunction = this.conditionBuilderService.buildConditionFunction(conditions);
      return conditionFunction(event);
    } catch (error) {
      this.logger.error(`Error evaluating conditions: ${error.message}`, error.stack, 'RuleEvaluatorService');
      return false;
    }
  }

  // Helper methods for aggregation calculations
  private computeCount(events: any[], aggregation: any): number {
    if (aggregation.filters && aggregation.filters.length > 0) {
      // Filter events based on condition
      const conditionFunction = this.conditionBuilderService.buildConditionFunction(aggregation.filters);
      const filteredEvents = events.filter(event => conditionFunction(event));
      return filteredEvents.length;
    }
    
    return events.length;
  }

  private computeSum(events: any[], aggregation: any): number {
    const { field, filters } = aggregation;
    let filteredEvents = events;
    
    if (filters && filters.length > 0) {
      const conditionFunction = this.conditionBuilderService.buildConditionFunction(filters);
      filteredEvents = events.filter(event => conditionFunction(event));
    }
    
    return filteredEvents.reduce((sum, event) => {
      const value = this.getFieldValue(event, field);
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  private computeAverage(events: any[], aggregation: any): number {
    const { field, filters } = aggregation;
    let filteredEvents = events;
    
    if (filters && filters.length > 0) {
      const conditionFunction = this.conditionBuilderService.buildConditionFunction(filters);
      filteredEvents = events.filter(event => conditionFunction(event));
    }
    
    if (filteredEvents.length === 0) {
      return 0;
    }
    
    const sum = filteredEvents.reduce((total, event) => {
      const value = this.getFieldValue(event, field);
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return sum / filteredEvents.length;
  }

  private computeMax(events: any[], aggregation: any): number {
    const { field, filters } = aggregation;
    let filteredEvents = events;
    
    if (filters && filters.length > 0) {
      const conditionFunction = this.conditionBuilderService.buildConditionFunction(filters);
      filteredEvents = events.filter(event => conditionFunction(event));
    }
    
    if (filteredEvents.length === 0) {
      return 0;
    }
    
    return Math.max(...filteredEvents.map(event => {
      const value = this.getFieldValue(event, field);
      return typeof value === 'number' ? value : 0;
    }));
  }

  private computeMin(events: any[], aggregation: any): number {
    const { field, filters } = aggregation;
    let filteredEvents = events;
    
    if (filters && filters.length > 0) {
      const conditionFunction = this.conditionBuilderService.buildConditionFunction(filters);
      filteredEvents = events.filter(event => conditionFunction(event));
    }
    
    if (filteredEvents.length === 0) {
      return 0;
    }
    
    return Math.min(...filteredEvents.map(event => {
      const value = this.getFieldValue(event, field);
      return typeof value === 'number' ? value : 0;
    }));
  }

  private computeDistinct(events: any[], aggregation: any): number {
    const { field, filters } = aggregation;
    let filteredEvents = events;
    
    if (filters && filters.length > 0) {
      const conditionFunction = this.conditionBuilderService.buildConditionFunction(filters);
      filteredEvents = events.filter(event => conditionFunction(event));
    }
    
    if (filteredEvents.length === 0) {
      return 0;
    }
    
    const distinctValues = new Set(
      filteredEvents.map(event => {
        const value = this.getFieldValue(event, field);
        return value !== undefined ? String(value) : null;
      }).filter(value => value !== null)
    );
    
    return distinctValues.size;
  }

  private compareAggregation(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'eq':
        return value === threshold;
      case 'neq':
        return value !== threshold;
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  private getFieldValue(obj: any, path: string): any {
    if (!path) return undefined;
    
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      
      value = value[part];
    }
    
    return value;
  }
}