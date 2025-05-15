import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  IsNumber,
} from 'class-validator';

export class UpdateAlertDto {
  @ApiPropertyOptional({ description: 'Alert title', example: 'Updated Suspicious Login Attempt' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Alert description', example: 'Updated description of the alert' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Alert severity',
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    example: 'high'
  })
  @IsEnum(['critical', 'high', 'medium', 'low', 'info'])
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({
    description: 'Alert status',
    enum: ['open', 'in_progress', 'resolved', 'closed', 'false_positive'],
    example: 'in_progress'
  })
  @IsEnum(['open', 'in_progress', 'resolved', 'closed', 'false_positive'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String], example: ['authentication', 'login', 'suspicious'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Alert priority (1-5)', example: 2 })
  @IsNumber()
  @IsOptional()
  priority?: number;

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

  @ApiPropertyOptional({ description: 'User ID assigned to the alert', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Additional payload data', type: Object })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
}