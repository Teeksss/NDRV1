import * as Joi from 'joi';

export const validate = (config: Record<string, unknown>) => {
  const schema = Joi.object({
    APP_NAME: Joi.string().default('NDR Korelasyon Motoru'),
    APP_VERSION: Joi.string().default('1.0.0'),
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test', 'staging')
      .default('development'),
    PORT: Joi.number().default(3000),
    API_PREFIX: Joi.string().default('api'),
    BASE_URL: Joi.string().default('http://localhost:3000'),
    
    // MongoDB
    MONGODB_URI: Joi.string()
      .default('mongodb://localhost:27017/ndr-correlation-engine'),
    
    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('1h'),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    
    // CORS
    CORS_ORIGIN: Joi.string().default('*'),
    CORS_METHODS: Joi.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    CORS_CREDENTIALS: Joi.boolean().default(false),
    
    // Throttling
    THROTTLE_TTL: Joi.number().default(60),
    THROTTLE_LIMIT: Joi.number().default(100),
    
    // Features
    ENABLE_SWAGGER: Joi.boolean().default(true),
    ENABLE_COMPRESSION: Joi.boolean().default(true),
    ENABLE_HELMET: Joi.boolean().default(true),
    
    // Logging
    LOG_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
      .default('info'),
    LOG_CONSOLE: Joi.boolean().default(true),
    LOG_FILE: Joi.boolean().default(false),
    LOG_DIRECTORY: Joi.string().default('logs'),
    LOG_MAX_SIZE: Joi.string().default('20m'),
    LOG_MAX_FILES: Joi.string().default('14d'),
    LOG_SECURITY: Joi.boolean().default(false),
    LOG_ACCESS: Joi.boolean().default(false),
    LOG_AUDIT: Joi.boolean().default(false),
    
    // Correlation Engine
    CORRELATION_EVENTS_TTL: Joi.number().default(86400),
    CORRELATION_MAX_QUEUE_SIZE: Joi.number().default(10000),
    CORRELATION_EVALUATION_THREADS: Joi.number().default(4),
    
    // Notifications
    EMAIL_NOTIFICATIONS_ENABLED: Joi.boolean().default(false),
    EMAIL_FROM: Joi.string().default('noreply@example.com'),
    SMTP_HOST: Joi.string().when('EMAIL_NOTIFICATIONS_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    SMTP_PORT: Joi.number().default(587),
    SMTP_SECURE: Joi.boolean().default(false),
    SMTP_USER: Joi.string().when('EMAIL_NOTIFICATIONS_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    SMTP_PASS: Joi.string().when('EMAIL_NOTIFICATIONS_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    WEBHOOK_NOTIFICATIONS_ENABLED: Joi.boolean().default(false),
    WEBHOOK_URLS: Joi.string().when('WEBHOOK_NOTIFICATIONS_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    
    // Reports
    REPORTS_DIRECTORY: Joi.string().default('reports'),
    REPORTS_RETENTION_DAYS: Joi.number().default(30),
  });

  const { error, value: validatedConfig } = schema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Validation error: ${error.message}`);
  }

  return validatedConfig;
};