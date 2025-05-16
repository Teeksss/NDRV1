export interface SecurityConfig {
    features: SecurityFeatures;
    thresholds: SecurityThresholds;
    monitoring: MonitoringConfig;
    alerts: AlertConfig;
    serviceInfo: ServiceInfo;
}

export interface SecurityFeatures {
    realTimeMonitoring: boolean;
    mlDetection: boolean;
    automatedResponse: boolean;
    threatIntelligence: boolean;
}

export interface SecurityThresholds {
    minConfidenceScore: number;
    maxResponseTime: number;
    criticalSeverityLevel: number;
}

export interface MonitoringConfig {
    enabled: boolean;
    interval: number;
    retentionPeriod: number;
    metrics: MetricsConfig;
}

export interface MetricsConfig {
    collection: boolean;
    storageType: 'memory' | 'database';
    aggregationInterval: number;
}

export interface AlertConfig {
    enabled: boolean;
    channels: string[];
    autoEscalation: boolean;
    retentionDays: number;
}

export interface ServiceInfo {
    timestamp: string;
    maintainer: string;
    version: string;
    buildNumber: string;
}