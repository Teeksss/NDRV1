import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { CorrelationService } from '../src/correlation/correlation.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import * as cookieParser from 'cookie-parser';

describe('Correlation Rules (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let correlationService: CorrelationService;
  let mongoMemoryServer: MongoMemoryServer;
  let accessToken: string;
  let testRuleId: string;

  beforeAll(async () => {
    // Create in-memory MongoDB server
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();

    // Set environment variables
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global pipes and middleware
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.use(cookieParser());
    
    // Get services
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    correlationService = moduleFixture.get<CorrelationService>(CorrelationService);
    
    await app.init();
    
    // Create test user
    await createTestUser();
    
    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });
    
    accessToken = loginResponse.body.accessToken;
    
    // Create a test correlation rule
    testRuleId = (await createTestRule()).id;
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongoMemoryServer.stop();
  });

  async function createTestUser() {
    // Check if user already exists
    const existingUser = await usersService.findByEmail('test@example.com');
    if (existingUser) {
      return existingUser;
    }
    
    // Create a test user
    return await usersService.create({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      role: 'admin',
    });
  }

  async function createTestRule() {
    return await correlationService.createRule({
      name: 'Test Rule',
      description: 'A rule for testing',
      type: 'simple',
      severity: 'medium',
      enabled: true,
      conditions: [
        {
          logicalOperator: 'and',
        },
        {
          field: 'type',
          operator: 'eq',
          value: 'authentication',
        },
        {
          field: 'status',
          operator: 'eq',
          value: 'failure',
        },
      ],
      config: {},
      alertTemplate: {
        title: 'Authentication Failure',
        description: 'An authentication failure was detected',
      },
      mitre: {
        tactic: 'Initial Access',
        technique: 'Valid Accounts',
      },
      tags: ['test', 'authentication'],
    });
  }

  it('/correlation/rules (GET) - should return rules list', () => {
    return request(app.getHttpServer())
      .get('/api/correlation/rules')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('limit');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
      });
  });

  it('/correlation/rules/{id} (GET) - should return rule details', () => {
    return request(app.getHttpServer())
      .get(`/api/correlation/rules/${testRuleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('id', testRuleId);
        expect(res.body).toHaveProperty('name', 'Test Rule');
        expect(res.body).toHaveProperty('type', 'simple');
        expect(res.body).toHaveProperty('severity', 'medium');
        expect(res.body).toHaveProperty('enabled', true);
        expect(res.body).toHaveProperty('conditions');
        expect(Array.isArray(res.body.conditions)).toBe(true);
      });
  });

  it('/correlation/rules (POST) - should create a new rule', () => {
    return request(app.getHttpServer())
      .post('/api/correlation/rules')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Test Rule',
        description: 'A new rule for testing',
        type: 'threshold',
        severity: 'high',
        enabled: true,
        conditions: [
          {
            logicalOperator: 'and',
          },
          {
            field: 'type',
            operator: 'eq',
            value: 'network',
          },
        ],
        config: {
          threshold: 5,
          timeWindow: 300,
        },
        alertTemplate: {
          title: 'Network Activity Threshold',
          description: 'Excessive network activity detected',
        },
        tags: ['test', 'network'],
      })
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name', 'New Test Rule');
        expect(res.body).toHaveProperty('type', 'threshold');
        expect(res.body).toHaveProperty('severity', 'high');
        expect(res.body).toHaveProperty('enabled', true);
      });
  });

  it('/correlation/rules/{id} (PATCH) - should update rule partially', () => {
    return request(app.getHttpServer())
      .patch(`/api/correlation/rules/${testRuleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        description: 'Updated description',
        severity: 'high',
      })
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('id', testRuleId);
        expect(res.body).toHaveProperty('description', 'Updated description');
        expect(res.body).toHaveProperty('severity', 'high');
        expect(res.body).toHaveProperty('name', 'Test Rule'); // Unchanged
      });
  });

  it('/correlation/rules/{id}/disable (PATCH) - should disable rule', () => {
    return request(app.getHttpServer())
      .patch(`/api/correlation/rules/${testRuleId}/disable`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('id', testRuleId);
        expect(res.body).toHaveProperty('enabled', false);
      });
  });

  it('/correlation/rules/{id}/enable (PATCH) - should enable rule', () => {
    return request(app.getHttpServer())
      .patch(`/api/correlation/rules/${testRuleId}/enable`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('id', testRuleId);
        expect(res.body).toHaveProperty('enabled', true);
      });
  });

  it('/correlation/rules/{id}/test (POST) - should test rule', () => {
    return request(app.getHttpServer())
      .post(`/api/correlation/rules/${testRuleId}/test`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        events: [
          {
            id: 'test-event-1',
            type: 'authentication',
            status: 'failure',
            source: 'test',
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('matched', true);
        expect(res.body).toHaveProperty('executionTime');
      });
  });

  it('/correlation/rules/statistics (GET) - should return statistics', () => {
    return request(app.getHttpServer())
      .get('/api/correlation/rules/statistics')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('enabled');
        expect(res.body).toHaveProperty('byType');
        expect(res.body).toHaveProperty('bySeverity');
      });
  });

  it('/correlation/rules/{id} (DELETE) - should delete rule', () => {
    return request(app.getHttpServer())
      .delete(`/api/correlation/rules/${testRuleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('/correlation/rules/{id} (GET) - should return 404 after deletion', () => {
    return request(app.getHttpServer())
      .get(`/api/correlation/rules/${testRuleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});