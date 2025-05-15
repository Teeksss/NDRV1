import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryCorrelationRuleDto {
  @ApiPropertyOptional({ 
    description: 'Filter by rule name (case-insensitive, partial match)',
    example: 'brute force'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by enabled status',
    example: 'true'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  enabled?: boolean | string;

  @ApiPropertyOptional({ 
    description: 'Filter by rule type',
    example: 'threshold',
    isArray: true
  })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : [value];
  })
  type?: string | string[];

  @ApiPropertyOptional({ 
    description: 'Filter by severity',
    example: 'high',
    isArray: true
  })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : [value];
  })
  severity?: string | string[];

  @ApiPropertyOptional({ 
    description: 'Filter by category',
    example: 'authentication',
    isArray: true
  })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : [value];
  })
  category?: string | string[];

  @ApiPropertyOptional({ 
    description: 'Filter by tags',
    example: 'brute-force',
    isArray: true
  })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : [value];
  })
  tags?: string | string[];

  @ApiPropertyOptional({ 
    description: 'Search term for name or description',
    example: 'authentication'
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Sort by field',
    example: 'name',
    default: 'name'
  })
  @IsString()
  @IsOptional()
  @IsEnum(['name', 'type', 'severity', 'enabled', 'triggerCount', 'lastTriggeredAt', 'createdAt', 'updatedAt'])
  sort?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    example: 'asc',
    default: 'asc'
  })
  @IsString()
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: string;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    example: 50,
    default: 50
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}