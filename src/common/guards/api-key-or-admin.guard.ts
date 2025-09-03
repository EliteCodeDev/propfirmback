import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { API_KEY_SERVICE_KEY } from 'src/common/decorators/api-key-service.decorator';
import { UserAccount } from 'src/modules/users/entities/user-account.entity';

@Injectable()
export class ApiKeyOrAdminGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const authHeader = request.headers.authorization;

    // Intentar autenticación por API Key primero
    if (apiKey) {
      return this.validateApiKey(context, apiKey);
    }

    // Si no hay API Key, intentar autenticación JWT con rol admin
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return await this.validateJwtAdmin(request, authHeader);
    }

    throw new UnauthorizedException('API key or admin authentication required');
  }

  private validateApiKey(context: ExecutionContext, apiKey: string): boolean {
    // Obtener el servicio especificado en el decorador
    const service = this.reflector.getAllAndOverride<string>(API_KEY_SERVICE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!service) {
      throw new UnauthorizedException('API key service not specified');
    }

    // Obtener la API key válida según el servicio
    const validApiKey = this.getApiKeyForService(service);

    if (!validApiKey) {
      throw new UnauthorizedException(`Invalid service: ${service}`);
    }

    if (apiKey !== validApiKey) {
      return false; // No lanzar error, intentar JWT
    }

    return true;
  }

  private async validateJwtAdmin(request: any, authHeader: string): Promise<boolean> {
    try {
      const token = authHeader.substring(7); // Remover 'Bearer '
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Obtener el usuario completo con roles desde la base de datos (igual que JwtStrategy)
      const user = await this.userRepository.findOne({
        where: { userID: payload.sub },
        relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
      });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verificar si el usuario tiene rol admin
      if (!user.role?.name || !this.hasAdminRole(user.role.name)) {
        throw new UnauthorizedException('Admin role required');
      }

      // Agregar el usuario al request para uso posterior (mismo formato que JwtStrategy)
      const permissions = user.role?.rolePermissions?.map((rp) => rp.permission?.name).filter(Boolean) || [];
      
      request.user = {
        userID: payload.sub,
        email: user.email,
        username: user.username,
        roles: user.role?.name ? [user.role.name] : [],
        permissions,
        isVerified: user.isVerified,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token or insufficient permissions');
    }
  }

  private hasAdminRole(userRole: string | string[]): boolean {
    const adminRoles = ['admin', 'super_admin'];
    
    if (Array.isArray(userRole)) {
      return userRole.some(role => adminRoles.includes(role.toLowerCase()));
    }
    
    return adminRoles.includes(userRole.toLowerCase());
  }

  private getApiKeyForService(service: string): string | null {
    const apiKeys = {
      smt: this.configService.get<string>('apiKeys.scrap.apiKey') || 
           this.configService.get<string>('scrap.apiKey') || 
           "FundedHero=2c87a99a-59f2-c57-962f-628ac0688c05-b228c21dccc-490e-b29b401-8f30c56621d-5fc4b8c61-d8cb7b4-44828df51-5f6507d9",
      n8n: this.configService.get<string>('apiKeys.n8n.apiKey') || 
           "N8N-API-KEY-DEFAULT",
      webhook: this.configService.get<string>('apiKeys.webhook.apiKey') || 
              "WEBHOOK-API-KEY-DEFAULT",
      external: this.configService.get<string>('apiKeys.external.apiKey') || 
               "EXTERNAL-API-KEY-DEFAULT",
      brokeret: this.configService.get<string>('apiKeys.brokeret.apiKey') || 
               "BROKERET-API-KEY-DEFAULT",
      buffer: this.configService.get<string>('apiKeys.scrap.apiKey') || 
              this.configService.get<string>('scrap.apiKey') || 
              "FundedHero=2c87a99a-59f2-c57-962f-628ac0688c05-b228c21dccc-490e-b29b401-8f30c56621d-5fc4b8c61-d8cb7b4-44828df51-5f6507d9",
      // Agregar más servicios según necesites
    };

    return apiKeys[service] || null;
  }
}