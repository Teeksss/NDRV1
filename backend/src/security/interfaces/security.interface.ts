export interface SecurityStatus {
    timestamp: string;
    status: 'normal' | 'warning' | 'critical';
    metrics: any;
    activeAlerts: number;
    systemHealth: number;
    serviceInfo: ServiceInfo;
}

export interface SecurityMetrics {
    timestamp: string;
    data: any[];
    aggregates: any;
    serviceInfo: ServiceInfo;
}

export interface SecurityAlert {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: string;
    status: 'active' | 'acknowledged' | 'resolved';
    creator: string;
    metadata: Record<string, any>;
}

export interface ServiceInfo {
    timestamp: string;
    maintainer: string;
    version: string;
    buildNumber: string;
}

export interface MetricsQuery {
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
}

export interface CreateAlertDto {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metadata?: Record<string, any>;
}

export interface UpdateAlertDto {
    status?: 'active' | 'acknowledged' | 'resolved';
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
}

export interface SystemStatus {
    level: 'normal' | 'warning' | 'critical';
    health: number;
}