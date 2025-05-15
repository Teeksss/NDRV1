import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../logger/logger.service';
import { AlertsService } from '../../alerts/alerts.service';
import { EventsService } from '../../events/events.service';
import { EntitiesService } from '../../entities/entities.service';
import { PdfReportGenerator } from './generators/pdf-report-generator';
import { CsvReportGenerator } from './generators/csv-report-generator';
import { JsonReportGenerator } from './generators/json-report-generator';
import { ReportTemplate } from './interfaces/report-template.interface';
import { ReportGenerator } from './interfaces/report-generator.interface';

@Injectable()
export class ReportGeneratorService {
  private generators: Map<string, ReportGenerator> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();

  constructor(
    private configService: ConfigService,
    private alertsService: AlertsService,
    private eventsService: EventsService,
    private entitiesService: EntitiesService,
    private logger: LoggerService,
    private pdfGenerator: PdfReportGenerator,
    private csvGenerator: CsvReportGenerator,
    private jsonGenerator: JsonReportGenerator,
  ) {
    this.registerGenerators();
    this.registerTemplates();
  }

  private registerGenerators() {
    this.generators.set('pdf', this.pdfGenerator);
    this.generators.set('csv', this.csvGenerator);
    this.generators.set('json', this.jsonGenerator);
  }

  private registerTemplates() {
    // Alert summary template
    this.templates.set('alert-summary', {
      name: 'Alert Summary',
      description: 'Summarizes alerts over a time period',
      dataProvider: async (params) => {
        const { startDate, endDate } = params;
        
        // Get alerts in the time range
        const alertsData = await this.alertsService.findAll({
          startDate,
          endDate,
          limit: 1000,
        });
        
        // Calculate summaries
        const severityCounts = {};
        const statusCounts = {};
        const sourceCounts = {};
        const typeCounts = {};
        
        for (const alert of alertsData.data) {
          // Count by severity
          severityCounts[alert.severity] = (severityCounts[alert.severity] || 0) + 1;
          
          // Count by status
          statusCounts[alert.status] = (statusCounts[alert.status] || 0) + 1;
          
          // Count by source
          sourceCounts[alert.source] = (sourceCounts[alert.source] || 0) + 1;
          
          // Count by type
          if (alert.type) {
            typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
          }
        }
        
        return {
          timeRange: {
            startDate,
            endDate,
          },
          summary: {
            total: alertsData.total,
            bySeverity: severityCounts,
            byStatus: statusCounts,
            bySource: sourceCounts,
            byType: typeCounts,
          },
          alerts: alertsData.data,
        };
      },
      supportedFormats: ['pdf', 'csv', 'json'],
    });
    
    // Entity risk report template
    this.templates.set('entity-risk', {
      name: 'Entity Risk Report',
      description: 'Report on entity risk levels and vulnerabilities',
      dataProvider: async (params) => {
        const { riskThreshold = 50 } = params;
        
        // Get entities with risk above threshold
        const entitiesData = await this.entitiesService.findAll({
          riskScoreMin: riskThreshold,
          sort: 'riskScore',
          order: 'desc',
          limit: 100,
        });
        
        // Get top vulnerable entities
        const stats = await this.entitiesService.getEntityStatistics();
        
        return {
          summary: {
            threshold: riskThreshold,
            total: entitiesData.total,
            highRiskCount: entitiesData.data.filter(e => e.riskScore >= 75).length,
            mediumRiskCount: entitiesData.data.filter(e => e.riskScore >= 50 && e.riskScore < 75).length,
          },
          entities: entitiesData.data,
          topVulnerable: stats.topVulnerableEntities,
        };
      },
      supportedFormats: ['pdf', 'json'],
    });
    
    // Security incident report template
    this.templates.set('security-incident', {
      name: 'Security Incident Report',
      description: 'Detailed report about a security incident',
      dataProvider: async (params) => {
        const { alertId } = params;
        
        if (!alertId) {
          throw new Error('Alert ID is required for security incident report');
        }
        
        // Get alert details
        const alert = await this.alertsService.findOne(alertId);
        
        // Get related events
        const events = await Promise.all(
          (alert.eventIds || []).map(id => this.eventsService.findOne(id))
        );
        
        // Get entity details if available
        let entity = null;
        if (alert.entityId) {
          entity = await this.entitiesService.findOne(alert.entityId);
        }
        
        return {
          incident: {
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            status: alert.status,
            source: alert.source,
            type: alert.type,
            timestamp: alert.timestamp,
            tactic: alert.tactic,
            technique: alert.technique,
          },
          entity,
          events,
        };
      },
      supportedFormats: ['pdf'],
    });
  }

  /**
   * Generate a report using the specified template and format
   * @param templateId Template ID
   * @param format Output format (pdf, csv, json)
   * @param params Template parameters
   * @returns The generated report
   */
  async generateReport(templateId: string, format: string, params: any): Promise<any> {
    try {
      // Check if template exists
      const template = this.templates.get(templateId);
      
      if (!template) {
        throw new Error(`Report template '${templateId}' not found`);
      }
      
      // Check if format is supported by the template
      if (!template.supportedFormats.includes(format)) {
        throw new Error(`Format '${format}' is not supported by the '${templateId}' template`);
      }
      
      // Check if generator exists
      const generator = this.generators.get(format);
      
      if (!generator) {
        throw new Error(`Report generator for format '${format}' not found`);
      }
      
      // Get data for the report
      this.logger.log(`Generating ${format} report using ${templateId} template`, 'ReportGeneratorService');
      const data = await template.dataProvider(params);
      
      // Generate the report
      const report = await generator.generate(template, data, params);
      
      return report;
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`, error.stack, 'ReportGeneratorService');
      throw error;
    }
  }

  /**
   * Get available report templates
   */
  getAvailableTemplates(): any[] {
    const templates = [];
    
    for (const [id, template] of this.templates.entries()) {
      templates.push({
        id,
        name: template.name,
        description: template.description,
        supportedFormats: template.supportedFormats,
      });
    }
    
    return templates;
  }

  /**
   * Get available report formats
   */
  getAvailableFormats(): string[] {
    return Array.from(this.generators.keys());
  }
}