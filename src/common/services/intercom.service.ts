import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class IntercomService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Genera un user_hash para Intercom usando HMAC-SHA256
   * @param userId - ID del usuario
   * @returns string - Hash generado para Intercom
   */
  generateUserHash(userId: string): string {
    const secretKey = this.configService.get<string>('intercom.secretKey');
    
    if (!secretKey) {
      throw new Error('INTERCOM_SECRET_KEY no está configurada');
    }

    return crypto
      .createHmac('sha256', secretKey)
      .update(userId)
      .digest('hex');
  }

  /**
   * Obtiene el app_id de Intercom desde la configuración
   * @returns string - App ID de Intercom
   */
  getAppId(): string {
    const appId = this.configService.get<string>('intercom.appId');
    
    if (!appId) {
      throw new Error('INTERCOM_APP_ID no está configurada');
    }

    return appId;
  }
}