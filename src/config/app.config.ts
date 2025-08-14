// src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || 'localhost',
  port: parseInt(process.env.PORT, 10) || 1337,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  apiUrl: process.env.CLIENT_URL || 'http://localhost:4002',
  
  // Seeding / bootstrap flags
  seedOnBoot: String(process.env.SEED_ON_BOOT).toLowerCase() === 'true',
  firstUserSuperadmin: String(process.env.FIRST_USER_SUPERADMIN).toLowerCase() === 'true',
  
  // Security
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',

  // API Configuration
  apiPrefix: 'api',
  swaggerPath: 'api/docs',

  // Rate Limiting
  throttleTtl: 60000, // 1 minute
  throttleLimit: 100, // 100 requests per minute
}));
