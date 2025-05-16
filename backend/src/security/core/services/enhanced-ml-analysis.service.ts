import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class EnhancedMLAnalysisService {
    private readonly serviceInfo = {
        timestamp: '2025-05-16 06:34:00',
        maintainer: 'Teeksss',
        version: '3.1.0',
        engineVersion: '2.5.0',
        buildNumber: '202505160634'
    };

    constructor(
        @InjectModel('MLModel')
        private readonly mlModel: Model<MLModel>,
        @InjectModel('SecurityEvent')
        private readonly securityEventModel: Model<SecurityEvent>,
        @InjectModel('AnalysisResult')
        private readonly analysisResultModel: Model<AnalysisResult>
    ) {}

    async analyzeSecurityPattern(data: SecurityData): Promise<MLAnalysisResult> {
        try {
            const enrichedData = await this.prepareData(data);
            const analysis = await this.runMLAnalysis(enrichedData);
            const result = await this.processResults(analysis);

            await this.saveAnalysisResult(result);

            return {
                analysisId: `ML-${Date.now()}`,
                timestamp: new Date().toISOString(),
                results: result,
                metadata: {
                    analyst: this.serviceInfo.maintainer,
                    version: this.serviceInfo.version,
                    engineVersion: this.serviceInfo.engineVersion,
                    buildNumber: this.serviceInfo.buildNumber
                }
            };
        } catch (error) {
            console.error('ML Analysis Error:', error);
            throw new Error('ML Analysis failed');
        }
    }

    private async prepareData(data: SecurityData): Promise<EnrichedSecurityData> {
        const historicalContext = await this.securityEventModel
            .find({ 
                type: data.type,
                timestamp: { 
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
            })
            .sort({ timestamp: -1 })
            .limit(100)
            .exec();

        return {
            ...data,
            enrichment: {
                historicalContext,
                patterns: await this.detectPatterns(data, historicalContext),
                riskScore: await this.calculateRiskScore(data, historicalContext)
            }
        };
    }

    private async runMLAnalysis(data: EnrichedSecurityData): Promise<MLAnalysis> {
        const model = await this.mlModel.findOne({ 
            status: 'active',
            version: this.serviceInfo.engineVersion 
        }).exec();

        if (!model) {
            throw new Error('Active ML model not found');
        }

        return {
            modelId: model._id,
            predictions: await this.generatePredictions(data, model),
            confidence: await this.calculateConfidence(data, model),
            recommendations: await this.generateRecommendations(data, model)
        };
    }

    private async processResults(analysis: MLAnalysis): Promise<ProcessedResult> {
        return {
            timestamp: new Date().toISOString(),
            threatLevel: await this.calculateThreatLevel(analysis),
            actionItems: await this.generateActionItems(analysis),
            insights: await this.extractInsights(analysis)
        };
    }

    private async saveAnalysisResult(result: ProcessedResult): Promise<void> {
        await this.analysisResultModel.create({
            ...result,
            createdAt: new Date(),
            createdBy: this.serviceInfo.maintainer
        });
    }
}