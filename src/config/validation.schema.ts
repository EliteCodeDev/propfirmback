import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.number().default(1337),

  // Frontend & Email Confirmation
  FRONTEND_URL: Joi.string().required(),
  EMAIL_CONFIRM_PATH: Joi.string().required(),
  EMAIL_CONFIRM_ADD_LOGIN: Joi.boolean().default(false),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  
  // Database
  DATABASE_CLIENT: Joi.string().valid('postgres').default('postgres'),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_EMAIL_CONFIRM_SECRET: Joi.string().required(),
  JWT_EMAIL_CONFIRM_EXPIRES: Joi.string().required(),
  
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
});