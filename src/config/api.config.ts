import { registerAs } from '@nestjs/config';

export const scrapConfig = registerAs('scrap', () => ({
    apiKey: process.env.API_KEY_FUNDED || '',
    apiUrlScrap: process.env.API_URL_SCRAP || 'https://localhost:40002',
}));
