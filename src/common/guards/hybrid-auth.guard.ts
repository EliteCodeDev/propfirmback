import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { IS_API_KEY_AUTH } from 'src/common/decorators/api-key.decorator';
import { ApiKeysService } from 'src/modules/api-keys/api-keys.service';

@Injectable()
export class HybridAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isApiKeyAuth = this.reflector.getAllAndOverride<boolean>(
      IS_API_KEY_AUTH,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();

    // Intentar autenticación por API key si está habilitada
    if (isApiKeyAuth) {
      try {
        const apiKey = this.extractApiKey(request);
        if (apiKey) {
          const isValid = await this.apiKeysService.validateApiKey(apiKey);
          if (isValid) {
            return true;
          }
        }
      } catch (error) {
        // Si falla la autenticación por API key, continuamos con JWT
      }
    }

    // Intentar autenticación JWT
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      throw new UnauthorizedException('Valid JWT token or API key required');
    }
  }

  private extractApiKey(request: any): string | null {
    // Buscar en header x-api-key
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // Buscar en Authorization header como "ApiKey <key>"
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
