import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertService } from '../alerts/alert.service';
import { EntityService } from '../entity/entity.service';
import { EventService } from '../events/event.service';
import { FlowService } from '../network/flow-analyzer/flow.service';
import { IOCScannerService } from '../detection/ioc/ioc-scanner.service';
import { TrafficAnomalyDetectorService } from '../detection/network/traffic-anomaly-detector.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private dashboardCacheTime = 60000; // 1 minute
  private dashboardCache = {
    overview: {
      data: null,
      timestamp: 0
    },
    security: {
      data: null,
      timestamp: 0
    },
    network: {
      data: null,
      timestamp: 0
    }
  };

  constructor(
    private configService: ConfigService,
    private alertService: AlertService,
    private entityService: EntityService,
    private eventService: EventService,
    private flowService: FlowService,
    private iocService: IOCScannerService,
    private anomalyService: TrafficAnomalyDetectorService
  ) {
    // Set cache time from config if available
    const cacheTime = this.configService.get('monitoring.dashboardCacheTimeMs');
    if (cacheTime) {
      this.dashboardCacheTime = cacheTime;
    }
  }

  /**
   * Get dashboard overview data
   */
  async getDashboardOverview() {
    try {
      // Check cache
      const now = Date.now();
      if (this.dashboardCache.overview.data && 
          now - this.dashboardCache.overview.timestamp < this.dashboardCacheTime) {
        return this.dashboardCache.overview.data;
      }

      // Get alert statistics
      const alertStats = await this.alertService.getAlertStatistics(7);

      // Get top entities
      const entityStats = await this.entityService.getStatistics();

      // Get event statistics
      const eventStats = await this.eventService.getEventStatistics(24);

      // Get flow statistics
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const flowStats = await this.flowService.getFlowStatistics(oneDayAgo);

      // Compile overview data
      const overview = {
        alerts: {
          total: alertStats.totalAlerts,
          bySeverity: alertStats.bySeverity,
          recent: alertStats.recentAlerts
        },
        entities: {
          total: entityStats.totalEntities,
          byType: entityStats.byType,
          recentlySeen: entityStats.recentlySeen
        },
        events: {
          total: eventStats.totalEvents,
          byType: eventStats.byType,
          hourlyData: eventStats.hourlyData
        },
        traffic: {
          totalFlows: flowStats.totalFlows,
          totalBytes: flowStats.totalBytes,
          byProtocol: flowStats.byProtocol
        }
      };

      // Update cache
      this.dashboardCache.overview = {
        data: overview,
        timestamp: now
      };

      return overview;
    } catch (error) {
      this.logger.error(`Error getting dashboard overview: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard() {
    try {
      // Check cache
      const now = Date.now();
      if (this.dashboardCache.security.data && 
          now - this.dashboardCache.security.timestamp < this.dashboardCacheTime) {
        return this.dashboardCache.security.data;
      }

      // Get alert statistics
      const alertStats = await this.alertService.getAlertStatistics(7);

      // Get IOC statistics
      const iocStats = await this.iocService.getStatistics();

      // Get traffic anomaly statistics
      const anomalyStats = await this.anomalyService.getAnomalyStatistics(7);

      // Get top vulnerable entities
      const vulnerableEntities = await this.getTopVulnerableEntities();

      // Compile security dashboard data
      const securityDashboard = {
        alerts: {
          total: alertStats.totalAlerts,
          bySeverity: alertStats.bySeverity,
          bySource: alertStats.bySource,
          dailyData: alertStats.dailyData
        },
        ioc: {
          totalIOCs: iocStats.totalIOCs,
          totalMatches: iocStats.totalMatches,
          recentMatches: iocStats.recentMatches,
          iocsByType: iocStats.iocsByType
        },
        anomalies: {
          totalAnomalies: anomalyStats.totalAnomalies,
          bySeverity: anomalyStats.bySeverity,
          byType: anomalyStats.byType,
          dailyData: anomalyStats.dailyData
        },
        vulnerableEntities
      };

      // Update cache
      this.dashboardCache.security = {
        data: securityDashboard,
        timestamp: now
      };

      return securityDashboard;
    } catch (error) {
      this.logger.error(`Error getting security dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get network dashboard data
   */
  async getNetworkDashboard() {
    try {
      // Check cache
      const now = Date.now();
      if (this.dashboardCache.network.data && 
          now - this.dashboardCache.network.timestamp < this.dashboardCacheTime) {
        return this.dashboardCache.network.data;
      }

      // Get time range
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get flow statistics
      const flowStats = await this.flowService.getFlowStatistics(oneDayAgo);

      // Get top sources
      const topSources = await this.flowService.getTopSources(oneDayAgo, 10);

      // Get top destinations
      const topDestinations = await this.flowService.getTopDestinations(oneDayAgo, 10);

      // Get top conversations
      const topConversations = await this.flowService.getTopConversations(oneDayAgo, 10);

      // Get top ports
      const topPorts = await this.flowService.getTopPorts(oneDayAgo, 10);

      // Get hourly traffic data
      const hourlyTraffic = await this.flowService.getHourlyTrafficStats(oneDayAgo);

      // Compile network dashboard data
      const networkDashboard = {
        overview: {
          totalFlows: flowStats.totalFlows,
          totalBytes: flowStats.totalBytes,
          totalPackets: flowStats.totalPackets,
          uniqueIPs: flowStats.uniqueIPs
        },
        topSources,
        topDestinations,
        topConversations,
        topPorts,
        hourlyTraffic,
        protocolDistribution: flowStats.byProtocol,
        portDistribution: flowStats.byPort
      };

      // Update cache
      this.dashboardCache.network = {
        data: networkDashboard,
        timestamp: now
      };

      return networkDashboard;
    } catch (error) {
      this.logger.error(`Error getting network dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get top vulnerable entities
   */
  private async getTopVulnerableEntities(limit: number = 5) {
    try {
      // Get entities with vulnerability information
      const entities = await this.entityService.getEntities(
        { 'vulnerabilityStatus.vulnerabilityCount': { $gt: 0 } },
        { 
          limit, 
          sort: { 
            'vulnerabilityStatus.vulnerabilityCount': -1,
            'vulnerabilityStatus.severityCounts.critical': -1 
          } 
        }
      );

      return entities.map(entity => ({
        id: entity._id,
        name: entity.name,
        type: entity.type,
        ipAddress: entity.ipAddress,
        vulnerabilityCount: entity.vulnerabilityStatus?.vulnerabilityCount || 0,
        criticalCount: entity.vulnerabilityStatus?.severityCounts?.critical || 0,
        highCount: entity.vulnerabilityStatus?.severityCounts?.high || 0,
        riskLevel: entity.vulnerabilityStatus?.riskLevel || 'unknown'
      }));
    } catch (error) {
      this.logger.error(`Error getting top vulnerable entities: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Invalidate dashboard cache
   */
  invalidateCache(dashboard?: string) {
    if (dashboard) {
      if (this.dashboardCache[dashboard]) {
        this.dashboardCache[dashboard].timestamp = 0;
      }
    } else {
      // Invalidate all caches
      Object.keys(this.dashboardCache).forEach(key => {
        this.dashboardCache[key].timestamp = 0;
      });
    }
  }
}