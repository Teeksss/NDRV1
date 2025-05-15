import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CorrelationRule, CorrelationRuleDocument } from './schemas/correlation-rule.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CorrelationMetricsService {
  private ruleMetrics: Map<string, {
    evaluations: number;
    matches: number;
    triggers: number;
    totalEvaluationTime: number;
    avgEvaluationTime: number;
    lastEvaluationTime: Date;
  }> = new Map();

  constructor(
    @InjectModel(CorrelationRule.name) private correlationRuleModel: Model<CorrelationRuleDocument>,
    private logger: LoggerService
  ) {}

  recordRuleEvaluation(ruleId: string, evaluationTimeMs: number, matched: boolean) {
    // Get or initialize metrics for this rule
    if (!this.ruleMetrics.has(ruleId)) {
      this.ruleMetrics.set(ruleId, {
        evaluations: 0,
        matches: 0,
        triggers: 0,
        totalEvaluationTime: 0,
        avgEvaluationTime: 0,
        lastEvaluationTime: new Date()
      });
    }
    
    const metrics = this.ruleMetrics.get(ruleId)!;
    
    // Update metrics
    metrics.evaluations++;
    metrics.totalEvaluationTime += evaluationTimeMs;
    metrics.avgEvaluationTime = metrics.totalEvaluationTime / metrics.evaluations;
    metrics.lastEvaluationTime = new Date();
    
    if (matched) {
      metrics.matches++;
    }
  }

  recordRuleTrigger(ruleId: string) {
    // Get or initialize metrics for this rule
    if (!this.ruleMetrics.has(ruleId)) {
      this.ruleMetrics.set(ruleId, {
        evaluations: 0,
        matches: 0,
        triggers: 0,
        totalEvaluationTime: 0,
        avgEvaluationTime: 0,
        lastEvaluationTime: new Date()
      });
    }
    
    const metrics = this.ruleMetrics.get(ruleId)!;
    
    // Update metrics
    metrics.triggers++;
  }

  async getMetrics(startDate?: string, endDate?: string) {
    try {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      // Get metrics from rules in database
      const aggregateMatch: any = {};
      
      if (start || end) {
        aggregateMatch.lastTriggeredAt = {};
        if (start) {
          aggregateMatch.lastTriggeredAt.$gte = start;
        }
        if (end) {
          aggregateMatch.lastTriggeredAt.$lte = end;
        }
      }
      
      const dbMetrics = await this.correlationRuleModel.aggregate([
        { $match: aggregateMatch },
        {
          $group: {
            _id: null,
            totalRules: { $sum: 1 },
            enabledRules: { $sum: { $cond: [{ $eq: ['$enabled', true] }, 1, 0] } },
            totalTriggers: { $sum: '$triggerCount' },
            byType: {
              $push: {
                type: '$type',
                enabled: '$enabled',
                triggerCount: '$triggerCount'
              }
            },
            bySeverity: {
              $push: {
                severity: '$severity',
                enabled: '$enabled',
                triggerCount: '$triggerCount'
              }
            }
          }
        }
      ]).exec();
      
      // Process by-type statistics
      const rulesByType: Record<string, { total: number, enabled: number, triggers: number }> = {};
      const rulesBySeverity: Record<string, { total: number, enabled: number, triggers: number }> = {};
      
      if (dbMetrics.length > 0) {
        for (const item of dbMetrics[0].byType) {
          if (!rulesByType[item.type]) {
            rulesByType[item.type] = { total: 0, enabled: 0, triggers: 0 };
          }
          
          rulesByType[item.type].total++;
          rulesByType[item.type].triggers += item.triggerCount || 0;
          
          if (item.enabled) {
            rulesByType[item.type].enabled++;
          }
        }
        
        for (const item of dbMetrics[0].bySeverity) {
          if (!rulesBySeverity[item.severity]) {
            rulesBySeverity[item.severity] = { total: 0, enabled: 0, triggers: 0 };
          }
          
          rulesBySeverity[item.severity].total++;
          rulesBySeverity[item.severity].triggers += item.triggerCount || 0;
          
          if (item.enabled) {
            rulesBySeverity[item.severity].enabled++;
          }
        }
      }
      
      // Calculate runtime metrics
      let totalEvaluations = 0;
      let totalMatches = 0;
      let totalTriggers = 0;
      let totalEvaluationTime = 0;
      
      for (const metrics of this.ruleMetrics.values()) {
        totalEvaluations += metrics.evaluations;
        totalMatches += metrics.matches;
        totalTriggers += metrics.triggers;
        totalEvaluationTime += metrics.totalEvaluationTime;
      }
      
      const avgEvaluationTime = totalEvaluations > 0 
        ? totalEvaluationTime / totalEvaluations 
        : 0;
      
      return {
        timestamp: new Date(),
        timeRange: {
          start: start || null,
          end: end || null
        },
        rules: {
          total: dbMetrics[0]?.totalRules || 0,
          enabled: dbMetrics[0]?.enabledRules || 0,
          byType: rulesByType,
          bySeverity: rulesBySeverity
        },
        engine: {
          evaluations: totalEvaluations,
          matches: totalMatches,
          triggers: totalTriggers,
          avgEvaluationTime,
          matchRate: totalEvaluations > 0 ? (totalMatches / totalEvaluations) * 100 : 0,
          triggerRate: totalMatches > 0 ? (totalTriggers / totalMatches) * 100 : 0
        }
      };
    } catch (error) {
      this.logger.error(`Error getting correlation metrics: ${error.message}`, error.stack, 'CorrelationMetricsService');
      
      // Return empty metrics on error
      return {
        timestamp: new Date(),
        timeRange: {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate) : null
        },
        rules: {
          total: 0,
          enabled: 0,
          byType: {},
          bySeverity: {}
        },
        engine: {
          evaluations: 0,
          matches: 0,
          triggers: 0,
          avgEvaluationTime: 0,
          matchRate: 0,
          triggerRate: 0
        }
      };
    }
  }

  async getRuleMetrics(startDate?: string, endDate?: string, limit: number = 10) {
    try {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      // Query to get rule metrics
      const match: any = {};
      
      if (start || end) {
        match.lastTriggeredAt = {};
        if (start) {
          match.lastTriggeredAt.$gte = start;
        }
        if (end) {
          match.lastTriggeredAt.$lte = end;
        }
      }
      
      const topRules = await this.correlationRuleModel
        .find(match)
        .sort({ triggerCount: -1 })
        .limit(limit)
        .select('id name type severity triggerCount lastTriggeredAt enabled')
        .exec();
      
      // Enhance with runtime metrics
      const enhancedRules = topRules.map(rule => {
        const runtimeMetrics = this.ruleMetrics.get(rule.id) || {
          evaluations: 0,
          matches: 0,
          triggers: 0,
          avgEvaluationTime: 0,
          lastEvaluationTime: null
        };
        
        return {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          severity: rule.severity,
          enabled: rule.enabled,
          triggerCount: rule.triggerCount,
          lastTriggeredAt: rule.lastTriggeredAt,
          runtime: {
            evaluations: runtimeMetrics.evaluations,
            matches: runtimeMetrics.matches,
            triggers: runtimeMetrics.triggers,
            avgEvaluationTime: runtimeMetrics.avgEvaluationTime,
            lastEvaluationTime: runtimeMetrics.lastEvaluationTime,
            hitRate: runtimeMetrics.evaluations > 0 
              ? (runtimeMetrics.matches / runtimeMetrics.evaluations) * 100 
              : 0
          }
        };
      });
      
      return {
        timestamp: new Date(),
        timeRange: {
          start: start || null,
          end: end || null
        },
        rules: enhancedRules
      };
    } catch (error) {
      this.logger.error(`Error getting rule metrics: ${error.message}`, error.stack, 'CorrelationMetricsService');
      
      // Return empty metrics on error
      return {
        timestamp: new Date(),
        timeRange: {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate) : null
        },
        rules: []
      };
    }
  }

  // Reset metrics (useful for testing or manual reset)
  resetMetrics() {
    this.ruleMetrics.clear();
  }
}