import { registerAs } from '@nestjs/config';

export default registerAs('veriff', () => ({
  apiKey: process.env.VERIFF_API_KEY || '',
  sharedSecret: process.env.VERIFF_SHARED_SECRET || '',
  stationApiUrl: process.env.VERIFF_STATION_API_URL || 'https://stationapi.veriff.com',
  callbackUrl: process.env.VERIFF_CALLBACK_URL || 'https://www.veriff.com/get-verified?navigation=slim',
  eventWebhookUrl: process.env.VERIFF_EVENT_WEBHOOK_URL || 'https://webhook-test.veriff.com/hook',
  decisionWebhookUrl: process.env.VERIFF_DECISION_WEBHOOK_URL || 'https://webhook-test.veriff.com/notification',
}));