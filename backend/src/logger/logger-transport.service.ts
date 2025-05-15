import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LoggerTransportService {
  constructor(private configService: ConfigService) {}

  /**
   * Creates all configured transports based on config
   */
  createTransports(): Transport[] {
    const transports: Transport[] = [];
    
    // Console transport (always enabled)
    if (this.configService.get<boolean>('logging.console', true)) {
      transports.push(this.createConsoleTransport());
    }
    
    // File transport
    if (this.configService.get<boolean>('logging.file', false)) {
      transports.push(...this.createFileTransports());
    }
    
    // Create security log transport if enabled
    if (this.configService.get<boolean>('logging.security', false)) {
      transports.push(this.createSecurityTransport());
    }
    
    // Create access log transport if enabled
    if (this.configService.get<boolean>('logging.access', false)) {
      transports.push(this.createAccessTransport());
    }
    
    // Create audit log transport if enabled
    if (this.configService.get<boolean>('logging.audit', false)) {
      transports.push(this.createAuditTransport());
    }
    
    return transports;
  }

  /**
   * Create console transport
   */
  private createConsoleTransport(): Transport {
    return new winston.transports.Console({
      level: this.configService.get<string>('logging.level', 'info'),
    });
  }

  /**
   * Create file transports
   */
  private createFileTransports(): Transport[] {
    const logDir = this.configService.get<string>('logging.directory', 'logs');
    const maxSize = this.configService.get<string>('logging.maxSize', '20m');
    const maxFiles = this.configService.get<string>('logging.maxFiles', '14d');
    
    // Create log directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Create standard log transport
    const combined = new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize,
      maxFiles,
      level: this.configService.get<string>('logging.level', 'info'),
    });
    
    // Create error log transport
    const errors = new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize,
      maxFiles,
      level: 'error',
    });
    
    return [combined, errors];
  }

  /**
   * Create security log transport
   */
  private createSecurityTransport(): Transport {
    const logDir = this.configService.get<string>('logging.directory', 'logs');
    const maxSize = this.configService.get<string>('logging.maxSize', '20m');
    const maxFiles = this.configService.get<string>('logging.maxFiles', '14d');
    
    return new DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize,
      maxFiles,
    });
  }

  /**
   * Create access log transport
   */
  private createAccessTransport(): Transport {
    const logDir = this.configService.get<string>('logging.directory', 'logs');
    const maxSize = this.configService.get<string>('logging.maxSize', '20m');
    const maxFiles = this.configService.get<string>('logging.maxFiles', '14d');
    
    return new DailyRotateFile({
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize,
      maxFiles,
    });
  }

  /**
   * Create audit log transport
   */
  private createAuditTransport(): Transport {
    const logDir = this.configService.get<string>('logging.directory', 'logs');
    const maxSize = this.configService.get<string>('logging.maxSize', '20m');
    const maxFiles = this.configService.get<string>('logging.maxFiles', '30d'); // Keep audits longer
    
    return new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize,
      maxFiles,
    });
  }
}