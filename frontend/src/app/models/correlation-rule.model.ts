export interface CorrelationRule {
  id: string;
  name: string;
  description?: string;
  type: 'simple' | 'threshold' | 'sequence' | 'aggregation' | 'pattern';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  enabled: boolean;
  conditions: RuleCondition[];
  config?: any;
  alertTemplate?: {
    title: string;
    description: string;
  };
  mitre?: {
    tactic: string;
    technique: string;
  };
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  triggerCount?: number;
}

export interface RuleCondition {
  logicalOperator?: 'and' | 'or';
  field?: string;
  operator?: string;
  value?: any;
  conditions?: RuleCondition[];
}