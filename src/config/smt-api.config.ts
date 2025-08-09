import { registerAs } from '@nestjs/config';
export default registerAs('smt-api', () => ({
  url: process.env.SMT_API_URL,
  apiKey: process.env.SMT_API_KEY,
  authHeader: process.env.SMT_API_AUTH_HEADER,
}));
