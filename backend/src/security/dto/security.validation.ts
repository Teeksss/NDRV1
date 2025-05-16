import { IsString, IsEnum, IsOptional, IsObject, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAlertDto {
    @IsString()
    type: string;

    @IsEnum(['low', 'medium', 'high', 'critical'])
    severity: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    readonly serviceInfo = {
        timestamp: '2025-05-16 07:14:40',
        maintainer: 'Teeksss',
        version: '3.2.7',
        buildNumber: '202505160714'
    };
}

export class UpdateAlertDto {
    @IsOptional()
    @IsEnum(['active', 'acknowledged', 'resolved'])
    status?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(['low', 'medium', 'high', 'critical'])
    severity?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    readonly serviceInfo = {
        timestamp: '2025-05-16 07:14:40',
        maintainer: 'Teeksss',
        version: '3.2.7',
        buildNumber: '202505160714'
    };
}

export class MetricsQueryDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    type?: string;

    readonly serviceInfo = {
        timestamp: '2025-05-16 07:14:40',
        maintainer: 'Teeksss',
        version: '3.2.7',
        buildNumber: '202505160714'
    };
}

export class SecurityConfigDto {
    @ValidateNested()
    @Type(() => SecurityFeaturesDto)
    features: SecurityFeaturesDto;

    @ValidateNested()
    @Type(() => SecurityThresholdsDto)
    thresholds: SecurityThresholdsDto;

    readonly serviceInfo = {
        timestamp: '2025-05-16 07:14:40',
        maintainer: 'Teeksss',
        version: '3.2.7',
        buildNumber: '202505160714'
    };
}

export class SecurityFeaturesDto {
    @IsOptional()
    realTimeMonitoring?: boolean;

    @IsOptional()
    mlDetection?: boolean;

    @IsOptional()
    automatedResponse?: boolean;

    @IsOptional()
    threatIntelligence?: boolean;
}

export class SecurityThresholdsDto {
    @IsOptional()
    minConfidenceScore?: number;

    @IsOptional()
    maxResponseTime?: number;

    @IsOptional()
    criticalSeverityLevel?: number;
}