import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Services
import { DashboardService } from './dashboard.service';
import { LiveMonitoringService } from './live-monitoring.service';
import { SystemMonitorService } from './system-monitor.service';

// Dependencies
import { AlertsModule } from '../alerts/alerts.module';
import { EntityModule } from '../entity/entity.module';
import { EventsModule } from '../events/events.module';
import { NetworkModule } from '../network/network.module';
import { DetectionModule } from '../detection/detection.module';

// Entities
import { SystemMetric, SystemMetricSchema } from './entities/system-metric.entity';
import { MonitoringAlert, MonitoringAlertSchema } from './entities/monitoring-alert.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: SystemMetric.name, schema: SystemMetricSchema },
      { name: MonitoringAlert.name, schema: MonitoringAlertSchema }
    ]),
    AlertsModule,
    EntityModule,
    EventsModule,
    NetworkModule,
    DetectionModule
  ],
  providers: [
    DashboardService,
    LiveMonitoringService,
    SystemMonitorService
  ],
  exports: [
    DashboardService,
    LiveMonitoringService,
    SystemMonitorService
  ]
})
export class MonitoringModule {}