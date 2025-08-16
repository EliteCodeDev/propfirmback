import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Role } from '../modules/rbac/entities/role.entity';
import { Permission } from '../modules/rbac/entities/permission.entity';
import { RolePermission } from '../modules/rbac/entities/role-permission.entity';

@Injectable()
export class SeedOnBootService implements OnModuleInit {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rpRepo: Repository<RolePermission>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const seedOnBoot = this.config.get<boolean>('app.seedOnBoot');
    if (!seedOnBoot) return;

    // 1) roles base
    const roleNames = ['super_admin', 'admin', 'user'];
    const roles = new Map<string, Role>();
    for (const name of roleNames) {
      let role = await this.roleRepo.findOne({ where: { name } });
      if (!role) {
        role = this.roleRepo.create({ name, description: name });
        role = await this.roleRepo.save(role);
      }
      roles.set(name, role);
    }

    // 2) permisos base (mínimo wildcard para super_admin)
    const permNames = ['*'];
    const perms = new Map<string, Permission>();
    for (const name of permNames) {
      let perm = await this.permRepo.findOne({ where: { name } });
      if (!perm) {
        perm = this.permRepo.create({ name, description: name === '*' ? 'Wildcard (all permissions)' : name });
        perm = await this.permRepo.save(perm);
      }
      perms.set(name, perm);
    }

    // 3) asignar '*' a super_admin
    const superAdmin = roles.get('super_admin');
    const wildcard = perms.get('*');
    if (superAdmin && wildcard) {
      const exists = await this.rpRepo.findOne({
        where: { roleID: (superAdmin as Role).roleID, permissionID: (wildcard as Permission).permissionID },
      });
      if (!exists) {
        const rp = this.rpRepo.create({ roleID: (superAdmin as Role).roleID, permissionID: (wildcard as Permission).permissionID });
        await this.rpRepo.save(rp);
      }
    }
  }
}
