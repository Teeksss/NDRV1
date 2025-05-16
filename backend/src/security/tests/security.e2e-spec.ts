import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { SecurityService } from '../security.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('Security (e2e)', () => {
    let app: INestApplication;
    let securityService: SecurityService;

    const mockServiceInfo = {
        timestamp: '2025-05-16 07:14:40',
        maintainer: 'Teeksss',
        version: '3.2.7',
        buildNumber: '202505160714'
    };

    const mockJwtToken = 'mock.jwt.token';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .compile();

        app = moduleFixture.createNestApplication();
        securityService = moduleFixture.get<SecurityService>(SecurityService);
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/security/status (GET)', () => {
        it('should return security status', () => {
            const mockStatus = {
                status: 'normal',
                metrics: {},
                activeAlerts: 0,
                systemHealth: 100,
                serviceInfo: mockServiceInfo
            };

            jest.spyOn(securityService, 'getStatus').mockResolvedValue(mockStatus);

            return request(app.getHttpServer())
                .get('/security/status')
                .set('Authorization', `Bearer ${mockJwtToken}`)
                .expect(200)
                .expect(res => {
                    expect(res.body).toHaveProperty('status', 'normal');
                    expect(res.body.serviceInfo).toEqual(mockServiceInfo);
                });
        });

        it('should handle unauthorized access', () => {
            return request(app.getHttpServer())
                .get('/security/status')
                .expect(401);
        });
    });

    describe('/security/alerts (POST)', () => {
        const createAlertDto = {
            type: 'intrusion_attempt',
            severity: 'high',
            description: 'Suspicious activity detected'
        };

        it('should create a new alert', () => {
            const mockAlert = {
                ...createAlertDto,
                id: 'mock-id',
                status: 'active',
                timestamp: new Date('2025-05-16 07:14:40').toISOString(),
                serviceInfo: mockServiceInfo
            };

            jest.spyOn(securityService, 'createAlert').mockResolvedValue(mockAlert);

            return request(app.getHttpServer())
                .post('/security/alerts')
                .set('Authorization', `Bearer ${mockJwtToken}`)
                .send(createAlertDto)
                .expect(201)
                .expect(res => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.type).toBe(createAlertDto.type);
                    expect(res.body.serviceInfo).toEqual(mockServiceInfo);
                });
        });

        it('should validate alert data', () => {
            const invalidAlertDto = {
                type: 'invalid_type',
                severity: 'unknown'
            };

            return request(app.getHttpServer())
                .post('/security/alerts')
                .set('Authorization', `Bearer ${mockJwtToken}`)
                .send(invalidAlertDto)
                .expect(400);
        });
    });

    describe('/security/metrics (GET)', () => {
        it('should return security metrics', () => {
            const mockMetrics = {
                data: [],
                aggregates: {},
                timestamp: new Date('2025-05-16 07:14:40').toISOString(),
                serviceInfo: mockServiceInfo
            };

            jest.spyOn(securityService, 'getMetrics').mockResolvedValue(mockMetrics);

            return request(app.getHttpServer())
                .get('/security/metrics')
                .set('Authorization', `Bearer ${mockJwtToken}`)
                .expect(200)
                .expect(res => {
                    expect(res.body).toHaveProperty('data');
                    expect(res.body).toHaveProperty('aggregates');
                    expect(res.body.serviceInfo).toEqual(mockServiceInfo);
                });
        });

        it('should handle query parameters', () => {
            const query = {
                startDate: '2025-05-15',
                endDate: '2025-05-16',
                type: 'system_health'
            };

            return request(app.getHttpServer())
                .get('/security/metrics')
                .query(query)
                .set('Authorization', `Bearer ${mockJwtToken}`)
                .expect(200);
        });
    });
});