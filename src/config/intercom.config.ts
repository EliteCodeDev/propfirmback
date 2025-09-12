// src/config/intercom.config.ts
import { registerAs } from '@nestjs/config';

export const intercomConfig = registerAs('intercom', () => ({
  secretKey: process.env.INTERCOM_SECRET_KEY,
  appId: process.env.INTERCOM_APP_ID,
}));