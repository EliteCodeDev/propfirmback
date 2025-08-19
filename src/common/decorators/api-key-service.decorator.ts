import { SetMetadata } from '@nestjs/common';

export const API_KEY_SERVICE_KEY = 'apiKeyService';
export const ApiKeyService = (service: string) => SetMetadata(API_KEY_SERVICE_KEY, service);