import { registerAs } from '@nestjs/config';

export default registerAs('apiKeys', () => ({
  // API Key para el servicio de scraping/SMT
  scrap: {
    apiKey:
      process.env.SMT_API_KEY ||
      'FundedHero=2c87a99a-59f2-c57-962f-628ac0688c05-b228c21dccc-490e-b29b401-8f30c56621d-5fc4b8c61-d8cb7b4-44828df51-5f6507d9',
  },
  // API Key para N8N
  n8n: {
    apiKey: process.env.N8N_API_KEY || 'N8N-API-KEY-DEFAULT',
  },
  // API Key para webhooks generales
}));
