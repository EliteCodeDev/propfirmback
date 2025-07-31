// src/modules/rbac/rbac.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from '../users/entities/user-role.entity';

// Controllers
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';

// Services
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      UserRole,
    ]),
  ],
  controllers: [
    RolesController,
    PermissionsController,
  ],
  providers: [
    RolesService,
    PermissionsService,
  ],
  exports: [
    RolesService,
    PermissionsService,
  ],
})
export class RbacModule {}
