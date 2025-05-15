import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Get config and logger services
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Set global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  
  // Set up validation pipeline
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
  
  // Set up security middleware
  if (configService.get<boolean>('app.features.enableHelmet', true)) {
    app.use(helmet());
  }
  
  if (configService.get<boolean>('app.features.enableCompression', true)) {
    app.use(compression());
  }
  
  app.use(cookieParser());
  
  // Configure CORS
  const corsOrigin = configService.get<string>('app.cors.origin', '*');
  const corsMethods = configService.get<string>('app.cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  const corsCredentials = configService.get<boolean>('app.cors.credentials', false);
  
  app.enableCors({
    origin: corsOrigin,
    methods: corsMethods,
    credentials: corsCredentials,
  });
  
  // Set up Swagger documentation
  if (configService.get<boolean>('app.features.enableSwagger', true)) {
    const options = new DocumentBuilder()
      .setTitle('NDR Korelasyon Motoru API')
      .setDescription('Ağ güvenliği izleme ve tehdit tespiti için API')
      .setVersion(configService.get<string>('app.version', '1.0.0'))
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }
  
  // Start the server
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  logger.log(`Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`, 'Bootstrap');
}

bootstrap();