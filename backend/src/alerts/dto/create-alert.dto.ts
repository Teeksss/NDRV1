import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiProperty({ description: 'Country name', example: 'United States' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'City name', example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Latitude', example: 40.712776 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -74.005974 })
  @IsNumber()
  longitude: number;
}

export class CreateAlertDto {
  @ApiProperty({ description: 'Alert title', example: 'Suspicious Login Attempt' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Alert description', example: 'Multiple failed login attempts detected from unusual location' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Alert severity',
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    example: 'high',
    default: 'medium'
  })
  @IsEnum(['critical', 'high', 'medium', 'low', 'info'])
  @IsOptional()
  severity?: string;

  @ApiProperty({
    description: 'Alert status',
    enum: ['open', 'in_progress', 'resolved', 'closed', 'false_positive'],
    example: 'open',
    default: 'open'
  })
  @IsEnum(['open', 'in_progress', 'resolved', 'closed', 'false_positive'])
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Alert source', example: 'intrusion_detection' })
  @IsString()
  source: string;

  @ApiPropertyOptional({ description: 'Alert type', example: 'authentication_failure' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Alert category', example: 'security' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String], example: ['authentication', 'login'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Alert timestamp', example: '2025-05-15T12:30:00Z' })
  @IsDateString()
  @IsOptional()
  timestamp?: Date;

  @ApiPropertyOptional({ description: 'Related event IDs', type: [String], example: ['60d21b4667d0d8992e610c85'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventIds?: string[];

  @ApiPropertyOptional({ description: 'Associated entity ID', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Source IP address', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  sourceIp?: string;

  @ApiPropertyOptional({ description: 'Destination IP address', example: '10.0.0.1' })
  @IsString()
  @IsOptional()
  destinationIp?: string;

  @ApiPropertyOptional({ description: 'Protocol', example: 'TCP' })
  @IsString()
  @IsOptional()
  protocol?: string;

  @ApiPropertyOptional({ description: 'Port number', example: 443 })
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({ description: 'Is correlated alert', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isCorrelated?: boolean;

  @ApiPropertyOptional({ description: 'Correlation rule ID if correlated', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  correlationRuleId?: string;

  @ApiPropertyOptional({ description: 'MITRE ATT&CK tactic', example: 'Initial Access' })
  @IsString()
  @IsOptional()
  tactic?: string;

  @ApiPropertyOptional({ description: 'MITRE ATT&CK technique', example: 'T1078' })
  @IsString()
  @IsOptional()
  technique?: string;

  @ApiPropertyOptional({ description: 'MITRE ATT&CK URL', example: 'https://attack.mitre.org/techniques/T1078/' })
  @IsString()
  @IsOptional()
  mitreAttackUrl?: string;

  @ApiPropertyOptional({ description: 'Alert priority (1-5)', example: 1 })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Additional payload data', type: Object })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Geographical location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'User ID who created the alert', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  createdBy?: string;
}