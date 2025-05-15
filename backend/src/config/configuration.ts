export default () => ({
  app: {
    name: process.env.APP_NAME || 'NDR Korelasyon Motoru',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    features: {
      enableSwagger: process.env.ENABLE_SWAGGER === 'true',
      enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      enableHelmet: process.env.ENABLE_HELMET !== 'false',
    },
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ndr-correlation-engine',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: process.env.NODE_ENV !== 'production',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    console: process.env.LOG_CONSOLE !== 'false',
    file: process.env.LOG_FILE === 'true',
    directory: process.env.LOG_DIRECTORY || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    security: process.env.LOG_SECURITY === 'true',
    access: process.env.LOG_ACCESS === 'true',
    audit: process.env.LOG_AUDIT === 'true',
  },
  correlation: {
    eventsTtl: parseInt(process.env.CORRELATION_EVENTS_TTL, 10) || 86400, // 24 hours in seconds
    maxQueueSize: parseInt(process.env.CORRELATION_MAX_QUEUE_SIZE, 10) || 10000,
    evaluationThreads: parseInt(process.env.CORRELATION_EVALUATION_THREADS, 10) || 4,
  },
  notifications: {
    email: {
      enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    webhook: {
      enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
      urls: process.env.WEBHOOK_URLS ? process.env.WEBHOOK_URLS.split(',') : [],
    },
  },
  reports: {
    directory: process.env.REPORTS_DIRECTORY || 'reports',
    retention: parseInt(process.env.REPORTS_RETENTION_DAYS, 10) || 30, // days
  },
});