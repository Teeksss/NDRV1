import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { SecurityConfigService } from './config/security-config.service';
import { SecurityMonitoringService } from './monitoring/security-monitoring.service';
import { SecurityAlertService } from './alert/security-alert.service';
import { SecurityAuditService } from './audit/security-audit.service';
import { SecurityMetricsService } from './metrics/security-metrics.service';
import { WebSocketGateway } from './websocket/security.gateway';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'SecurityAlert', schema: SecurityAlertSchema },
            { name: 'SecurityAudit', schema: SecurityAuditSchema },
            { name: 'SecurityMetrics', schema: SecurityMetricsSchema },
            { name: 'SecurityConfig', schema: SecurityConfigSchema }
        ])
    ],
    controllers: [SecurityController],
    providers: [
        SecurityService,
        SecurityConfigService,
        SecurityMonitoringService,
        SecurityAlertService,
        SecurityAuditService,
        SecurityMetricsService,
        WebSocketGateway,
        {
            provide: 'SECURITY_CONFIG',
            useValue: {
                version: '3.2.4',
                timestamp: '2025-05-16 07:04:06',
                maintainer: 'Teeksss',
                buildNumber: '202505160704',
                features: {
                    realTimeMonitoring: true,
                    mlDetection: true,
                    automatedResponse: true,
                    threatIntelligence: true
                }
            }
        }
    ],
    exports: [SecurityService, SecurityConfigService]
})
export class SecurityModule {}