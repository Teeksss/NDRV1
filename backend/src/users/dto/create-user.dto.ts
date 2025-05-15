import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 8,
    maxLength: 30,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(30, { message: 'Password must not be longer than 30 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'User role',
    example: 'user',
    enum: ['admin', 'analyst', 'user', 'auditor', 'readonly'],
    default: 'user',
  })
  @IsEnum(['admin', 'analyst', 'user', 'auditor', 'readonly'])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: 'User avatar URL', example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'User phone number', example: '+901234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User permissions',
    type: [String],
    example: ['read:alerts', 'write:events']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'User preferences',
    type: Object,
    example: { theme: 'dark', notifications: { email: true, push: false } }
  })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}