import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { API_KEY_SERVICE_KEY } from 'src/common/decorators/api-key-service.decorator';

@Injectable()
export class GenericApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Obtener el servicio especificado en el decorador
    const service = this.reflector.getAllAndOverride<string>(
      API_KEY_SERVICE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!service) {
      throw new UnauthorizedException('API key service not specified');
    }

    // Obtener la API key válida según el servicio
    const validApiKey = this.getApiKeyForService(service);

    if (!validApiKey) {
      throw new UnauthorizedException(`Invalid service: ${service}`);
    }

    if (apiKey !== validApiKey) {
      console.log(`Invalid API key for service: ${service}`);
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private getApiKeyForService(service: string): string | null {
    const apiKeys = {
      smt:
        this.configService.get<string>('apiKeys.scrap.apiKey') ||
        this.configService.get<string>('scrap.apiKey') ||
        'FundedHero=2c87a99a-59f2-c57-962f-628ac0688c05-b228c21dccc-490e-b29b401-8f30c56621d-5fc4b8c61-d8cb7b4-44828df51-5f6507d9',
      n8n:
        this.configService.get<string>('apiKeys.n8n.apiKey') ||
        'N8N-API-KEY-DEFAULT',
      webhook:
        this.configService.get<string>('apiKeys.webhook.apiKey') ||
        'WEBHOOK-API-KEY-DEFAULT',
      external:
        this.configService.get<string>('apiKeys.external.apiKey') ||
        'EXTERNAL-API-KEY-DEFAULT',
      brokeret:
        this.configService.get<string>('apiKeys.brokeret.apiKey') ||
        'BROKERET-API-KEY-DEFAULT',
      buffer:
        this.configService.get<string>('apiKeys.scrap.apiKey') ||
        this.configService.get<string>('scrap.apiKey') ||
        'FundedHero=2c87a99a-59f2-c57-962f-628ac0688c05-b228c21dccc-490e-b29b401-8f30c56621d-5fc4b8c61-d8cb7b4-44828df51-5f6507d9',
      test:
        this.configService.get<string>('apiKeys.test.apiKey') ||
        'TEST-API-KEY-ELITECODE',
      // Agregar más servicios según necesites
    };

    return apiKeys[service] || null;
  }
}
