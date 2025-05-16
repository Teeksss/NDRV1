import { Test, TestingModule } from '@nestjs/testing';
import { SecurityController } from '../security.controller';
import { SecurityService } from '../security.service';
import { HttpException } from '@nestjs/common';

describe('SecurityController', () => {
    let controller: SecurityController;
    let service: SecurityService;

    const mockServiceInfo = {
        timestamp: '2025-05-16 07:12:28',
        maintainer: 'Teeksss',
        version: '3.2.6',
        buildNumber: '202505160712'
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SecurityController],
            providers: [
                {
                    provide: SecurityService,
                    useValue: {
                        getStatus: jest.fn(),
                        getMetrics: jest.fn(),
                        createAlert: jest.fn(),
                        updateAlert: jest.fn(),
                        deleteAlert: jest.fn()
                    }
                }
            ]
        }).compile();

        controller = module.get<SecurityController>(SecurityController);
        service = module.get<SecurityService>(SecurityService);
    });

    describe('getSecurityStatus', () => {
        it('should return security status', async () => {
            const mockStatus = {
                status: 'normal',
                metrics: {},
                activeAlerts: 0,
                systemHealth: 100,
                serviceInfo: mockServiceInfo
            };

            jest.spyOn(service, 'getStatus').mockResolvedValue(mockStatus);

            const result = await controller.getSecurityStatus();

            expect(result).toHaveProperty('status', 'normal');
            expect(result).toHaveProperty('serviceInfo');
            expect(service.getStatus).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            jest.spyOn(service, 'getStatus').mockRejectedValue(new Error());

            await expect(controller.getSecurityStatus()).rejects.toThrow(HttpException);
        });
    });

    // Diğer test senaryoları...
});