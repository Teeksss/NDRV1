export interface Alert {
  id: string;
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'false_positive';
  source: string;
  type?: string;
  entityId?: string;
  eventIds?: string[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
  assignedTo?: string;
  tactic?: string;
  technique?: string;
  payload?: any;
}