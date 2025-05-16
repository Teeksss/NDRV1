import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SecurityWebSocketGateway } from '../websocket/security.gateway';
import { SecurityConfigService } from '../config/security-config.service';

@Injectable()
export class SecurityAlertService {
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:28:01',
        maintainer: 'Teeksss',
        version: '3.3.3',
        buildNumber: '202505160728'
    };

    constructor(
        @InjectModel('SecurityAlert')
        private readonly alertModel: Model<SecurityAlert>,
        private readonly wsGateway: SecurityWebSocketGateway,
        private readonly configService: SecurityConfigService
    ) {
        this.initializeAlertService();
    }

    private async initializeAlertService(): Promise<void> {
        try {
            await this.cleanupOldAlerts();
            await this.subscribeToAlertEvents();
            console.log('Alert service initialized successfully');
        } catch (error) {
            console.error('Alert service initialization failed:', error);
            throw error;
        }
    }

    async createAlert(alertData: CreateAlertDto): Promise<SecurityAlert> {
        try {
            const config = await this.configService.getConfig();
            const enrichedAlert = this.enrichAlertData(alertData);
            
            if (this.shouldAutoEscalate(enrichedAlert, config)) {
                enrichedAlert.status = 'escalated';
                enrichedAlert.escalatedAt = new Date('2025-05-16 07:28:01').toISOString();
            }

            const alert = new this.alertModel(enrichedAlert);
            await alert.save();

            await this.notifyAlert(alert);
            return alert;
        } catch (error) {
            console.error('Alert creation failed:', error);
            throw error;
        }
    }

    async updateAlert(id: string, updateData: UpdateAlertDto): Promise<SecurityAlert> {
        try {
            const alert = await this.alertModel.findByIdAndUpdate(
                id,
                {
                    ...updateData,
                    lastUpdated: new Date('2025-05-16 07:28:01').toISOString(),
                    updatedBy: this.serviceInfo.maintainer
                },
                { new: true }
            ).exec();

            if (!alert) {
                throw new Error('Alert not found');
            }

            await this.notifyAlertUpdate(alert);
            return alert;
        } catch (error) {
            console.error('Alert update failed:', error);
            throw error;
        }
    }

    async getActiveAlerts(filters?: AlertFilters): Promise<SecurityAlert[]> {
        try {
            const query = this.buildAlertQuery(filters);
            return this.alertModel
                .find(query)
                .sort({ severity: -1, createdAt: -1 })
                .exec();
        } catch (error) {
            console.error('Active alerts retrieval failed:', error);
            throw error;
        }
    }

    async acknowledgeAlert(id: string, acknowledgeData: AcknowledgeAlertDto): Promise<SecurityAlert> {
        try {
            const alert = await this.alertModel.findByIdAndUpdate(
                id,
                {
                    status: 'acknowledged',
                    acknowledgedAt: new Date('2025-05-16 07:28:01').toISOString(),
                    acknowledgedBy: acknowledgeData.acknowledgedBy,
                    acknowledgementNotes: acknowledgeData.notes
                },
                { new: true }
            ).exec();

            if (!alert) {
                throw new Error('Alert not found');
            }

            await this.notifyAlertAcknowledgement(alert);
            return alert;
        } catch (error) {
            console.error('Alert acknowledgement failed:', error);
            throw error;
        }
    }

    async resolveAlert(id: string, resolveData: ResolveAlertDto): Promise<SecurityAlert> {
        try {
            const alert = await this.alertModel.findByIdAndUpdate(
                id,
                {
                    status: 'resolved',
                    resolvedAt: new Date('2025-05-16 07:28:01').toISOString(),
                    resolvedBy: resolveData.resolvedBy,
                    resolution: resolveData.resolution,
                    resolutionNotes: resolveData.notes
                },
                { new: true }
            ).exec();

            if (!alert) {
                throw new Error('Alert not found');
            }

            await this.notifyAlertResolution(alert);
            return alert;
        } catch (error) {
            console.error('Alert resolution failed:', error);
            throw error;
        }
    }

    private enrichAlertData(alertData: CreateAlertDto): any {
        return {
            ...alertData,
            createdAt: new Date('2025-05-16 07:28:01').toISOString(),
            status: 'active',
            creator: this.serviceInfo.maintainer,
            metadata: {
                ...alertData.metadata,
                serviceVersion: this.serviceInfo.version,
                buildNumber: this.serviceInfo.buildNumber
            }
        };
    }

    private shouldAutoEscalate(alert: any, config: any): boolean {
        return (
            alert.severity === 'critical' ||
            (alert.severity === 'high' && config.alerts.autoEscalation)
        );
    }

    private async notifyAlert(alert: SecurityAlert): Promise<void> {
        this.wsGateway.notifyClients('newAlert', {
            alert,
            timestamp: new Date('2025-05-16 07:28:01').toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    private async notifyAlertUpdate(alert: SecurityAlert): Promise<void> {
        this.wsGateway.notifyClients('alertUpdated', {
            alert,
            timestamp: new Date('2025-05-16 07:28:01').toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    private async notifyAlertAcknowledgement(alert: SecurityAlert): Promise<void> {
        this.wsGateway.notifyClients('alertAcknowledged', {
            alert,
            timestamp: new Date('2025-05-16 07:28:01').toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    private async notifyAlertResolution(alert: SecurityAlert): Promise<void> {
        this.wsGateway.notifyClients('alertResolved', {
            alert,
            timestamp: new Date('2025-05-16 07:28:01').toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    private buildAlertQuery(filters?: AlertFilters): any {
        const query: any = {};

        if (filters?.severity) {
            query.severity = filters.severity;
        }

        if (filters?.status) {
            query.status = filters.status;
        }

        if (filters?.startDate) {
            query.createdAt = { $gte: new Date(filters.startDate) };
        }

        if (filters?.endDate) {
            query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
        }

        return query;
    }

    private async cleanupOldAlerts(): Promise<void> {
        const config = await this.configService.getConfig();
        const cutoffDate = new Date('2025-05-16 07:28:01');
        cutoffDate.setDate(cutoffDate.getDate() - config.alerts.retentionDays);

        await this.alertModel.deleteMany({
            status: 'resolved',
            resolvedAt: { $lt: cutoffDate }
        }).exec();
    }

    private async subscribeToAlertEvents(): Promise<void> {
        // Alert olaylarına abone olma mantığı
    }
}