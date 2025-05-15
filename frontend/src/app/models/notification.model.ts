export interface Notification {
  id: string;
  type: string;
  title?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  userId?: string;
  referenceId?: string;
  referenceType?: string;
  link?: string;
  readAt?: string;
  metadata?: any;
}