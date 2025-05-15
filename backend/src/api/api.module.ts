import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { AlertsController } from './controllers/alerts.controller';
import { AuthController } from './controllers/auth.controller';
import { CorrelationRulesController } from './controllers/correlation-rules.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { EntityController } from './controllers/entity.controller';
import { EventsController } from './controllers/events.controller';
import { FlowAnalysisController } from './controllers/flow-analysis.controller';
import { HealthCheckController } from './controllers/health-check.controller';
import { IOCController } from './controllers/ioc.controller';
import { ReportsController } from './controllers/reports.controller';
import { UserController } from './controllers/user.controller';
import { TrafficAnomalyController } from './controllers/traffic-anomaly.controller';
import { NotificationController } from './controllers/notification.controller';
import { SystemMonitorController } from './controllers/system-monitor.controller';

// Dependencies
import { AlertsModule } from '../alerts/alerts.module';
import { AuthModule } from '../auth/auth.module';
import { CorrelationModule } from '../correlation/correlation.module';
import { DetectionModule } from '../detection/detection.module';
import { EntityModule } from '../entity/entity.module';
import { EventsModule } from '../events/events.module';
import { HealthModule } from '../health/health.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { NetworkModule } from '../network/network.module';
import { NotificationModule } from '../notification/notification.module';
import { ReportsModule } from '../reports/reports.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    AlertsModule,
    AuthModule,
    CorrelationModule,
    DetectionModule,
    EntityModule,
    EventsModule,
    HealthModule,
    MonitoringModule,
    NetworkModule,
    NotificationModule,
    ReportsModule,
    UsersModule
  ],
  controllers: [
    AlertsController,
    AuthController,
    CorrelationRulesController,
    DashboardController,
    EntityController,
    EventsController,
    FlowAnalysisController,
    HealthCheckController,
    IOCController,
    ReportsController,
    UserController,
    TrafficAnomalyController,
    NotificationController,
    SystemMonitorController
  ],
  exports: []
})
export class ApiModule {}