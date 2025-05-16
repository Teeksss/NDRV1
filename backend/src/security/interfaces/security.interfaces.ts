export interface SecurityConfig {
    version: string;
    timestamp: string;
    maintainer: string;
    buildNumber: string;
    features: SecurityFeatures;
    thresholds: SecurityThresholds;
    monitoring: MonitoringConfig;
    alerts: AlertConfig;
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
    interval: number;
    retentionPeriod: number;
    metricsEnabled: boolean;
}

export interface AlertConfig {
    enabled: boolean;
    notificationChannels: string[];
    autoEscalation: boolean;
    retentionDays: number;
}

export interface ProcessedAlert {
    alertId: string;
    timestamp: string;
    originalAlert: RawAlertData;
    enrichedData: EnrichedAlertData;
    analysis: AlertAnalysis;
    response: AlertResponse;
    status: string;
    metadata: AlertMetadata;
}

export interface AlertMetadata {
    processor: string;
    version: string;
    buildNumber: string;
}

// Diğer interface tanımları...