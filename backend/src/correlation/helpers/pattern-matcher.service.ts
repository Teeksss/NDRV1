import { Injectable } from '@nestjs/common';
import { CorrelationRule } from '../schemas/correlation-rule.schema';
import { ConditionBuilderService } from './condition-builder.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class PatternMatcherService {
  constructor(
    private conditionBuilderService: ConditionBuilderService,
    private logger: LoggerService
  ) {}

  async matchPattern(rule: CorrelationRule, currentEvent: any, relatedEvents: any[]): Promise<{ matched: boolean; details: any }> {
    try {
      // Each pattern type requires a specific algorithm
      if (!rule.pattern || !rule.pattern.type) {
        return { 
          matched: false,
          details: { error: 'Pattern rule does not have pattern type defined' }
        };
      }
      
      switch (rule.pattern.type) {
        case 'frequency':
          return this.matchFrequencyPattern(rule, currentEvent, relatedEvents);
        case 'flow':
          return this.matchFlowPattern(rule, currentEvent, relatedEvents);
        case 'timeseries':
          return this.matchTimeSeriesPattern(rule, currentEvent, relatedEvents);
        case 'graph':
          return this.matchGraphPattern(rule, currentEvent, relatedEvents);
        default:
          return { 
            matched: false,
            details: { error: `Unknown pattern type: ${rule.pattern.type}` }
          };
      }
    } catch (error) {
      this.logger.error(`Error matching pattern for rule ${rule.id}: ${error.message}`, error.stack, 'PatternMatcherService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async matchFrequencyPattern(rule: CorrelationRule, currentEvent: any, relatedEvents: any[]): Promise<{ matched: boolean; details: any }> {
    // Frequency patterns look for occurrences of events matching conditions, grouped by a key
    // For example: "5 failed logins for the same user in 10 minutes"
    
    const timeWindow = rule.timeWindow || 3600; // default 1 hour in seconds
    const timeThreshold = new Date(Date.now() - timeWindow * 1000);
    
    try {
      // Get the grouping key and threshold from pattern
      const groupByField = rule.pattern.groupBy || 'entityId';
      const thresholdCount = rule.pattern.threshold || 5;
      
      // Check if current event matches trigger condition
      const currentEventMatch = this.evaluateConditions(rule.conditions, currentEvent);
      
      if (!currentEventMatch) {
        return { matched: false, details: { matchedTrigger: false } };
      }
      
      // Filter events in time window
      const eventsInWindow = [currentEvent, ...relatedEvents].filter(event => 
        new Date(event.timestamp) >= timeThreshold
      );
      
      // Filter events matching conditions
      const matchingEvents = eventsInWindow.filter(event => 
        this.evaluateConditions(rule.conditions, event)
      );
      
      // Group by the specified field
      const groups = new Map();
      
      for (const event of matchingEvents) {
        const groupValue = this.getFieldValue(event, groupByField);
        
        if (!groupValue) continue;
        
        const key = String(groupValue);
        
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        
        groups.get(key).push(event);
      }
      
      // Find groups that exceed the threshold
      const matchingGroups = [];
      
      for (const [key, events] of groups.entries()) {
        if (events.length >= thresholdCount) {
          matchingGroups.push({
            key,
            count: events.length,
            events: events.map(e => e.id)
          });
        }
      }
      
      // Return results
      return {
        matched: matchingGroups.length > 0,
        details: {
          matchedTrigger: true,
          pattern: 'frequency',
          groupBy: groupByField,
          threshold: thresholdCount,
          timeWindow,
          matchingGroups,
          totalMatchingEvents: matchingEvents.length
        }
      };
    } catch (error) {
      this.logger.error(`Error matching frequency pattern: ${error.message}`, error.stack, 'PatternMatcherService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async matchFlowPattern(rule: CorrelationRule, currentEvent: any, relatedEvents: any[]): Promise<{ matched: boolean; details: any }> {
    // Flow patterns detect sequences of events with specific relationships
    // This is a simplified implementation showing the basics
    
    try {
      // Get flow pattern parameters
      const sourceField = rule.pattern.sourceField || 'sourceIp';
      const targetField = rule.pattern.targetField || 'destinationIp';
      const flowLength = rule.pattern.flowLength || 3;
      
      // Check if current event matches trigger condition
      const currentEventMatch = this.evaluateConditions(rule.conditions, currentEvent);
      
      if (!currentEventMatch) {
        return { matched: false, details: { matchedTrigger: false } };
      }
      
      // Identify potential flows starting from the current event
      const flows = this.identifyFlows(
        currentEvent,
        relatedEvents,
        sourceField,
        targetField,
        flowLength,
        rule.conditions
      );
      
      // Return results
      return {
        matched: flows.length > 0,
        details: {
          matchedTrigger: true,
          pattern: 'flow',
          sourceField,
          targetField,
          flowLength,
          flows,
          totalFlows: flows.length
        }
      };
    } catch (error) {
      this.logger.error(`Error matching flow pattern: ${error.message}`, error.stack, 'PatternMatcherService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async matchTimeSeriesPattern(rule: CorrelationRule, currentEvent: any, relatedEvents: any[]): Promise<{ matched: boolean; details: any }> {
    // Time series patterns look for specific trends or anomalies in time series data
    // This is a simplified implementation showing the basics
    
    try {
      // Get time series pattern parameters
      const valueField = rule.pattern.valueField || 'value';
      const timeField = rule.pattern.timeField || 'timestamp';
      const patternType = rule.pattern.trendType || 'spike';
      const sensitivity = rule.pattern.sensitivity || 2.0;
      
      // Check if current event matches trigger condition
      const currentEventMatch = this.evaluateConditions(rule.conditions, currentEvent);
      
      if (!currentEventMatch) {
        return { matched: false, details: { matchedTrigger: false } };
      }
      
      // Prepare time series data
      const timeSeriesData = this.prepareTimeSeriesData(
        [currentEvent, ...relatedEvents],
        valueField,
        timeField,
        rule.conditions
      );
      
      // Detect pattern based on type
      let patternDetected = false;
      let patternDetails = {};
      
      switch (patternType) {
        case 'spike':
          const spikeResult = this.detectSpike(timeSeriesData, sensitivity);
          patternDetected = spikeResult.detected;
          patternDetails = spikeResult.details;
          break;
        case 'drop':
          const dropResult = this.detectDrop(timeSeriesData, sensitivity);
          patternDetected = dropResult.detected;
          patternDetails = dropResult.details;
          break;
        case 'trend':
          const trendResult = this.detectTrend(timeSeriesData, sensitivity);
          patternDetected = trendResult.detected;
          patternDetails = trendResult.details;
          break;
        default:
          return { 
            matched: false,
            details: { error: `Unknown time series pattern type: ${patternType}` }
          };
      }
      
      // Return results
      return {
        matched: patternDetected,
        details: {
          matchedTrigger: true,
          pattern: 'timeseries',
          valueField,
          trendType: patternType,
          sensitivity,
          dataPoints: timeSeriesData.length,
          ...patternDetails
        }
      };
    } catch (error) {
      this.logger.error(`Error matching time series pattern: ${error.message}`, error.stack, 'PatternMatcherService');
      return { matched: false, details: { error: error.message } };
    }
  }

  private async matchGraphPattern(rule: CorrelationRule, currentEvent: any, relatedEvents: any[]): Promise<{ matched: boolean; details: any }> {
    // Graph patterns look for specific topologies or structures in relationships between events
    // This is a simplified implementation showing the basics
    
    try {
      // Get graph pattern parameters
      const nodeIdField = rule.pattern.nodeIdField || 'entityId';
      const edgeSourceField = rule.pattern.edgeSourceField || 'sourceId';
      const edgeTargetField = rule.pattern.edgeTargetField || 'targetId';
      const patternStructure = rule.pattern.structure || 'star';
      
      // Check if current event matches trigger condition
      const currentEventMatch = this.evaluateConditions(rule.conditions, currentEvent);
      
      if (!currentEventMatch) {
        return { matched: false, details: { matchedTrigger: false } };
      }
      
      // Build graph from events
      const graph = this.buildGraph(
        [currentEvent, ...relatedEvents],
        nodeIdField,
        edgeSourceField,
        edgeTargetField,
        rule.conditions
      );
      
      // Detect graph pattern
      let patternDetected = false;
      let patternDetails = {};
      
      switch (patternStructure) {
        case 'star':
          const starResult = this.detectStarPattern(graph, currentEvent[nodeIdField]);
          patternDetected = starResult.detected;
          patternDetails = starResult.details;
          break;
        case 'cycle':
          const cycleResult = this.detectCyclePattern(graph);
          patternDetected = cycleResult.detected;
          patternDetails = cycleResult.details;
          break;
        case 'bipartite':
          const bipartiteResult = this.detectBipartitePattern(graph);
          patternDetected = bipartiteResult.detected;
          patternDetails = bipartiteResult.details;
          break;
        default:
          return { 
            matched: false,
            details: { error: `Unknown graph pattern structure: ${patternStructure}` }
          };
      }
      
      // Return results
      return {
        matched: patternDetected,
        details: {
          matchedTrigger: true,
          pattern: 'graph',
          structure: patternStructure,
          nodes: graph.nodes.size,
          edges: graph.edges.length,
          ...patternDetails
        }
      };
    } catch (error) {
      this.logger.error(`Error matching graph pattern: ${error.message}`, error.stack, 'PatternMatcherService');
      return { matched: false, details: { error: error.message } };
    }
  }

  // Helper methods for flow detection
  private identifyFlows(
    startEvent: any,
    events: any[],
    sourceField: string,
    targetField: string,
    flowLength: number,
    conditions: any[]
  ): any[] {
    const flows = [];
    const startValue = this.getFieldValue(startEvent, targetField);
    
    if (!startValue) return flows;
    
    // Find potential next hops (events where sourceField matches startEvent's targetField)
    const nextEvents = events.filter(event => {
      const sourceValue = this.getFieldValue(event, sourceField);
      return sourceValue === startValue && this.evaluateConditions(conditions, event);
    });
    
    if (flowLength <= 1) {
      // If we've reached desired flow length, return current flows
      return nextEvents.map(event => ({
        nodes: [startEvent, event],
        path: [startEvent.id, event.id]
      }));
    }
    
    // For each next hop, recursively find flows
    for (const nextEvent of nextEvents) {
      const remainingEvents = events.filter(e => e.id !== nextEvent.id);
      
      const subFlows = this.identifyFlows(
        nextEvent,
        remainingEvents,
        sourceField,
        targetField,
        flowLength - 1,
        conditions
      );
      
      // Add current event to the beginning of each subflow
      for (const subFlow of subFlows) {
        flows.push({
          nodes: [startEvent, ...subFlow.nodes],
          path: [startEvent.id, ...subFlow.path]
        });
      }
    }
    
    return flows;
  }

  // Helper methods for time series analysis
  private prepareTimeSeriesData(
    events: any[],
    valueField: string,
    timeField: string,
    conditions: any[]
  ): { time: Date, value: number }[] {
    // Filter events matching conditions
    const matchingEvents = events.filter(event => 
      this.evaluateConditions(conditions, event)
    );
    
    // Extract time series data
    const timeSeriesData = matchingEvents.map(event => ({
      time: new Date(this.getFieldValue(event, timeField)),
      value: Number(this.getFieldValue(event, valueField)) || 0,
      id: event.id
    }));
    
    // Sort by time
    return timeSeriesData.sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  private detectSpike(
    timeSeriesData: { time: Date, value: number }[],
    sensitivity: number
  ): { detected: boolean, details: any } {
    if (timeSeriesData.length < 3) {
      return { detected: false, details: { reason: "Not enough data points" } };
    }
    
    // Calculate moving average and standard deviation
    const windowSize = Math.max(3, Math.floor(timeSeriesData.length / 3));
    const movingStats = this.calculateMovingStats(timeSeriesData.map(d => d.value), windowSize);
    
    // Look for spikes (values > mean + sensitivity * std)
    const spikes = [];
    
    for (let i = windowSize; i < timeSeriesData.length; i++) {
      const { mean, stdDev } = movingStats[i - windowSize];
      const threshold = mean + sensitivity * stdDev;
      
      if (timeSeriesData[i].value > threshold) {
        spikes.push({
          time: timeSeriesData[i].time,
          value: timeSeriesData[i].value,
          mean,
          stdDev,
          threshold,
          deviation: (timeSeriesData[i].value - mean) / stdDev
        });
      }
    }
    
    return {
      detected: spikes.length > 0,
      details: {
        spikes,
        spikeCount: spikes.length,
        sensitivity
      }
    };
  }

  private detectDrop(
    timeSeriesData: { time: Date, value: number }[],
    sensitivity: number
  ): { detected: boolean, details: any } {
    if (timeSeriesData.length < 3) {
      return { detected: false, details: { reason: "Not enough data points" } };
    }
    
    // Calculate moving average and standard deviation
    const windowSize = Math.max(3, Math.floor(timeSeriesData.length / 3));
    const movingStats = this.calculateMovingStats(timeSeriesData.map(d => d.value), windowSize);
    
    // Look for drops (values < mean - sensitivity * std)
    const drops = [];
    
    for (let i = windowSize; i < timeSeriesData.length; i++) {
      const { mean, stdDev } = movingStats[i - windowSize];
      const threshold = mean - sensitivity * stdDev;
      
      if (timeSeriesData[i].value < threshold) {
        drops.push({
          time: timeSeriesData[i].time,
          value: timeSeriesData[i].value,
          mean,
          stdDev,
          threshold,
          deviation: (mean - timeSeriesData[i].value) / stdDev
        });
      }
    }
    
    return {
      detected: drops.length > 0,
      details: {
        drops,
        dropCount: drops.length,
        sensitivity
      }
    };
  }

  private detectTrend(
    timeSeriesData: { time: Date, value: number }[],
    sensitivity: number
  ): { detected: boolean, details: any } {
    if (timeSeriesData.length < 5) {
      return { detected: false, details: { reason: "Not enough data points" } };
    }
    
    // Calculate linear regression
    const xValues = timeSeriesData.map((d, i) => i);
    const yValues = timeSeriesData.map(d => d.value);
    
    const { slope, intercept, r2 } = this.linearRegression(xValues, yValues);
    
    // Determine if trend is significant based on r² and sensitivity
    const isTrendSignificant = r2 > 0.5 && Math.abs(slope) > sensitivity;
    const trendDirection = slope > 0 ? 'increasing' : 'decreasing';
    
    return {
      detected: isTrendSignificant,
      details: {
        trend: isTrendSignificant ? trendDirection : 'none',
        slope,
        intercept,
        r2,
        dataPoints: timeSeriesData.length,
        startValue: timeSeriesData[0].value,
        endValue: timeSeriesData[timeSeriesData.length - 1].value,
        changePercent: ((timeSeriesData[timeSeriesData.length - 1].value - timeSeriesData[0].value) / timeSeriesData[0].value) * 100
      }
    };
  }

  // Helper methods for graph analysis
  private buildGraph(
    events: any[],
    nodeIdField: string,
    edgeSourceField: string,
    edgeTargetField: string,
    conditions: any[]
  ): { nodes: Map<string, any>, edges: { source: string, target: string, event: any }[] } {
    // Filter events matching conditions
    const matchingEvents = events.filter(event => 
      this.evaluateConditions(conditions, event)
    );
    
    const nodes = new Map();
    const edges = [];
    
    // Extract nodes and edges
    for (const event of matchingEvents) {
      const sourceId = this.getFieldValue(event, edgeSourceField);
      const targetId = this.getFieldValue(event, edgeTargetField);
      const nodeId = this.getFieldValue(event, nodeIdField);
      
      if (nodeId) {
        nodes.set(String(nodeId), event);
      }
      
      if (sourceId && targetId) {
        edges.push({
          source: String(sourceId),
          target: String(targetId),
          event
        });
      }
    }
    
    return { nodes, edges };
  }

  private detectStarPattern(
    graph: { nodes: Map<string, any>, edges: { source: string, target: string, event: any }[] },
    centerNodeId: string
  ): { detected: boolean, details: any } {
    if (!centerNodeId) {
      return { detected: false, details: { reason: "No center node ID provided" } };
    }
    
    // Count edges connected to center node
    const connectedEdges = graph.edges.filter(edge => 
      edge.source === String(centerNodeId) || edge.target === String(centerNodeId)
    );
    
    // A star pattern has at least 3 connections to center
    const isStarPattern = connectedEdges.length >= 3;
    
    return {
      detected: isStarPattern,
      details: {
        centerNode: centerNodeId,
        connections: connectedEdges.length,
        connectedNodes: [...new Set([
          ...connectedEdges.map(e => e.source),
          ...connectedEdges.map(e => e.target)
        ])].filter(id => id !== String(centerNodeId))
      }
    };
  }

  private detectCyclePattern(
    graph: { nodes: Map<string, any>, edges: { source: string, target: string, event: any }[] }
  ): { detected: boolean, details: any } {
    // Simple cycle detection - this is a basic implementation
    // A more sophisticated implementation would use depth-first search
    
    if (graph.edges.length < 3) {
      return { detected: false, details: { reason: "Not enough edges for a cycle" } };
    }
    
    // Build adjacency list
    const adjacencyList = new Map();
    
    for (const edge of graph.edges) {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source).push(edge.target);
    }
    
    // Check for cycles (simplified implementation)
    const visited = new Set();
    const path = new Set();
    
    for (const node of adjacencyList.keys()) {
      if (this.hasCycle(node, adjacencyList, visited, path)) {
        return {
          detected: true,
          details: {
            cycleNodes: Array.from(path)
          }
        };
      }
    }
    
    return { detected: false, details: { reason: "No cycle found" } };
  }

  private hasCycle(
    node: string,
    adjacencyList: Map<string, string[]>,
    visited: Set<string>,
    path: Set<string>
  ): boolean {
    if (path.has(node)) {
      return true;
    }
    
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    path.add(node);
    
    const neighbors = adjacencyList.get(node) || [];
    
    for (const neighbor of neighbors) {
      if (this.hasCycle(neighbor, adjacencyList, visited, path)) {
        return true;
      }
    }
    
    path.delete(node);
    return false;
  }

  private detectBipartitePattern(
    graph: { nodes: Map<string, any>, edges: { source: string, target: string, event: any }[] }
  ): { detected: boolean, details: any } {
    // Bipartite check is simplified - a proper implementation would use breadth-first search
    if (graph.edges.length < 2) {
      return { detected: false, details: { reason: "Not enough edges" } };
    }
    
    // For this demo, assume it's a bipartite pattern if there are two distinct sets of nodes
    const sourceNodes = new Set(graph.edges.map(e => e.source));
    const targetNodes = new Set(graph.edges.map(e => e.target));
    
    // Check if there's no overlap between source and target nodes
    const overlap = Array.from(sourceNodes).filter(node => targetNodes.has(node));
    const isBipartite = overlap.length === 0;
    
    return {
      detected: isBipartite,
      details: {
        sourceNodes: Array.from(sourceNodes),
        targetNodes: Array.from(targetNodes),
        isBipartite,
        overlap
      }
    };
  }

  // Statistical helpers
  private calculateMovingStats(values: number[], windowSize: number): { mean: number, stdDev: number }[] {
    const result = [];
    
    for (let i = 0; i <= values.length - windowSize; i++) {
      const window = values.slice(i, i + windowSize);
      const mean = window.reduce((sum, val) => sum + val, 0) / windowSize;
      const squaredDiffs = window.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / windowSize;
      const stdDev = Math.sqrt(variance);
      
      result.push({ mean, stdDev });
    }
    
    return result;
  }

  private linearRegression(x: number[], y: number[]): { slope: number, intercept: number, r2: number } {
    const n = x.length;
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      totalSumSquares += Math.pow(y[i] - yMean, 2);
      residualSumSquares += Math.pow(y[i] - predicted, 2);
    }
    
    const r2 = 1 - residualSumSquares / totalSumSquares;
    
    return { slope, intercept, r2 };
  }

  private evaluateConditions(conditions: any[], event: any): boolean {
    const conditionFunction = this.conditionBuilderService.buildConditionFunction(conditions);
    return conditionFunction(event);
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