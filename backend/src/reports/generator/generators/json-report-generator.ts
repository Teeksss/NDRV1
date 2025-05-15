import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../logger/logger.service';
import { ReportGenerator } from '../interfaces/report-generator.interface';
import { ReportTemplate } from '../interfaces/report-template.interface';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class JsonReportGenerator implements ReportGenerator {
  private readonly reportDir: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    // Get report directory from config, default to 'reports'
    this.reportDir = this.configService.get<string>('reports.directory', 'reports');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async generate(template: ReportTemplate, data: any, params: any): Promise<any> {
    try {
      this.logger.log(`Generating JSON report using template: ${template.name}`, 'JsonReportGenerator');
      
      // Generate unique filename
      const filename = `report-${uuidv4()}.json`;
      const filePath = path.join(this.reportDir, filename);
      
      // Create report object with metadata
      const report = {
        metadata: {
          reportName: template.name,
          description: template.description,
          generatedAt: new Date(),
          parameters: params,
        },
        data,
      };
      
      // Write JSON to file
      fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
      
      return {
        format: 'json',
        filename,
        path: filePath,
        size: fs.statSync(filePath).size,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error generating JSON report: ${error.message}`, error.stack, 'JsonReportGenerator');
      throw error;
    }
  }

  getMimeType(): string {
    return 'application/json';
  }

  getFileExtension(): string {
    return 'json';
  }
}