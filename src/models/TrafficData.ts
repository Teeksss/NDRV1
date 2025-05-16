import { Timestamp } from '@/types/common';

/**
 * Zaman serisi trafik verisini temsil eder
 */
export interface TrafficData {
  timestamp: Timestamp;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  activeConnections: number;
  newConnections: number;
  closedConnections: number;
  droppedPackets?: number;
  retransmittedPackets?: number;
  latency?: number;
  deviceId?: string;
  interfaceId?: string;
}

/**
 * Trafik özet verilerini temsil eder
 */
export interface TrafficSummary {
  timeRange: string;
  startTime: Timestamp;
  endTime: Timestamp;
  totalBytes: number;
  totalPackets: number;
  averageBandwidth: number;
  peakBandwidth: number;
  totalConnections: number;
  uniqueSourceIps: number;
  uniqueDestinationIps: number;
  protocolCount: number;
  anomalyCount: number;
  
  // UI için biçimlendirilmiş veriler
  formattedTotalBytes?: string;
  formattedDateRange?: string;
}

/**
 * Protokol trafik verilerini temsil eder
 */
export interface TrafficProtocol {
  protocol: string;
  bytes: number;
  percentage: number;
  packets: number;
  connections: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  previousPeriodPercentage?: number;
  color?: string; // UI için renk kodu
}

/**
 * Kaynak IP trafik verilerini temsil eder
 */
export interface TrafficSource {
  ip: string;
  hostname?: string;
  bytes: number;
  packets: number;
  connections: number;
  protocols: string[];
  country?: string;
  asn?: string;
  organization?: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  isInternal: boolean;
  riskScore?: number;
}

/**
 * Hedef IP trafik verilerini temsil eder
 */
export interface TrafficDestination extends TrafficSource {
  port?: number;
  service?: string;
}

/**
 * Trafik akışını temsil eder
 */
export interface TrafficFlow {
  id: string;
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  protocol: string;
  bytes: number;
  packets: number;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration: number;
  isActive: boolean;
  deviceId?: string;
  interfaceId?: string;
  application?: string;
  category?: string;
  riskScore?: number;
}

/**
 * Trafik anomalisini temsil eder
 */
export interface TrafficAnomaly {
  id: string;
  timestamp: Timestamp;
  type: 'bandwidth' | 'protocol' | 'connection' | 'scan' | 'dns' | 'other';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  sourceIp?: string;
  destinationIp?: string;
  protocol?: string;
  port?: number;
  expectedValue: number;
  actualValue: number;
  deviationPercentage: number;
  confidenceScore: number;
  relatedAlerts?: string[];
  isFalsePositive?: boolean;
  isReviewed?: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
}

/**
 * Bant genişliği kullanım istatistiklerini temsil eder
 */
export interface BandwidthUsage {
  timestamp: Timestamp;
  inbound: number;
  outbound: number;
  total: number;
  averageUtilization: number;
  peakUtilization: number;
  deviceId?: string;
  interfaceId?: string;
}

/**
 * Uygulamanın trafik verilerini temsil eder
 */
export interface ApplicationTraffic {
  application: string;
  category: string;
  bytes: number;
  percentage: number;
  uniqueUsers: number;
  riskScore?: number;
  isBlocked?: boolean;
  detectionMethod: 'port' | 'protocol' | 'signature' | 'ml';
}