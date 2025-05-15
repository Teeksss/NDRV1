import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number().default(3000),
  
  MONGODB_URI: Joi.string()
    .required()
    .description('MongoDB connection string'),
  
  JWT_SECRET: Joi.string()
    .required()
    .description('JWT secret key'),
  
  JWT_EXPIRES_IN: Joi.string()
    .default('1d')
    .description('JWT expiration time'),
  
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  
  CORS_ORIGIN: Joi.string().default('*'),
  
  API_PREFIX: Joi.string().default('api'),
  
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  
  DEFAULT_ADMIN_USERNAME: Joi.string().default('admin'),
  DEFAULT_ADMIN_PASSWORD: Joi.string(),
  DEFAULT_ADMIN_EMAIL: Joi.string().email(),
  
  SMTP_HOST: Joi.string(),
  SMTP_PORT: Joi.number(),
  SMTP_USER: Joi.string(),
  SMTP_PASSWORD: Joi.string(),
  SMTP_FROM: Joi.string()
});