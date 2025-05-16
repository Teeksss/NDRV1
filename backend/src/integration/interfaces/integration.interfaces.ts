export interface SystemMetrics {
    cpu: CPUMetrics;
    memory: MemoryMetrics;
    network: NetworkMetrics;
    components: ComponentMetrics[];
}

export interface TestSuite {
    security: SecurityTest[];
    network: NetworkTest[];
    analytics: AnalyticsTest[];
    integration: IntegrationTest[];
}

export interface TestResults {
    security: TestResult[];
    network: TestResult[];
    analytics: TestResult[];
    integration: TestResult[];
}

export interface SystemHealthReport {
    reportId: string;
    timestamp: string;
    metrics: SystemMetrics;
    analysis: MetricsAnalysis;
    recommendations: Recommendation[];
    metadata: ReportMetadata;
}

export interface ComponentStatus {
    name: string;
    status: 'operational' | 'degraded' | 'failed';
    version: string;
    lastChecked: string;
    metrics: ComponentMetrics;
}

export interface ReportMetadata {
    maintainer: string;
    version: string;
    buildNumber: string;
    environment: string;
}