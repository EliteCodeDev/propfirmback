import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_API_KEY_AUTH } from 'src/common/decorators/api-key.decorator';
import { ApiKeysService } from 'src/modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isApiKeyAuth = this.reflector.getAllAndOverride<boolean>(
      IS_API_KEY_AUTH,
      [context.getHandler(), context.getClass()],
    );

    if (!isApiKeyAuth) {
      return true; // No es una ruta que requiere API key
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    const isValid = await this.apiKeysService.validateApiKey(apiKey);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Buscar en header x-api-key
    const headerApiKey = request.headers['x-api-key'];
    if (headerApiKey) {
      return headerApiKey;
    }

    // Buscar en Authorization header como "ApiKey <key>"
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
