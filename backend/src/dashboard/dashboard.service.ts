import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dashboard, DashboardDocument } from './schemas/dashboard.schema';
import { Widget, WidgetDocument } from './schemas/widget.schema';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { PositionWidgetsDto } from './dto/position-widgets.dto';
import { AlertsService } from '../alerts/alerts.service';
import { EventsService } from '../events/events.service';
import { EntitiesService } from '../entities/entities.service';
import { NetworkService } from '../network/network.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Dashboard.name) private dashboardModel: Model<DashboardDocument>,
    @InjectModel(Widget.name) private widgetModel: Model<WidgetDocument>,
    private alertsService: AlertsService,
    private eventsService: EventsService,
    private entitiesService: EntitiesService,
    private networkService: NetworkService,
    private logger: LoggerService,
  ) {}

  async createDashboard(userId: string, createDashboardDto: CreateDashboardDto): Promise<Dashboard> {
    try {
      // Check if a dashboard with this name already exists for the user
      const existingDashboard = await this.dashboardModel.findOne({
        userId,
        name: createDashboardDto.name,
      }).exec();
      
      if (existingDashboard) {
        throw new BadRequestException(`Dashboard with name "${createDashboardDto.name}" already exists`);
      }
      
      // Create dashboard
      const dashboard = new this.dashboardModel({
        ...createDashboardDto,
        userId,
      });
      
      return dashboard.save();
    } catch (error) {
      this.logger.error(`Error creating dashboard: ${error.message}`, error.stack, 'DashboardService');
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to create dashboard: ${error.message}`);
    }
  }

  async findAllDashboards(userId: string): Promise<Dashboard[]> {
    return this.dashboardModel.find({ userId }).sort({ isDefault: -1, name: 1 }).exec();
  }

  async findDashboardById(userId: string, id: string): Promise<Dashboard> {
    const dashboard = await this.dashboardModel.findOne({ _id: id, userId }).exec();
    
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }
    
    return dashboard;
  }

  async findDefaultDashboard(userId: string): Promise<Dashboard> {
    // Find default dashboard
    let dashboard = await this.dashboardModel.findOne({ userId, isDefault: true }).exec();
    
    // If no default dashboard exists, get the first one or create a new one
    if (!dashboard) {
      dashboard = await this.dashboardModel.findOne({ userId }).exec();
      
      if (!dashboard) {
        // Create a default dashboard with standard widgets
        dashboard = await this.createDefaultDashboard(userId);
      }
      
      // Set this dashboard as default
      dashboard.isDefault = true;
      await dashboard.save();
    }
    
    return dashboard;
  }

  async updateDashboard(userId: string, id: string, updateDashboardDto: UpdateDashboardDto): Promise<Dashboard> {
    const dashboard = await this.findDashboardById(userId, id);
    
    // If setting this dashboard as default, unset other defaults
    if (updateDashboardDto.isDefault) {
      await this.dashboardModel.updateMany(
        { userId, _id: { $ne: id } },
        { $set: { isDefault: false } }
      ).exec();
    }
    
    // Update dashboard properties
    Object.assign(dashboard, updateDashboardDto);
    
    return dashboard.save();
  }

  async deleteDashboard(userId: string, id: string): Promise<void> {
    const dashboard = await this.findDashboardById(userId, id);
    
    // If this is the last dashboard, don't allow deletion
    const count = await this.dashboardModel.countDocuments({ userId }).exec();
    
    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last dashboard');
    }
    
    // Delete all widgets belonging to this dashboard
    await this.widgetModel.deleteMany({ dashboardId: id }).exec();
    
    // Delete the dashboard
    await dashboard.remove();
    
    // If this was the default dashboard, set another one as default
    if (dashboard.isDefault) {
      const newDefault = await this.dashboardModel.findOne({ userId }).exec();
      
      if (newDefault) {
        newDefault.isDefault = true;
        await newDefault.save();
      }
    }
  }

  async createWidget(userId: string, dashboardId: string, createWidgetDto: CreateWidgetDto): Promise<Widget> {
    // Verify dashboard exists and belongs to user
    await this.findDashboardById(userId, dashboardId);
    
    // Create widget
    const widget = new this.widgetModel({
      ...createWidgetDto,
      dashboardId,
      userId,
    });
    
    return widget.save();
  }

  async findAllWidgets(userId: string, dashboardId: string): Promise<Widget[]> {
    // Verify dashboard exists and belongs to user
    await this.findDashboardById(userId, dashboardId);
    
    return this.widgetModel.find({ dashboardId }).exec();
  }

  async findWidgetById(userId: string, id: string): Promise<Widget> {
    const widget = await this.widgetModel.findById(id).exec();
    
    if (!widget) {
      throw new NotFoundException(`Widget with ID ${id} not found`);
    }
    
    // Verify widget belongs to user
    const dashboard = await this.dashboardModel.findOne({
      _id: widget.dashboardId,
      userId,
    }).exec();
    
    if (!dashboard) {
      throw new NotFoundException(`Widget with ID ${id} not found for this user`);
    }
    
    return widget;
  }

  async updateWidget(userId: string, id: string, updateWidgetDto: UpdateWidgetDto): Promise<Widget> {
    const widget = await this.findWidgetById(userId, id);
    
    // Update widget properties
    Object.assign(widget, updateWidgetDto);
    
    return widget.save();
  }

  async deleteWidget(userId: string, id: string): Promise<void> {
    const widget = await this.findWidgetById(userId, id);
    await widget.remove();
  }

  async updateWidgetPositions(
    userId: string,
    dashboardId: string,
    positionWidgetsDto: PositionWidgetsDto
  ): Promise<void> {
    // Verify dashboard exists and belongs to user
    await this.findDashboardById(userId, dashboardId);
    
    // Update positions for each widget
    const updates = positionWidgetsDto.widgets.map(item => {
      return this.widgetModel.updateOne(
        { _id: item.id, dashboardId },
        { $set: { position: item.position } }
      ).exec();
    });
    
    await Promise.all(updates);
  }

  async getWidgetData(userId: string, widgetId: string, params: any): Promise<any> {
    const widget = await this.findWidgetById(userId, widgetId);
    
    // Get data based on widget type
    switch (widget.type) {
      case 'alert_count':
        return this.getAlertCount(params);
      case 'alert_severity':
        return this.getAlertSeverity(params);
      case 'alert_trend':
        return this.getAlertTrend(params);
      case 'event_count':
        return this.getEventCount(params);
      case 'event_trend':
        return this.getEventTrend(params);
      case 'top_entities':
        return this.getTopEntities(params);
      case 'network_traffic':
        return this.getNetworkTraffic(params);
      case 'geo_map':
        return this.getGeoMap(params);
      case 'custom':
        // For custom widgets, use the configuration to determine what data to fetch
        return this.getCustomData(widget.config, params);
      default:
        throw new BadRequestException(`Unknown widget type: ${widget.type}`);
    }
  }

  // Helper methods for widget data retrieval
  private async getAlertCount(params: any): Promise<any> {
    const { startDate, endDate, severity } = params;
    
    // Build filter
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    // Get alerts matching filter
    const alerts = await this.alertsService.findAll(filter);
    
    // Return count and stats
    return {
      count: alerts.length,
      byStatus: this.groupBy(alerts, 'status'),
      bySeverity: this.groupBy(alerts, 'severity'),
    };
  }

  private async getAlertSeverity(params: any): Promise<any> {
    const { startDate, endDate } = params;
    
    return this.alertsService.getAlertsBySeverity(startDate, endDate);
  }

  private async getAlertTrend(params: any): Promise<any> {
    const { startDate, endDate, interval = 'day' } = params;
    
    return this.alertsService.getAlertTrend(startDate, endDate, interval);
  }

  private async getEventCount(params: any): Promise<any> {
    const { startDate, endDate, type } = params;
    
    // Build filter
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    if (type) {
      filter.type = type;
    }
    
    // Get events matching filter
    const events = await this.eventsService.findAll(filter);
    
    // Return count and stats
    return {
      count: events.length,
      byType: this.groupBy(events, 'type'),
    };
  }

  private async getEventTrend(params: any): Promise<any> {
    const { startDate, endDate, interval = 'day' } = params;
    
    return this.eventsService.getEventTrend(startDate, endDate, interval);
  }

  private async getTopEntities(params: any): Promise<any> {
    const { startDate, endDate, limit = 10 } = params;
    
    return this.alertsService.getTopAffectedEntities(startDate, endDate, limit);
  }

  private async getNetworkTraffic(params: any): Promise<any> {
    const { startDate, endDate, interval = 'hour' } = params;
    
    return this.networkService.getBandwidthUsage(startDate, endDate, interval);
  }

  private async getGeoMap(params: any): Promise<any> {
    const { startDate, endDate } = params;
    
    // Get geo-located alerts
    const alerts = await this.alertsService.getAlertsByGeoLocation(startDate, endDate);
    
    // Get geo traffic data
    const traffic = await this.networkService.getGeoDistribution(startDate, endDate);
    
    return {
      alerts,
      traffic,
    };
  }

  private async getCustomData(config: any, params: any): Promise<any> {
    // Handle custom widget data retrieval based on config
    const { dataSource, metric, filters } = config;
    
    switch (dataSource) {
      case 'alerts':
        return this.alertsService.findAll({ ...filters, ...params });
      case 'events':
        return this.eventsService.findAll({ ...filters, ...params });
      case 'entities':
        return this.entitiesService.findAll({ ...filters, ...params });
      case 'network':
        return this.networkService.getFlows({ ...filters, ...params });
      default:
        throw new BadRequestException(`Unknown data source: ${dataSource}`);
    }
  }

  // Helper method to create a default dashboard for new users
  private async createDefaultDashboard(userId: string): Promise<Dashboard> {
    // Create dashboard
    const dashboard = new this.dashboardModel({
      name: 'Genel Bakış',
      description: 'Varsayılan dashboard',
      userId,
      isDefault: true,
    });
    
    await dashboard.save();
    
    // Create default widgets
    const defaultWidgets = [
      {
        title: 'Alarm Sayısı',
        type: 'alert_count',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {},
        dashboardId: dashboard.id,
        userId,
      },
      {
        title: 'Alarm Önem Seviyesi',
        type: 'alert_severity',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {},
        dashboardId: dashboard.id,
        userId,
      },
      {
        title: 'Alarm Trendi',
        type: 'alert_trend',
        position: { x: 6, y: 0, w: 6, h: 2 },
        config: { interval: 'day' },
        dashboardId: dashboard.id,
        userId,
      },
      {
        title: 'En Çok Etkilenen Varlıklar',
        type: 'top_entities',
        position: { x: 0, y: 2, w: 4, h: 3 },
        config: { limit: 10 },
        dashboardId: dashboard.id,
        userId,
      },
      {
        title: 'Ağ Trafiği',
        type: 'network_traffic',
        position: { x: 4, y: 2, w: 8, h: 3 },
        config: { interval: 'hour' },
        dashboardId: dashboard.id,
        userId,
      },
      {
        title: 'Coğrafi Dağılım',
        type: 'geo_map',
        position: { x: 0, y: 5, w: 12, h: 4 },
        config: {},
        dashboardId: dashboard.id,
        userId,
      },
    ];
    
    // Create widgets in database
    await this.widgetModel.insertMany(defaultWidgets);
    
    return dashboard;
  }

  // Helper method to group data by a key
  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const value = item[key] || 'unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }
}