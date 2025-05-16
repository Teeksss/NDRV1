import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityConfigService {
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:16:32',
        maintainer: 'Teeksss',
        version: '3.2.8',
        buildNumber: '202505160716'
    };

    private configCache: any = null;
    private lastCacheUpdate: Date = null;
    private readonly cacheDuration = 300000; // 5 dakika

    constructor(
        @InjectModel('SecurityConfig')
        private readonly configModel: Model<SecurityConfig>,
        @Inject('SECURITY_CONFIG')
        private readonly defaultConfig: SecurityConfig,
        private readonly configService: ConfigService
    ) {
        this.initializeConfig();
    }

    private async initializeConfig(): Promise<void> {
        try {
            const existingConfig = await this.configModel.findOne().exec();
            if (!existingConfig) {
                await this.createDefaultConfig();
            }
            await this.loadConfig();
        } catch (error) {
            console.error('Config initialization failed:', error);
            throw error;
        }
    }

    async getConfig(): Promise<SecurityConfig> {
        if (this.isCacheValid()) {
            return this.configCache;
        }
        return this.loadConfig();
    }

    async updateConfig(updates: Partial<SecurityConfig>): Promise<SecurityConfig> {
        try {
            const config = await this.configModel.findOneAndUpdate(
                {},
                {
                    ...updates,
                    lastUpdated: new Date('2025-05-16 07:16:32').toISOString(),
                    updatedBy: this.serviceInfo.maintainer,
                    serviceInfo: this.serviceInfo
                },
                { new: true, upsert: true }
            ).exec();

            this.configCache = config;
            this.lastCacheUpdate = new Date('2025-05-16 07:16:32');

            return config;
        } catch (error) {
            console.error('Config update failed:', error);
            throw error;
        }
    }

    async validateConfig(config: Partial<SecurityConfig>): Promise<boolean> {
        try {
            // Temel doğrulama kontrolleri
            if (config.features) {
                this.validateFeatures(config.features);
            }
            if (config.thresholds) {
                this.validateThresholds(config.thresholds);
            }
            return true;
        } catch (error) {
            console.error('Config validation failed:', error);
            return false;
        }
    }

    private async createDefaultConfig(): Promise<void> {
        try {
            const defaultConfigData = {
                ...this.defaultConfig,
                createdAt: new Date('2025-05-16 07:16:32').toISOString(),
                createdBy: this.serviceInfo.maintainer,
                serviceInfo: this.serviceInfo
            };

            await this.configModel.create(defaultConfigData);
        } catch (error) {
            console.error('Default config creation failed:', error);
            throw error;
        }
    }

    private async loadConfig(): Promise<SecurityConfig> {
        try {
            const config = await this.configModel.findOne().exec();
            this.configCache = config;
            this.lastCacheUpdate = new Date('2025-05-16 07:16:32');
            return config;
        } catch (error) {
            console.error('Config loading failed:', error);
            throw error;
        }
    }

    private isCacheValid(): boolean {
        if (!this.configCache || !this.lastCacheUpdate) {
            return false;
        }
        const now = new Date('2025-05-16 07:16:32').getTime();
        const cacheAge = now - this.lastCacheUpdate.getTime();
        return cacheAge < this.cacheDuration;
    }

    private validateFeatures(features: SecurityFeatures): void {
        const requiredFeatures = ['realTimeMonitoring', 'mlDetection'];
        for (const feature of requiredFeatures) {
            if (features[feature] === undefined) {
                throw new Error(`Missing required feature: ${feature}`);
            }
        }
    }

    private validateThresholds(thresholds: SecurityThresholds): void {
        if (thresholds.minConfidenceScore !== undefined &&
            (thresholds.minConfidenceScore < 0 || thresholds.minConfidenceScore > 1)) {
            throw new Error('minConfidenceScore must be between 0 and 1');
        }

        if (thresholds.maxResponseTime !== undefined && thresholds.maxResponseTime < 0) {
            throw new Error('maxResponseTime must be positive');
        }

        if (thresholds.criticalSeverityLevel !== undefined &&
            (thresholds.criticalSeverityLevel < 1 || thresholds.criticalSeverityLevel > 10)) {
            throw new Error('criticalSeverityLevel must be between 1 and 10');
        }
    }
}