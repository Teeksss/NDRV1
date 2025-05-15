import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsObject,
  ValidateNested,
  IsIP,
  IsMACAddress
} from 'class-validator';
import { Type } from 'class-transformer';
import { VulnerabilityDetailDto, LocationDto } from './create-entity.dto';

export class UpdateEntityDto {
  @ApiPropertyOptional({ description: 'Entity name', example: 'Updated Web Server 01' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Entity type', 
    example: 'server',
    enum: ['server', 'workstation', 'network_device', 'security_device', 'iot_device', 'other']
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Entity description', example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Entity status', 
    example: 'maintenance',
    enum: ['active', 'inactive', 'maintenance', 'compromised', 'unknown']
  })
  @IsString()
  @IsEnum(['active', 'inactive', 'maintenance', 'compromised', 'unknown'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.2' })
  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'MAC address', example: '00:11:22:33:44:66' })
  @IsMACAddress()
  @IsOptional()
  macAddress?: string;

  @ApiPropertyOptional({ description: 'Hostname', example: 'webserver01-new.example.com' })
  @IsString()
  @IsOptional()
  hostname?: string;

  @ApiPropertyOptional({ description: 'Operating system', example: 'Ubuntu Linux 22.04' })
  @IsString()
  @IsOptional()
  operatingSystem?: string;

  @ApiPropertyOptional({ description: 'OS version', example: '22.04 LTS' })
  @IsString()
  @IsOptional()
  osVersion?: string;

  @ApiPropertyOptional({ description: 'Network interfaces', type: [String], example: ['eth0', 'eth1', 'eth2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interfaces?: string[];

  @ApiPropertyOptional({ description: 'IP addresses', type: [String], example: ['192.168.1.2', '10.0.0.2'] })
  @IsArray()
  @IsIP(undefined, { each: true })
  @IsOptional()
  ipAddresses?: string[];

  @ApiPropertyOptional({ description: 'Tags', type: [String], example: ['production', 'web', 'critical', 'updated'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Risk score (0-100)', example: 60 })
  @IsNumber()
  @IsOptional()
  riskScore?: number;

  @ApiPropertyOptional({ 
    description: 'Last seen timestamp',
    type: Date
  })
  @IsOptional()
  lastSeen?: Date;

  @ApiPropertyOptional({ description: 'Geographical location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'User ID who updated the entity', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}