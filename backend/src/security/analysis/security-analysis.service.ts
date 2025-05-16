import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SecurityConfigService } from '../config/security-config.service';
import { SecurityMonitoringService } from '../monitoring/security-monitoring.service';

@Injectable()
export class SecurityAnalysisService {
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:19:17',
        maintainer: 'Teeksss',
        version: '3.3.0',
        buildNumber: '202505160719'
    };

    private analysisCache: Map<string, any> = new Map();

    constructor(
        @InjectModel('SecurityMetrics')
        private readonly metricsModel: Model<SecurityMetrics>,
        @Inject(SecurityConfigService)
        private readonly configService: SecurityConfigService,
        private readonly monitoringService: SecurityMonitoringService
    ) {}

    async analyzeSecurityTrends(timeframe: string = '24h'): Promise<SecurityAnalysis> {
        try {
            const cacheKey = `trends_${timeframe}`;
            if (this.isCacheValid(cacheKey)) {
                return this.analysisCache.get(cacheKey);
            }

            const metrics = await this.fetchMetricsForTimeframe(timeframe);
            const analysis = this.performTrendAnalysis(metrics);
            
            this.cacheAnalysis(cacheKey, analysis);
            return analysis;
        } catch (error) {
            console.error('Security trend analysis failed:', error);
            throw error;
        }
    }

    async detectAnomalies(): Promise<AnomalyReport> {
        try {
            const metrics = await this.fetchRecentMetrics();
            const anomalies = this.detectMetricAnomalies(metrics);
            const threats = await this.assessThreats(anomalies);

            return {
                timestamp: new Date('2025-05-16 07:19:17').toISOString(),
                anomalies,
                threats,
                serviceInfo: this.serviceInfo
            };
        } catch (error) {
            console.error('Anomaly detection failed:', error);
            throw error;
        }
    }

    async generateRiskAssessment(): Promise<RiskAssessment> {
        try {
            const [metrics, anomalies, config] = await Promise.all([
                this.fetchRecentMetrics(),
                this.detectAnomalies(),
                this.configService.getConfig()
            ]);

            const assessment = this.calculateRiskLevels(metrics, anomalies, config);
            
            return {
                timestamp: new Date('2025-05-16 07:19:17').toISOString(),
                ...assessment,
                serviceInfo: this.serviceInfo
            };
        } catch (error) {
            console.error('Risk assessment failed:', error);
            throw error;
        }
    }

    private async fetchMetricsForTimeframe(timeframe: string): Promise<any[]> {
        const endDate = new Date('2025-05-16 07:19:17');
        const startDate = this.calculateStartDate(timeframe, endDate);

        return this.metricsModel
            .find({
                timestamp: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            .sort({ timestamp: 1 })
            .exec();
    }

    private calculateStartDate(timeframe: string, endDate: Date): Date {
        const startDate = new Date(endDate);
        const duration = parseInt(timeframe);
        const unit = timeframe.slice(-1);

        switch (unit) {
            case 'h':
                startDate.setHours(startDate.getHours() - duration);
                break;
            case 'd':
                startDate.setDate(startDate.getDate() - duration);
                break;
            case 'w':
                startDate.setDate(startDate.getDate() - (duration * 7));
                break;
            default:
                startDate.setHours(startDate.getHours() - 24);
        }

        return startDate;
    }

    private performTrendAnalysis(metrics: any[]): SecurityAnalysis {
        const trends = {
            threats: this.analyzeThreatTrends(metrics),
            performance: this.analyzePerformanceTrends(metrics),
            security: this.analyzeSecurityMetrics(metrics)
        };

        const recommendations = this.generateRecommendations(trends);

        return {
            timestamp: new Date('2025-05-16 07:19:17').toISOString(),
            trends,
            recommendations,
            serviceInfo: this.serviceInfo
        };
    }

    private analyzeThreatTrends(metrics: any[]): ThreatTrends {
        // Tehdit trendlerini analiz etme
        return {
            totalThreats: metrics.length,
            criticalThreats: metrics.filter(m => m.severity === 'critical').length,
            threatDistribution: this.calculateThreatDistribution(metrics),
            trendDirection: this.calculateTrendDirection(metrics, 'threats')
        };
    }

    private analyzePerformanceTrends(metrics: any[]): PerformanceTrends {
        // Performans trendlerini analiz etme
        return {
            averageResponseTime: this.calculateAverageMetric(metrics, 'responseTime'),
            resourceUsage: this.calculateResourceUsage(metrics),
            performanceScore: this.calculatePerformanceScore(metrics)
        };
    }

    private analyzeSecurityMetrics(metrics: any[]): SecurityMetricTrends {
        // Güvenlik metriklerini analiz etme
        return {
            failedLogins: this.analyzeFailedLogins(metrics),
            suspiciousActivities: this.analyzeSuspiciousActivities(metrics),
            vulnerabilities: this.analyzeVulnerabilities(metrics)
        };
    }

    private generateRecommendations(trends: any): Recommendation[] {
        // Önerileri oluşturma
        const recommendations = [];

        if (trends.threats.criticalThreats > 0) {
            recommendations.push({
                priority: 'high',
                category: 'security',
                action: 'Investigate critical threats immediately',
                impact: 'Critical system security'
            });
        }

        if (trends.performance.performanceScore < 70) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                action: 'Optimize system resources',
                impact: 'System performance'
            });
        }

        return recommendations;
    }

    private isCacheValid(key: string): boolean {
        if (!this.analysisCache.has(key)) return false;
        
        const cachedData = this.analysisCache.get(key);
        const cacheAge = new Date('2025-05-16 07:19:17').getTime() - new Date(cachedData.timestamp).getTime();
        
        return cacheAge < 300000; // 5 dakika
    }

    private cacheAnalysis(key: string, analysis: any): void {
        this.analysisCache.set(key, {
            ...analysis,
            cacheTimestamp: new Date('2025-05-16 07:19:17').toISOString()
        });
    }
}