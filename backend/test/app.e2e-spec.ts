import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import * as cookieParser from 'cookie-parser';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let configService: ConfigService;
  let mongoMemoryServer: MongoMemoryServer;
  let accessToken: string;

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
    configService = moduleFixture.get<ConfigService>(ConfigService);
    
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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('version');
        expect(res.body).toHaveProperty('environment');
      });
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('checks');
      });
  });

  it('/system (GET) - without auth should fail', () => {
    return request(app.getHttpServer())
      .get('/api/system')
      .expect(401);
  });

  it('/system (GET) - with auth should succeed', () => {
    return request(app.getHttpServer())
      .get('/api/system')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('server');
        expect(res.body).toHaveProperty('process');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('/auth/profile (GET) - should return user profile', () => {
    return request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email', 'test@example.com');
        expect(res.body).toHaveProperty('name', 'Test User');
        expect(res.body).toHaveProperty('role', 'admin');
        expect(res.body).not.toHaveProperty('password');
      });
  });
});