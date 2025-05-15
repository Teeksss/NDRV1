import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../logger/logger.service';
import { ReportGenerator } from '../interfaces/report-generator.interface';
import { ReportTemplate } from '../interfaces/report-template.interface';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CsvReportGenerator implements ReportGenerator {
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
      this.logger.log(`Generating CSV report using template: ${template.name}`, 'CsvReportGenerator');
      
      // Generate unique filename
      const filename = `report-${uuidv4()}.csv`;
      const filePath = path.join(this.reportDir, filename);
      
      // Convert data to CSV
      const csvContent = this.convertToCSV(data, template, params);
      
      // Write to file
      fs.writeFileSync(filePath, csvContent);
      
      return {
        format: 'csv',
        filename,
        path: filePath,
        size: fs.statSync(filePath).size,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error generating CSV report: ${error.message}`, error.stack, 'CsvReportGenerator');
      throw error;
    }
  }

  getMimeType(): string {
    return 'text/csv';
  }

  getFileExtension(): string {
    return 'csv';
  }

  private convertToCSV(data: any, template: ReportTemplate, params: any): string {
    // In a real implementation, this would be a more sophisticated CSV builder
    // based on the specific template type
    
    // For this example, we'll handle a few template types
    switch (template.name) {
      case 'Alert Summary':
        return this.generateAlertSummaryCSV(data);
      default:
        // Generic CSV generation for unknown templates
        return this.generateGenericCSV(data);
    }
  }

  private generateAlertSummaryCSV(data: any): string {
    let csv = 'ID,Title,Severity,Status,Source,Timestamp\n';
    
    // Add each alert as a row
    if (data.alerts && Array.isArray(data.alerts)) {
      for (const alert of data.alerts) {
        const timestamp = new Date(alert.timestamp).toISOString();
        
        // Escape fields that might contain commas
        const escapedTitle = `"${alert.title.replace(/"/g, '""')}"`;
        
        csv += `${alert.id},${escapedTitle},${alert.severity},${alert.status},${alert.source},${timestamp}\n`;
      }
    }
    
    return csv;
  }

  private generateGenericCSV(data: any): string {
    // For generic data, we'll try to find arrays to convert to CSV
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        return this.arrayToCSV(data[key]);
      }
    }
    
    // If no arrays found, convert the whole object to CSV
    return this.objectToCSV(data);
  }

  private arrayToCSV(arr: any[]): string {
    if (arr.length === 0) return '';
    
    // Get headers from the first object
    const headers = Object.keys(arr[0]);
    let csv = headers.join(',') + '\n';
    
    // Add each row
    for (const item of arr) {
      const values = headers.map(header => {
        // Get value or empty string if undefined
        const value = item[header] === undefined ? '' : item[header];
        
        // Format value based on type
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma or newline
          const escapedValue = value.replace(/"/g, '""');
          return (value.includes(',') || value.includes('\n')) 
            ? `"${escapedValue}"` 
            : escapedValue;
        } else if (value instanceof Date) {
          return value.toISOString();
        } else if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      
      csv += values.join(',') + '\n';
    }
    
    return csv;
  }

  private objectToCSV(obj: any): string {
    // For a single object, create a two-column CSV with keys and values
    let csv = 'Property,Value\n';
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip complex nested objects
      if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
        continue;
      }
      
      // Format value based on type
      let formattedValue;
      if (typeof value === 'string') {
        const escapedValue = value.replace(/"/g, '""');
        formattedValue = (value.includes(',') || value.includes('\n')) 
          ? `"${escapedValue}"` 
          : escapedValue;
      } else if (value instanceof Date) {
        formattedValue = value.toISOString();
      } else if (Array.isArray(value)) {
        formattedValue = `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else {
        formattedValue = value;
      }
      
      csv += `${key},${formattedValue}\n`;
    }
    
    return csv;
  }
}