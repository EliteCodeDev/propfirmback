import { registerAs } from '@nestjs/config';

export default registerAs('mtm-api', () => ({
  url: process.env.MTM_API_URL,
  apiKey: process.env.MTM_API_KEY,
  authHeader: process.env.MTM_API_AUTH_HEADER || 'x-api-key',
}));