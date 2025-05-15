import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { AnomalyBaselineService } from '../anomaly-baseline.service';

@Injectable()
export class StatisticalDetector {
  constructor(
    private anomalyBaselineService: AnomalyBaselineService,
    private logger: LoggerService,
  ) {}

  async detectAnomalies(event: any): Promise<any[]> {
    const anomalies = [];
    
    try {
      // Get baselines for statistical detection
      const baselines = await this.anomalyBaselineService.getBaselines('statistical');
      
      // Perform Z-score analysis for numeric values if applicable
      if (event.value !== undefined && typeof event.value === 'number') {
        const zScoreResult = this.performZScoreAnalysis(event, baselines);
        if (zScoreResult) {
          anomalies.push(zScoreResult);
        }
      }
      
      // Perform frequency analysis for events
      const frequencyResult = this.performFrequencyAnalysis(event, baselines);
      if (frequencyResult) {
        anomalies.push(frequencyResult);
      }
      
      // Perform time pattern analysis
      const timePatternResult = this.performTimePatternAnalysis(event, baselines);
      if (timePatternResult) {
        anomalies.push(timePatternResult);
      }
      
      return anomalies;
    } catch (error) {
      this.logger.error(
        `Error in statistical anomaly detection: ${error.message}`, 
        error.stack, 
        'StatisticalDetector'
      );
      return [];
    }
  }
  
  private performZScoreAnalysis(event: any, baselines: any): any {
    try {
      // Find appropriate baseline for this event type
      const baseline = baselines.find(b => 
        b.eventType === event.type && 
        b.metricName === 'value' &&
        b.mean !== undefined && 
        b.stdDev !== undefined
      );
      
      if (!baseline || baseline.stdDev === 0) {
        return null;
      }
      
      // Calculate Z-score
      const zScore = Math.abs((event.value - baseline.mean) / baseline.stdDev);
      
      // Convert to score between 0 and 1
      const score = Math.min(zScore / 3, 1);
      
      // If score exceeds threshold, return anomaly detail
      const threshold = 0.7; // Configurable threshold
      
      if (score >= threshold) {
        return {
          type: 'z_score',
          score,
          threshold,
          description: `Unusual value detected for ${event.type}`,
          details: {
            eventType: event.type,
            value: event.value,
            mean: baseline.mean,
            stdDev: baseline.stdDev,
            zScore,
            entityId: event.entityId,
            metric: 'value'
          }
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error(
        `Error performing Z-score analysis: ${error.message}`, 
        error.stack, 
        'StatisticalDetector'
      );
      return null;
    }
  }
  
  private performFrequencyAnalysis(event: any, baselines: any): any {
    try {
      // Find frequency baseline for this entity and event type
      const baseline = baselines.find(b => 
        b.eventType === event.type && 
        (b.entityId === event.entityId || b.entityId === 'global') &&
        b.metricName === 'frequency'
      );
      
      if (!baseline) {
        return null;
      }
      
      // Analyze frequency anomaly
      // For this example, we'll check if the current hour's frequency exceeds the mean + 2*stdDev
      const currentHour = new Date(event.timestamp).getHours();
      const hourlyBaseline = baseline.hourlyDistribution?.[currentHour];
      
      if (!hourlyBaseline || hourlyBaseline.count === 0) {
        return null;
      }
      
      // Get current frequency for this hour and entity
      // This would come from a real-time counter in a full implementation
      const currentFrequency = hourlyBaseline.recentCount || 1;
      
      // Calculate threshold
      const freqThreshold = hourlyBaseline.mean + (2 * hourlyBaseline.stdDev);
      
      // Calculate score
      let score = 0;
      if (freqThreshold > 0) {
        score = Math.min(currentFrequency / freqThreshold, 1);
      }
      
      const threshold = 0.6; // Configurable threshold
      
      if (score >= threshold) {
        return {
          type: 'frequency',
          score,
          threshold,
          description: `Unusual frequency of ${event.type} events detected`,
          details: {
            eventType: event.type,
            entityId: event.entityId,
            currentFrequency,
            expectedFrequency: hourlyBaseline.mean,
            stdDev: hourlyBaseline.stdDev,
            hour: currentHour
          }
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error(
        `Error performing frequency analysis: ${error.message}`, 
        error.stack, 
        'StatisticalDetector'
      );
      return null;
    }
  }
  
  private performTimePatternAnalysis(event: any, baselines: any): any {
    try {
      // Find time pattern baseline for this entity and event type
      const baseline = baselines.find(b => 
        b.eventType === event.type && 
        (b.entityId === event.entityId || b.entityId === 'global') &&
        b.metricName === 'timePattern'
      );
      
      if (!baseline || !baseline.hourlyDistribution) {
        return null;
      }
      
      // Get current hour
      const currentHour = new Date(event.timestamp).getHours();
      
      // Check if this hour is an unusual time for this event type
      const hourProbability = baseline.hourlyDistribution[currentHour]?.probability || 0;
      
      // Calculate score - lower probability = higher anomaly score
      const score = 1 - hourProbability;
      
      const threshold = 0.85; // Configurable threshold
      
      if (score >= threshold) {
        return {
          type: 'time_pattern',
          score,
          threshold,
          description: `Event occurred at unusual time`,
          details: {
            eventType: event.type,
            entityId: event.entityId,
            hour: currentHour,
            probability: hourProbability,
            normalHours: this.getNormalHoursFromBaseline(baseline.hourlyDistribution)
          }
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error(
        `Error performing time pattern analysis: ${error.message}`, 
        error.stack, 
        'StatisticalDetector'
      );
      return null;
    }
  }
  
  private getNormalHoursFromBaseline(hourlyDistribution: any): number[] {
    // Return the hours with highest probability
    const normalHours = [];
    for (let hour = 0; hour < 24; hour++) {
      if (hourlyDistribution[hour]?.probability >= 0.1) {
        normalHours.push(hour);
      }
    }
    return normalHours;
  }
}