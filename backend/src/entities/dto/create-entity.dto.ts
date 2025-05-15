import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsObject,
  IsBoolean,
  ValidateNested,
  IsDate,
  IsIP,
  IsMACAddress
} from 'class-validator';
import { Type } from 'class-transformer';

class VulnerabilityDetailDto {
  @ApiProperty({ description: 'Vulnerability ID', example: 'CVE-2021-12345' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Vulnerability name', example: 'Remote Code Execution' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Vulnerability description', example: 'This vulnerability allows attackers to execute arbitrary code.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Severity level', 
    example: 'critical',
    enum: ['critical', 'high', 'medium', 'low', 'info']
  })
  @IsString()
  @IsEnum(['critical', 'high', 'medium', 'low', 'info'])
  severity: string;

  @ApiPropertyOptional({ description: 'CVE identifier', example: 'CVE-2021-12345' })
  @IsString()
  @IsOptional()
  cve?: string;

  @ApiPropertyOptional({ description: 'CVSS score', example: 9.8 })
  @IsNumber()
  @IsOptional()
  cvss?: number;

  @ApiPropertyOptional({ description: 'Remediation steps', example: 'Update to version 1.2.3 or later' })
  @IsString()
  @IsOptional()
  remediation?: string;

  @ApiPropertyOptional({ description: 'Whether the vulnerability is patched', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  patched?: boolean;
}

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

export class CreateEntityDto {
  @ApiProperty({ description: 'Entity name', example: 'Web Server 01' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Entity type', 
    example: 'server',
    enum: ['server', 'workstation', 'network_device', 'security_device', 'iot_device', 'other']
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Entity description', example: 'Primary web server for example.com' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Entity status', 
    example: 'active',
    enum: ['active', 'inactive', 'maintenance', 'compromised', 'unknown'],
    default: 'active'
  })
  @IsString()
  @IsEnum(['active', 'inactive', 'maintenance', 'compromised', 'unknown'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'MAC address', example: '00:11:22:33:44:55' })
  @IsMACAddress()
  @IsOptional()
  macAddress?: string;

  @ApiPropertyOptional({ description: 'Hostname', example: 'webserver01.example.com' })
  @IsString()
  @IsOptional()
  hostname?: string;

  @ApiPropertyOptional({ description: 'Operating system', example: 'Ubuntu Linux 20.04' })
  @IsString()
  @IsOptional()
  operatingSystem?: string;

  @ApiPropertyOptional({ description: 'OS version', example: '20.04 LTS' })
  @IsString()
  @IsOptional()
  osVersion?: string;

  @ApiPropertyOptional({ description: 'Network interfaces', type: [String], example: ['eth0', 'eth1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interfaces?: string[];

  @ApiPropertyOptional({ description: 'IP addresses', type: [String], example: ['192.168.1.1', '10.0.0.1'] })
  @IsArray()
  @IsIP(undefined, { each: true })
  @IsOptional()
  ipAddresses?: string[];

  @ApiPropertyOptional({ description: 'Tags', type: [String], example: ['production', 'web', 'critical'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Risk score (0-100)', example: 75, default: 0 })
  @IsNumber()
  @IsOptional()
  riskScore?: number;

  @ApiPropertyOptional({ 
    description: 'Known vulnerabilities', 
    type: [VulnerabilityDetailDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VulnerabilityDetailDto)
  @IsOptional()
  vulnerabilities?: VulnerabilityDetailDto[];

  @ApiPropertyOptional({ description: 'Geographical location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'User ID who created the entity', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsOptional()
  createdBy?: string;
}