export interface Event {
  id: string;
  type: string;
  source: string;
  sourceIp?: string;
  destinationIp?: string;
  protocol?: string;
  port?: number;
  timestamp: string;
  description?: string;
  entityId?: string;
  payload?: any;
  metadata?: any;
  createdAt: string;
}