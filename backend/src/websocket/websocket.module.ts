import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Gateways
import { LiveEventsGateway } from './live-events.gateway';

// Dependencies
import { AuthModule } from '../auth/auth.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    MonitoringModule
  ],
  providers: [
    LiveEventsGateway
  ],
  exports: [
    LiveEventsGateway
  ]
})
export class WebsocketModule {}