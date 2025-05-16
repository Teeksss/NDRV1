import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SecurityService } from '../security.service';
import { SecurityWebSocketGateway } from '../websocket/security.gateway';
import { Model } from 'mongoose';

describe('SecurityService', () => {
    let service: SecurityService;
    let alertModel: Model<any>;
    let metricsModel: Model<any>;
    let wsGateway: SecurityWebSocketGateway;

    const mockServiceInfo = {
        timestamp: '2025-05-16 07:12:28',
        maintainer: 'Teeksss',
        version: '3.2.6',
        buildNumber: '202505160712'
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SecurityService,
                {
                    provide: getModelToken('SecurityAlert'),
                    useValue: {
                        new: jest.fn().mockResolvedValue(mockAlert),
                        constructor: jest.fn().mockResolvedValue(mockAlert),
                        find: jest.fn(),
                        findOne: jest.fn(),
                        findById: jest.fn(),
                        findByIdAndUpdate: jest.fn(),
                        findByIdAndDelete: jest.fn(),
                        save: jest.fn(),
                        exec: jest.fn()
                    }
                },
                {
                    provide: getModelToken('SecurityMetrics'),
                    useValue: {
                        new: jest.fn().mockResolvedValue(mockMetrics),
                        constructor: jest.fn().mockResolvedValue(mockMetrics),
                        find: jest.fn(),
                        findOne: jest.fn(),
                        save: jest.fn(),
                        exec: jest.fn()
                    }
                },
                {
                    provide: SecurityWebSocketGateway,
                    useValue: {
                        notifyClients: jest.fn()
                    }
                },
                {
                    provide: 'SECURITY_CONFIG',
                    useValue: {
                        features: {
                            realTimeMonitoring: true,
                            mlDetection: true,
                            automatedResponse: true,
                            threatIntelligence: true
                        }
                    }
                }
            ]
        }).compile();

        service = module.get<SecurityService>(SecurityService);
        alertModel = module.get<Model<any>>(getModelToken('SecurityAlert'));
        metricsModel = module.get<Model<any>>(getModelToken('SecurityMetrics'));
        wsGateway = module.get<SecurityWebSocketGateway>(SecurityWebSocketGateway);
    });

    const mockAlert = {
        type: 'intrusion_attempt',
        severity: 'high',
        description: 'Suspicious activity detected',
        status: 'active',
        creator: 'Teeksss',
        metadata: {},
        serviceInfo: mockServiceInfo
    };

    const mockMetrics = {
        type: 'system_health',
        value: 95,
        metadata: {},
        serviceInfo: mockServiceInfo
    };

    describe('getStatus', () => {
        it('should return system status with current metrics', async () => {
            jest.spyOn(alertModel, 'find').mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockAlert])
            } as any);

            jest.spyOn(metricsModel, 'findOne').mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockMetrics)
            } as any);

            const result = await service.getStatus();

            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('metrics');
            expect(result).toHaveProperty('activeAlerts');
            expect(result).toHaveProperty('systemHealth');
            expect(result.serviceInfo).toEqual(mockServiceInfo);
        });
    });

    describe('createAlert', () => {
        it('should create a new security alert', async () => {
            const createAlertDto = {
                type: 'intrusion_attempt',
                severity: 'high',
                description: 'Suspicious activity detected'
            };

            jest.spyOn(alertModel.prototype, 'save')
                .mockResolvedValue(mockAlert);

            const result = await service.createAlert(createAlertDto);

            expect(result).toEqual(mockAlert);
            expect(wsGateway.notifyClients).toHaveBeenCalledWith('newAlert', mockAlert);
        });
    });

    // Diğer test senaryoları...
});