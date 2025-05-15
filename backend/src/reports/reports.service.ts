import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AlertsService } from '../alerts/alerts.service';
import { EventsService } from '../events/events.service';
import { EntitiesService } from '../entities/entities.service';
import { NetworkService } from '../network/network.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private alertsService: AlertsService,
    private eventsService: EventsService,
    private entitiesService: EntitiesService,
    private networkService: NetworkService,
  ) {}

  async create(createReportDto: CreateReportDto, userId: string): Promise<Report> {
    try {
      // Generate report data based on type
      const reportData = await this.generateReportData(createReportDto);
      
      // Create new report
      const newReport = new this.reportModel({
        ...createReportDto,
        data: reportData,
        createdBy: userId,
        createdAt: new Date(),
      });
      
      return await newReport.save();
    } catch (error) {
      throw new BadRequestException(`Failed to create report: ${error.message}`);
    }
  }

  async findAll(query: any = {}): Promise<Report[]> {
    const {
      type,
      startDate,
      endDate,
      status,
      sort = 'createdAt',
      order = 'desc',
      limit = 100,
      page = 1,
    } = query;

    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

    return this.reportModel
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();
    
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    
    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto, userId: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();
    
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    
    // Update report fields
    Object.assign(report, {
      ...updateReportDto,
      updatedBy: userId,
      updatedAt: new Date(),
    });
    
    return await report.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.reportModel.deleteOne({ _id: id }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }

  async generatePdf(id: string): Promise<Buffer> {
    const report = await this.findOne(id);
    
    // In a real application, you would use a PDF generation library
    // This is a placeholder implementation
    const pdfContent = Buffer.from(`Report: ${report.name}\nGenerated: ${new Date().toISOString()}`);
    
    return pdfContent;
  }

  async generateExcel(id: string): Promise<Buffer> {
    const report = await this.findOne(id);
    
    // In a real application, you would use an Excel generation library
    // This is a placeholder implementation
    const excelContent = Buffer.from(`Report: ${report.name}\nGenerated: ${new Date().toISOString()}`);
    
    return excelContent;
  }

  private async generateReportData(reportDto: CreateReportDto): Promise<any> {
    const { type, parameters } = reportDto;
    
    switch (type) {
      case 'security_summary':
        return this.generateSecuritySummaryReport(parameters);
      
      case 'alert_analysis':
        return this.generateAlertAnalysisReport(parameters);
      
      case 'network_traffic':
        return this.generateNetworkTrafficReport(parameters);
      
      case 'entity_inventory':
        return this.generateEntityInventoryReport(parameters);
      
      case 'compliance':
        return this.generateComplianceReport(parameters);
      
      default:
        throw new BadRequestException(`Unsupported report type: ${type}`);
    }
  }

  private async generateSecuritySummaryReport(parameters: any): Promise<any> {
    const { startDate, endDate } = parameters;
    
    // Get alerts statistics
    const alertsStats = await this.alertsService.getAlertStatistics(startDate, endDate);
    
    // Get events statistics
    const eventsStats = await this.eventsService.getEventStatistics(startDate, endDate);
    
    // Get top threats
    const topThreats = await this.alertsService.getTopThreats(startDate, endDate);
    
    // Get security score
    const securityScore = this.calculateSecurityScore(alertsStats);
    
    return {
      startDate,
      endDate,
      alertsStats,
      eventsStats,
      topThreats,
      securityScore,
      generatedAt: new Date(),
    };
  }

  private async generateAlertAnalysisReport(parameters: any): Promise<any> {
    const { startDate, endDate, severity } = parameters;
    
    // Get alerts by severity
    const alertsBySeverity = await this.alertsService.getAlertsBySeverity(startDate, endDate);
    
    // Get alerts trend
    const alertsTrend = await this.alertsService.getAlertTrend(startDate, endDate, 'day');
    
    // Get alerts by category
    const alertsByCategory = await this.alertsService.getAlertsByCategory(startDate, endDate);
    
    // Get MITRE ATT&CK mapping
    const mitreMapping = await this.alertsService.getAlertsMitreMapping(startDate, endDate);
    
    // Get top affected entities
    const topAffectedEntities = await this.alertsService.getTopAffectedEntities(startDate, endDate);
    
    return {
      startDate,
      endDate,
      alertsBySeverity,
      alertsTrend,
      alertsByCategory,
      mitreMapping,
      topAffectedEntities,
      generatedAt: new Date(),
    };
  }

  private async generateNetworkTrafficReport(parameters: any): Promise<any> {
    const { startDate, endDate, interval } = parameters;
    
    // Get bandwidth usage
    const bandwidthUsage = await this.networkService.getBandwidthUsage(startDate, endDate, interval);
    
    // Get protocol distribution
    const protocolDistribution = await this.networkService.getProtocolDistribution(startDate, endDate);
    
    // Get top sources
    const topSources = await this.networkService.getTopSources(startDate, endDate, 10);
    
    // Get top destinations
    const topDestinations = await this.networkService.getTopDestinations(startDate, endDate, 10);
    
    // Get geographical distribution
    const geoDistribution = await this.networkService.getGeoDistribution(startDate, endDate);
    
    return {
      startDate,
      endDate,
      bandwidthUsage,
      protocolDistribution,
      topSources,
      topDestinations,
      geoDistribution,
      generatedAt: new Date(),
    };
  }

  private async generateEntityInventoryReport(parameters: any): Promise<any> {
    const { entityTypes } = parameters;
    
    // Get entity statistics
    const entityStats = await this.entitiesService.getEntityStatistics();
    
    // Get entities by type
    const entitiesByType = await this.entitiesService.getEntitiesByType(entityTypes);
    
    // Get entity status distribution
    const statusDistribution = await this.entitiesService.getDistributionByStatus();
    
    return {
      entityStats,
      entitiesByType,
      statusDistribution,
      generatedAt: new Date(),
    };
  }

  private async generateComplianceReport(parameters: any): Promise<any> {
    const { framework, startDate, endDate } = parameters;
    
    // This would be implemented with specific compliance checking logic
    // This is a placeholder
    return {
      framework,
      startDate,
      endDate,
      complianceScore: 85,
      findings: [
        {
          control: 'AC-2',
          title: 'Account Management',
          status: 'compliant',
          evidence: 'User accounts are properly managed and audited',
        },
        {
          control: 'AU-2',
          title: 'Audit Events',
          status: 'non-compliant',
          evidence: 'Some audit logs are missing for the period',
          recommendation: 'Enable comprehensive logging',
        },
        // More findings would be added here
      ],
      generatedAt: new Date(),
    };
  }

  private calculateSecurityScore(alertsStats: any): number {
    // Simple algorithm to calculate security score based on alerts
    const { critical, high, medium, low } = alertsStats;
    
    // Weight factors for each severity level
    const criticalWeight = 10;
    const highWeight = 5;
    const mediumWeight = 2;
    const lowWeight = 1;
    
    // Calculate weighted sum
    const totalWeight = 
      (critical || 0) * criticalWeight +
      (high || 0) * highWeight +
      (medium || 0) * mediumWeight +
      (low || 0) * lowWeight;
    
    // Calculate score (higher weight means lower score)
    const maxWeight = 100; // Threshold for maximum weight
    const score = Math.max(0, 100 - (totalWeight / maxWeight) * 100);
    
    return Math.round(score);
  }
}