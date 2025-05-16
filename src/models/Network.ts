import { Timestamp } from '@/types/common';

/**
 * Ağdaki bir düğümü (cihaz) temsil eder
 */
export interface NetworkNode {
  id: string;
  name: string;
  type: string;
  category: 'endpoint' | 'network' | 'security' | 'server' | 'iot' | 'unknown';
  status: 'active' | 'inactive' | 'warning' | 'critical';
  ipAddresses: string[];
  macAddress?: string;
  vendor?: string;
  model?: string;
  os?: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  location?: {
    site: string;
    building?: string;
    floor?: string;
    room?: string;
    rack?: string;
    position?: string;
    coordinates?: {
      x: number;
      y: number;
      z?: number;
    };
  };
  interfaces?: {
    id: string;
    name: string;
    type: string;
    ipAddress?: string;
    macAddress?: string;
    speed?: number;
    status: 'up' | 'down';
  }[];
  metrics?: {
    cpu?: number;
    memory?: number;
    diskUsage?: number;
    uptime?: number;
    temperature?: number;
    trafficIn?: number;
    trafficOut?: number;
  };
  vulnerabilities?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  tags: string[];
  notes?: string;
  group?: string;
  parent?: string;
  children?: string[];
  isVirtual?: boolean;
  managementIp?: string;
  managementProtocol?: string;
  alertCount?: number;
  anomalyCount?: number;
  riskScore?: number;
  securityState?: 'secure' | 'vulnerable' | 'compromised' | 'unknown';
  metadata?: Record<string, any>;
  uiProperties?: {
    x?: number;
    y?: number;
    color?: string;
    icon?: string;
    size?: number;
    expanded?: boolean;
    visible?: boolean;
  };
}

/**
 * Ağdaki iki düğüm arasındaki bağlantıyı temsil eder
 */
export interface NetworkLink {
  id: string;
  source: string; // Kaynak düğüm ID
  target: string; // Hedef düğüm ID
  type: 'physical' | 'logical' | 'wireless' | 'virtual' | 'vpn' | 'routing';
  status: 'active' | 'inactive' | 'degraded' | 'failed';
  metrics?: {
    bandwidth?: number;
    utilization?: number;
    latency?: number;
    packetLoss?: number;
    errors?: number;
  };
  interfaces?: {
    sourceInterface: string;
    targetInterface: string;
  };
  protocols?: string[];
  strength?: number; // Bağlantı gücü (0-1)
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  isEncrypted?: boolean;
  isDirectional?: boolean;
  weight?: number;
  trafficVolume?: number;
  metadata?: Record<string, any>;
  uiProperties?: {
    color?: string;
    width?: number;
    dashed?: boolean;
    animated?: boolean;
    label?: string;
    visible?: boolean;
  };
}

/**
 * Ağ haritasını temsil eder
 */
export interface NetworkMap {
  id: string;
  name: string;
  description?: string;
  nodes: NetworkNode[];
  links: NetworkLink[];
  timestamp: Timestamp;
  viewSettings?: {
    layout: 'auto' | 'hierarchical' | 'radial' | 'force';
    focusNode?: string;
    groupBy?: string;
    filterBy?: Record<string, any>;
    expandedGroups?: string[];
    highlightedNodes?: string[];
    highlightedLinks?: string[];
    zoomLevel?: number;
    center?: { x: number; y: number };
  };
  statistics: {
    totalNodes: number;
    activeNodes: number;
    criticalNodes: number;
    totalLinks: number;
    activeLinks: number;
    degradedLinks: number;
    nodesByType: Record<string, number>;
    nodesByCategory: Record<string, number>;
  };
  segments?: {
    id: string;
    name: string;
    cidr?: string;
    nodeIds: string[];
    color?: string;
  }[];
  lastUpdated: Timestamp;
  generatedBy: string;
}

/**
 * İki düğüm arasındaki ağ yolunu temsil eder
 */
export interface NetworkPath {
  id: string;
  source: NetworkNode;
  target: NetworkNode;
  hops: {
    node: NetworkNode;
    inInterface?: string;
    outInterface?: string;
    delay?: number;
  }[];
  status: 'active' | 'inactive' | 'partial' | 'unreachable';
  totalHops: number;
  latency?: number;
  protocol?: string;
  mtu?: number;
  metrics?: {
    packetLoss?: number;
    jitter?: number;
    bandwidth?: number;
  };
  timestamps: {
    requested: Timestamp;
    completed: Timestamp;
  };
  isAsync: boolean;
  isComplete: boolean;
  errorMessage?: string;
}

/**
 * Cihaz tipini temsil eder
 */
export interface DeviceType {
  id: string;
  name: string;
  category: 'endpoint' | 'network' | 'security' | 'server' | 'iot' | 'unknown';
  description: string;
  icon: string;
  defaultColor: string;
  properties: {
    key: string;
    name: string;
    type: string;
    isRequired: boolean;
  }[];
  detectionRules?: {
    field: string;
    operator: string;
    value: any;
  }[];
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';
  tags?: string[];
}