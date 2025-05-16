export interface SecurityReport {
    id?: string;
    summary: ReportSummary;
    details: ReportDetails;
    recommendations: ReportRecommendation[];
    metrics: ReportMetrics;
    metadata: ReportMetadata;
    timestamp: string;
    serviceInfo: ServiceInfo;
}

export interface ReportSummary {
    overallStatus: 'healthy' | 'warning' | 'critical';
    criticalFindings: CriticalFinding[];
    riskLevel: number;
    timeframe: string;
    generatedAt: string;
}

export interface CriticalFinding {
    id: string;
    type: string;
    severity: 'high' | 'critical';
    description: string;
    detectedAt: string;
    status: 'open' | 'investigating' | 'mitigated';
}

export interface ReportDetails {
    threatAnalysis: ThreatAnalysis;
    securityMetrics: SecurityMetricsDetail;
    complianceStatus: ComplianceStatus;
    incidents: IncidentSummary[];
}

export interface ThreatAnalysis {
    totalThreats: number;
    criticalThreats: number;
    threatsByCategory: Record<string, number>;
    trendAnalysis: {
        direction: 'increasing' | 'stable' | 'decreasing';
        percentage: number;
        period: string;
    };
}

export interface SecurityMetricsDetail {
    overallScore: number;
    metrics: {
        name: string;
        value: number;
        threshold: number;
        status: 'good' | 'warning' | 'critical';
    }[];
    trends: {
        metric: string;
        values: number[];
        timestamps: string[];
    }[];
}

export interface ComplianceStatus {
    overallCompliance: number;
    frameworks: {
        name: string;
        compliance: number;
        criticalIssues: number;
        lastAssessed: string;
    }[];
}

export interface IncidentSummary {
    id: string;
    type: string;
    severity: string;
    status: string;
    detectedAt: string;
    resolvedAt?: string;
    impact: string;
}

export interface ReportRecommendation {
    priority: 'low' | 'medium' | 'high';
    category: string;
    action: string;
    impact: string;
    deadline: string;
    resources?: string[];
    estimatedEffort?: string;
}

export interface ReportMetrics {
    performance: PerformanceMetrics;
    security: SecurityMetrics;
    trends: TrendMetrics;
}

export interface PerformanceMetrics {
    responseTime: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
    };
    score: number;
}

export interface SecurityMetrics {
    threatCount: number;
    criticalVulnerabilities: number;
    failedLogins: number;
    incidentResponseTime?: number;
    patchStatus?: number;
}

export interface TrendMetrics {
    threatTrend: 'increasing' | 'stable' | 'decreasing';
    securityScore: number;
    riskTrend: {
        current: number;
        previous: number;
        change: number;
    };
}

export interface ReportMetadata {
    version: string;
    generator: string;
    timestamp: string;
    tags?: string[];
    categories?: string[];
}

export interface ReportOptions {
    timeframe: string;
    includeMetrics?: boolean;
    detailLevel?: 'summary' | 'detailed' | 'full';
    format?: 'standard' | 'compliance' | 'executive';
}

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
    type?: string;
    severity?: string[];
    limit?: number;
}

export interface ExportedReport {
    data: string;
    format: ExportFormat;
    timestamp: string;
    serviceInfo: ServiceInfo;
}

export type ExportFormat = 'pdf' | 'csv' | 'json';

export interface ServiceInfo {
    timestamp: string;
    maintainer: string;
    version: string;
    buildNumber: string;
}