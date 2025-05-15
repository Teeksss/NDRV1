import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    // Create logs directory if it doesn't exist
    const logDir = this.configService.get<string>('logging.directory', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Determine log level based on environment
    const logLevel = this.configService.get<string>('logging.level', 'info');
    const isConsoleEnabled = this.configService.get<boolean>('logging.console', true);
    const isFileEnabled = this.configService.get<boolean>('logging.file', false);
    const maxSize = this.configService.get<string>('logging.maxSize', '20m');
    const maxFiles = this.configService.get<string>('logging.maxFiles', '14d');

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // Configure transports
    const transports: winston.transport[] = [];

    // Console transport
    if (isConsoleEnabled) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              return `${timestamp} [${level}] ${context ? `[${context}]` : ''} ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            }),
          ),
        }),
      );
    }

    // File transport with rotation
    if (isFileEnabled) {
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize,
          maxFiles,
          format: logFormat,
        }),
      );
      
      // Separate error log file
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize,
          maxFiles,
          level: 'error',
          format: logFormat,
        }),
      );
    }

    // Create logger
    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}