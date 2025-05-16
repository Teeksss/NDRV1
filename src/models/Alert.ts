import { Severity } from '@/types/severity';

export interface Alert {
  id: string;
  title: string;
  description: string;
  sourceIp: string;
  targetIp: string;
  severity: Severity;
  status: 'open' | 'closed';
  timestamp: string;
  category: string;
  assignedTo?: string;
  resolutionNotes?: string;
  relatedAlerts?: string[];
  metadata?: Record<string, any>;
}