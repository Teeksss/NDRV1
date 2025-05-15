export const CORRELATION_RULE_TYPES = [
  'simple',
  'threshold',
  'sequence',
  'aggregation',
  'pattern',
  'behavioral'
];

export const CORRELATION_RULE_CATEGORIES = [
  'authentication',
  'authorization',
  'network',
  'system',
  'application',
  'malware',
  'data',
  'cloud',
  'endpoint',
  'lateral-movement',
  'persistence',
  'privilege-escalation',
  'execution',
  'exfiltration',
  'initial-access',
  'command-and-control',
  'defense-evasion',
  'reconnaissance',
  'resource-development',
  'impact',
  'vulnerability',
  'configuration',
  'miscellaneous'
];

export const CORRELATION_SEVERITY_LEVELS = [
  'critical',
  'high',
  'medium',
  'low',
  'info'
];

export const CORRELATION_ACTION_TYPES = [
  'create_alert',
  'update_entity',
  'send_notification'
];

export const CORRELATION_CONDITION_OPERATORS = [
  'eq',        // equals
  'neq',       // not equals
  'gt',        // greater than
  'gte',       // greater than or equal
  'lt',        // less than
  'lte',       // less than or equal
  'contains',  // string contains
  'notContains', // string does not contain
  'startsWith', // string starts with
  'endsWith',  // string ends with
  'matches',   // regex match
  'in',        // value in array
  'notIn',     // value not in array
  'exists',    // field exists
  'notExists'  // field does not exist
];

export const CORRELATION_AGGREGATION_TYPES = [
  'count',
  'sum',
  'average',
  'max',
  'min',
  'distinct'
];

export const CORRELATION_PATTERN_TYPES = [
  'frequency',
  'flow',
  'timeseries',
  'graph'
];

export const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access' },
  { id: 'TA0002', name: 'Execution' },
  { id: 'TA0003', name: 'Persistence' },
  { id: 'TA0004', name: 'Privilege Escalation' },
  { id: 'TA0005', name: 'Defense Evasion' },
  { id: 'TA0006', name: 'Credential Access' },
  { id: 'TA0007', name: 'Discovery' },
  { id: 'TA0008', name: 'Lateral Movement' },
  { id: 'TA0009', name: 'Collection' },
  { id: 'TA0010', name: 'Exfiltration' },
  { id: 'TA0011', name: 'Command and Control' },
  { id: 'TA0040', name: 'Impact' },
  { id: 'TA0042', name: 'Resource Development' },
  { id: 'TA0043', name: 'Reconnaissance' }
];

export const EVENTS_TTL_DEFAULT = 24 * 60 * 60; // 24 hours in seconds
export const MAX_QUEUE_SIZE_DEFAULT = 10000;
export const EVALUATION_THREADS_DEFAULT = 4;