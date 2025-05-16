import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SecurityConfigService } from '../config/security-config.service';
import { SecurityWebSocketGateway } from '../websocket/security.gateway';

@Injectable()
export class SecurityMonitoringService {
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:18:22',
        maintainer: 'Teeksss',
        version: '3.2.9',
        buildNumber: '202505160718'
    };

    private monitoringInterval: NodeJS.Timeout;
    private readonly metricsBuffer: Map<string, any[]> = new Map();

    constructor(
        @InjectModel('SecurityMetrics')
        private readonly metricsModel: Model<SecurityMetrics>,
        @Inject(SecurityConfigService)
        private readonly configService: SecurityConfigService,
        private readonly wsGateway: SecurityWebSocketGateway
    ) {
        this.initializeMonitoring();
    }

    private async initializeMonitoring(): Promise<void> {
        try {
            const config = await this.configService.getConfig();
            if (config.monitoring.enabled) {
                this.startMonitoring(config.monitoring.interval);
            }
        } catch (error) {
            console.error('Monitoring initialization failed:', error);
            throw error;
        }
    }

    async startMonitoring(interval: number = 60000): Promise<void> {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
                await this.analyzeMetrics();
                await this.cleanupOldMetrics();
            } catch (error) {
                console.error('Monitoring cycle failed:', error);
            }
        }, interval);
    }

    async stopMonitoring(): Promise<void> {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }

    async collectMetrics(): Promise<void> {
        try {
            const metrics = await this.gatherSystemMetrics();
            await this.storeMetrics(metrics);
            this.bufferMetrics(metrics);
            this.wsGateway.notifyClients('metricsUpdate', {
                metrics,
                timestamp: new Date('2025-05-16 07:18:22').toISOString(),
                serviceInfo: this.serviceInfo
            });
        } catch (error) {
            console.error('Metrics collection failed:', error);
            throw error;
        }
    }

    private async gatherSystemMetrics(): Promise<any> {
        // Sistem metriklerini toplama
        const metrics = {
            cpu: await this.getCpuMetrics(),
            memory: await this.getMemoryMetrics(),
            network: await this.getNetworkMetrics(),
            security: await this.getSecurityMetrics(),
            timestamp: new Date('2025-05-16 07:18:22').toISOString(),
            serviceInfo: this.serviceInfo
        };

        return metrics;
    }

    private async getCpuMetrics(): Promise<any> {
        // CPU metriklerini toplama
        return {
            usage: Math.random() * 100,
            temperature: 45 + Math.random() * 20,
            processes: 100 + Math.floor(Math.random() * 50)
        };
    }

    private async getMemoryMetrics(): Promise<any> {
        // Bellek metriklerini toplama
        return {
            used: Math.random() * 16384,
            total: 16384,
            swap: Math.random() * 4096
        };
    }

    private async getNetworkMetrics(): Promise<any> {
        // Ağ metriklerini toplama
        return {
            bytesIn: Math.random() * 1000000,
            bytesOut: Math.random() * 1000000,
            connections: Math.floor(Math.random() * 1000)
        };
    }

    private async getSecurityMetrics(): Promise<any> {
        // Güvenlik metriklerini toplama
        return {
            activeThreatCount: Math.floor(Math.random() * 10),
            failedLoginAttempts: Math.floor(Math.random() * 100),
            suspiciousActivities: Math.floor(Math.random() * 20)
        };
    }

    private async storeMetrics(metrics: any): Promise<void> {
        try {
            const newMetrics = new this.metricsModel({
                ...metrics,
                createdAt: new Date('2025-05-16 07:18:22').toISOString(),
                creator: this.serviceInfo.maintainer
            });
            await newMetrics.save();
        } catch (error) {
            console.error('Metrics storage failed:', error);
            throw error;
        }
    }

    private bufferMetrics(metrics: any): void {
        const maxBufferSize = 1000;
        for (const [key, value] of Object.entries(metrics)) {
            if (!this.metricsBuffer.has(key)) {
                this.metricsBuffer.set(key, []);
            }
            const buffer = this.metricsBuffer.get(key);
            buffer.push({
                value,
                timestamp: new Date('2025-05-16 07:18:22').toISOString()
            });
            if (buffer.length > maxBufferSize) {
                buffer.shift();
            }
        }
    }

    private async analyzeMetrics(): Promise<void> {
        try {
            const analysis = await this.performMetricsAnalysis();
            if (analysis.anomalies.length > 0) {
                this.wsGateway.notifyClients('metricsAnalysis', {
                    analysis,
                    timestamp: new Date('2025-05-16 07:18:22').toISOString(),
                    serviceInfo: this.serviceInfo
                });
            }
        } catch (error) {
            console.error('Metrics analysis failed:', error);
            throw error;
        }
    }

    private async performMetricsAnalysis(): Promise<any> {
        // Metrik analizi yapma
        const anomalies = [];
        for (const [key, buffer] of this.metricsBuffer.entries()) {
            const analysis = this.analyzeMetricBuffer(buffer);
            if (analysis.hasAnomaly) {
                anomalies.push({
                    metric: key,
                    ...analysis
                });
            }
        }
        return { anomalies };
    }

    private analyzeMetricBuffer(buffer: any[]): any {
        if (buffer.length < 2) return { hasAnomaly: false };

        const values = buffer.map(item => item.value);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const stdDev = Math.sqrt(
            values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
        );

        const lastValue = values[values.length - 1];
        const zscore = Math.abs((lastValue - mean) / stdDev);

        return {
            hasAnomaly: zscore > 3,
            zscore,
            mean,
            stdDev,
            lastValue
        };
    }

    private async cleanupOldMetrics(): Promise<void> {
        try {
            const config = await this.configService.getConfig();
            const cutoffDate = new Date('2025-05-16 07:18:22');
            cutoffDate.setDate(cutoffDate.getDate() - config.monitoring.retentionPeriod);

            await this.metricsModel.deleteMany({
                timestamp: { $lt: cutoffDate }
            }).exec();
        } catch (error) {
            console.error('Metrics cleanup failed:', error);
            throw error;
        }
    }
}