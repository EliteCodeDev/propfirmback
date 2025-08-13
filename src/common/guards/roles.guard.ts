import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
  const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles) {
      return false;
    }
    // Normalize roles to a canonical snake_case format and build effective roles via hierarchy
    const normalize = (r: string) => r?.toLowerCase().replace(/-/g, '_');
    const ROLE_HIERARCHY: Record<string, string[]> = {
      super_admin: ['admin', 'user'],
      admin: ['user'],
      user: [],
    };

    const userRoles = Array.isArray(user.roles)
      ? user.roles.map((r: string) => normalize(r)).filter(Boolean)
      : [];

    // Expand roles by hierarchy (e.g., super_admin -> admin, user)
    const effective = new Set<string>(userRoles);
    for (const r of userRoles) {
      const implied = ROLE_HIERARCHY[r] || [];
      implied.forEach((x) => effective.add(x));
    }

    // If required role matches any effective role (after normalization), allow
    return requiredRoles
      .map((r) => normalize(r))
      .some((req) => effective.has(req));
  }
}