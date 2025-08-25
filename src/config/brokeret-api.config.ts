import { registerAs } from '@nestjs/config';

export default registerAs('brokeret-api', () => ({
  url: process.env.BROKERET_API_URL,
  apiKey: process.env.BROKERET_KEY
}));
