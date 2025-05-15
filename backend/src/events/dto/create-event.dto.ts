import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
  IsIP,
  IsNumber,
  IsInt,
  IsBoolean,
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

export class CreateEventDto {
  @ApiProperty({ description: 'Event type', example: 'authentication_failure' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Event description', example: 'Failed login attempt for user admin' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Event source', example: 'firewall' })
  @IsString()
  source: string;

  @ApiPropertyOptional({
    description: 'Event severity',
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    example: 'high',
    default: 'medium'
  })
  @IsEnum(['critical', 'high', 'medium', 'low', 'info'])
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({ description: 'Event timestamp', example: '2025-05-15T12:30:00Z' })
  @IsDateString()
  @IsOptional()
  timestamp?: Date;

  @ApiPropertyOptional({ description: 'Entity ID', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Source IP address', example: '192.168.1.1' })
  @IsIP()
  @IsOptional()
  sourceIp?: string;

  @ApiPropertyOptional({ description: 'Destination IP address', example: '10.0.0.1' })
  @IsIP()
  @IsOptional()
  destinationIp?: string;

  @ApiPropertyOptional({ description: 'Source port', example: 45123 })
  @IsInt()
  @IsOptional()
  sourcePort?: number;

  @ApiPropertyOptional({ description: 'Destination port', example: 443 })
  @IsInt()
  @IsOptional()
  destinationPort?: number;

  @ApiPropertyOptional({ description: 'Protocol', example: 'TCP' })
  @IsString()
  @IsOptional()
  protocol?: string;

  @ApiPropertyOptional({ description: 'Username', example: 'admin' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Process name', example: 'sshd' })
  @IsString()
  @IsOptional()
  processName?: string;

  @ApiPropertyOptional({ description: 'Process ID', example: 12345 })
  @IsInt()
  @IsOptional()
  processId?: number;

  @ApiPropertyOptional({ description: 'Command', example: 'sudo su -' })
  @IsString()
  @IsOptional()
  command?: string;

  @ApiPropertyOptional({ description: 'Success indicator', example: false })
  @IsBoolean()
  @IsOptional()
  success?: boolean;

  @ApiPropertyOptional({ description: 'Event tags', type: [String], example: ['authentication', 'security'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Raw event data', type: Object })
  @IsObject()
  @IsOptional()
  rawData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Geographical location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'User ID who created the event', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  createdBy?: string;
}