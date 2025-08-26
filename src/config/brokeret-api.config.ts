import { registerAs } from '@nestjs/config';

export default registerAs('brokeret-api', () => ({
  url: process.env.BROKERET_API_URL,
  apiKey: process.env.BROKERET_KEY,
  creationApiUrl: process.env.BROKERET_CREATION_API_URL,
  userCreationApi: process.env.BROKERET_USER_CREATION_API,
  passCreationApi: process.env.BROKERET_PASS_CREATION_API,
}));
