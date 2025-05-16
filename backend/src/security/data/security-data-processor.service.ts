import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SecurityDataProcessorService {
    private readonly processorInfo = {
        timestamp: '2025-05-16 06:34:00',
        maintainer: 'Teeksss',
        version: '3.1.0',
        buildNumber: '202505160634'
    };

    constructor(
        @InjectModel('SecurityData')
        private readonly dataModel: Model<SecurityData>,
        @InjectModel('ProcessedData')
        private readonly processedModel: Model<ProcessedData>
    ) {}

    async processSecurityData(data: RawSecurityData): Promise<ProcessedSecurityData> {
        try {
            const validatedData = await this.validateData(data);
            const normalizedData = await this.normalizeData(validatedData);
            const enrichedData = await this.enrichData(normalizedData);

            const result = {
                processId: `PROC-${Date.now()}`,
                timestamp: new Date().toISOString(),
                data: enrichedData,
                processingMetadata: {
                    processor: this.processorInfo.maintainer,
                    version: this.processorInfo.version,
                    buildNumber: this.processorInfo.buildNumber
                }
            };

            await this.saveProcessedData(result);
            return result;
        } catch (error) {
            console.error('Data Processing Error:', error);
            throw new Error('Data processing failed');
        }
    }

    private async validateData(data: RawSecurityData): Promise<ValidatedSecurityData> {
        const validationRules = await this.getValidationRules();
        const validationResults = await this.applyValidationRules(data, validationRules);

        if (!validationResults.isValid) {
            throw new Error(`Validation failed: ${validationResults.errors.join(', ')}`);
        }

        return {
            ...data,
            validated: true,
            validationTimestamp: new Date().toISOString()
        };
    }

    private async normalizeData(data: ValidatedSecurityData): Promise<NormalizedSecurityData> {
        return {
            ...data,
            normalizedFields: await this.normalizeFields(data),
            normalizationTimestamp: new Date().toISOString()
        };
    }

    private async enrichData(data: NormalizedSecurityData): Promise<EnrichedSecurityData> {
        return {
            ...data,
            enrichments: await this.applyEnrichments(data),
            enrichmentTimestamp: new Date().toISOString()
        };
    }

    private async saveProcessedData(data: ProcessedSecurityData): Promise<void> {
        await this.processedModel.create({
            ...data,
            savedAt: new Date(),
            savedBy: this.processorInfo.maintainer
        });
    }
}