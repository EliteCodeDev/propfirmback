// src/modules/rbac/rbac.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//Modules
import { UsersModule } from '../users/users.module';

// Entities
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

// Controllers
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';

// Services
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission]),
    UsersModule,
  ],

  controllers: [RolesController, PermissionsController],
  providers: [RolesService, PermissionsService],
  exports: [RolesService, PermissionsService, TypeOrmModule],
})
export class RbacModule {}
