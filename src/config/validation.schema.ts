import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.number().default(1337),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  CLIENT_URL: Joi.string().default('http://localhost:3000'),

  // Database
  DATABASE_CLIENT: Joi.string().valid('postgres').default('postgres'),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  DB_DROP_SCHEMA: Joi.boolean().default(false),
  DB_SYNCHRONIZE: Joi.boolean().default(true),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // App Keys (for additional security)
  APP_KEYS: Joi.string(),
  API_TOKEN_SALT: Joi.string(),
  ADMIN_JWT_SECRET: Joi.string(),
  TRANSFER_TOKEN_SALT: Joi.string(),

  // Mailer
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),

  // File Upload (optional)
  MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB
  UPLOAD_PATH: Joi.string().default('./uploads'),

  // SMT API
  SMT_API_URL: Joi.string().required(),
  SMT_API_KEY: Joi.string().required(),
  SMT_API_AUTH_HEADER: Joi.string().default('x-api-key'),

  // API Keys para autenticación de terceros
  API_KEYS: Joi.string().optional().description('Comma-separated list of valid API keys'),

  API_KEY_FUNDED: Joi.string().required(),
});
