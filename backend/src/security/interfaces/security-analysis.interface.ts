export interface SecurityAnalysis {
    timestamp: string;
    trends: {
        threats: ThreatTrends;
        performance: PerformanceTrends;
        security: SecurityMetricTrends;
    };
    recommendations: Recommendation[];
    serviceInfo: ServiceInfo;
}

export interface ThreatTrends {
    totalThreats: number;
    criticalThreats: number;
    threatDistribution: Record<string, number>;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface PerformanceTrends {
    averageResponseTime: number;
    resourceUsage: ResourceUsage;
    performanceScore: number;
}

export interface SecurityMetricTrends {
    failedLogins: FailedLoginAnalysis;
    suspiciousActivities: SuspiciousActivityAnalysis;
    vulnerabilities: VulnerabilityAnalysis;
}

export interface ResourceUsage {
    cpu: number;
    memory: number;
    network: number;
    disk: number;
}

export interface FailedLoginAnalysis {
    count: number;
    pattern: string;
    riskLevel: number;
}

export interface SuspiciousActivityAnalysis {
    count: number;
    types: Record<string, number>;
    severity: number;
}

export interface VulnerabilityAnalysis {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
}

export interface Recommendation {
    priority: 'low' | 'medium' | 'high';
    category: string;
    action: string;
    impact: string;
}

export interface ServiceInfo {
    timestamp: string;
    maintainer: string;
    version: string;
    buildNumber: string;
}