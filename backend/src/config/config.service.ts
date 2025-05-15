import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  // Define validation schema for environment variables
  static validationSchema = Joi.object({
    // Application
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(3000),
    APP_NAME: Joi.string().default('ndr-correlation-engine'),
    APP_VERSION: Joi.string().default('1.0.0'),
    API_PREFIX: Joi.string().default('api'),
    
    // Database
    MONGODB_URI: Joi.string().required(),
    
    // Authentication
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('1d'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    
    // CORS
    CORS_ORIGIN: Joi.string().default('*'),
    
    // Logging
    LOG_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
      .default('info'),
    LOGS_PATH: Joi.string().default('logs'),
    
    // Rate limiting
    THROTTLE_TTL: Joi.number().default(60),
    THROTTLE_LIMIT: Joi.number().default(100),
    
    // Email settings
    MAIL_HOST: Joi.string().optional(),
    MAIL_PORT: Joi.number().optional(),
    MAIL_USER: Joi.string().optional(),
    MAIL_PASSWORD: Joi.string().optional(),
    MAIL_FROM: Joi.string().optional(),
    
    // Features
    ENABLE_SWAGGER: Joi.boolean().default(true),
    ENABLE_COMPRESSION: Joi.boolean().default(true),
    ENABLE_HELMET: Joi.boolean().default(true),
    ENABLE_WEBSOCKETS: Joi.boolean().default(true),
    
    // External services
    GEOLOCATION_API_KEY: Joi.string().optional(),
    THREATINTEL_API_KEY: Joi.string().optional(),
  });

  // Helper methods to access configuration

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get port(): number {
    return this.configService.get<number>('PORT');
  }

  get appName(): string {
    return this.configService.get<string>('APP_NAME');
  }

  get appVersion(): string {
    return this.configService.get<string>('APP_VERSION');
  }

  get apiPrefix(): string {
    return this.configService.get<string>('API_PREFIX');
  }

  get mongodbUri(): string {
    return this.configService.get<string>('MONGODB_URI');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
  }

  get corsOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN');
  }

  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL');
  }

  get logsPath(): string {
    return this.configService.get<string>('LOGS_PATH');
  }

  get throttleTtl(): number {
    return this.configService.get<number>('THROTTLE_TTL');
  }

  get throttleLimit(): number {
    return this.configService.get<number>('THROTTLE_LIMIT');
  }

  get enableSwagger(): boolean {
    return this.configService.get<boolean>('ENABLE_SWAGGER');
  }

  get enableCompression(): boolean {
    return this.configService.get<boolean>('ENABLE_COMPRESSION');
  }

  get enableHelmet(): boolean {
    return this.configService.get<boolean>('ENABLE_HELMET');
  }

  get enableWebsockets(): boolean {
    return this.configService.get<boolean>('ENABLE_WEBSOCKETS');
  }

  // Email configuration
  get mailConfig(): any {
    return {
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      user: this.configService.get<string>('MAIL_USER'),
      password: this.configService.get<string>('MAIL_PASSWORD'),
      from: this.configService.get<string>('MAIL_FROM'),
    };
  }

  // External service keys
  get geolocationApiKey(): string {
    return this.configService.get<string>('GEOLOCATION_API_KEY');
  }

  get threatIntelApiKey(): string {
    return this.configService.get<string>('THREATINTEL_API_KEY');
  }

  // General method to get any config value
  get<T>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue);
  }
}