import { registerAs } from '@nestjs/config';

export default registerAs('veriff', () => ({
  apiKey: process.env.VERIFF_API_KEY || '',
  sharedSecret: process.env.VERIFF_SHARED_SECRET || '',
  stationApiUrl: process.env.VERIFF_STATION_API_URL || 'https://stationapi.veriff.com',
}));