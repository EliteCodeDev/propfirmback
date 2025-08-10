import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from '../users/entities/user-role.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rpRepo: Repository<RolePermission>,

    @InjectRepository(UserRole)
    private readonly urRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const exists = await this.roleRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Role already exists');
    const role = this.roleRepo.create(dto);
    return this.roleRepo.save(role);
  }

  /**
   * Ahora acepta query y devuelve [datos, total] para paginación
   */
  async findAll(query: BaseQueryDto): Promise<[Role[], number]> {
    const { page = 1, limit = 10 } = query;
    return this.roleRepo.findAndCount({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      take: limit,
      skip: (page - 1) * limit,
      order: { name: 'ASC' }, // <-- usamos name
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { roleID: id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: string, dto: Partial<CreateRoleDto>): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepo.remove(role);
  }

  /**
   * Asigna permisos a un rol (adapta al DTO del controller)
   */
  async assignPermissions(
    roleId: string,
    dto: AssignPermissionsDto,
  ): Promise<Role> {
    for (const permissionId of dto.permissionIds) {
      const perm = await this.permRepo.findOne({
        where: { permissionID: permissionId },
      });
      if (!perm)
        throw new NotFoundException(`Permission ${permissionId} not found`);

      const exists = await this.rpRepo.findOne({
        where: { roleID: roleId, permissionID: permissionId },
      });
      if (!exists) {
        const rp = this.rpRepo.create({
          roleID: roleId,
          permissionID: permissionId, // <-- variable corregida
        });
        await this.rpRepo.save(rp);
      }
    }
    return this.findOne(roleId);
  }

  /**
   * Elimina un permiso de un rol
   */
  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    await this.rpRepo.delete({ roleID: roleId, permissionID: permissionId });
    return this.findOne(roleId);
  }

  /**
   * Asigna un rol a un usuario (DTO trae un solo roleId)
   */
  async assignRole(dto: AssignRoleDto): Promise<void> {
    const exists = await this.urRepo.findOne({
      where: { userID: dto.userID, roleID: dto.roleId },
    });
    if (!exists) {
      const ur = this.urRepo.create({
        userID: dto.userID,
        roleID: dto.roleId, // <-- usa roleId, no roleIds
      });
      await this.urRepo.save(ur);
    }
  }

  /**
   * Quita un rol de un usuario
   */
  async removeRole(userID: string, roleId: string): Promise<void> {
    await this.urRepo.delete({ userID, roleID: roleId });
  }

  /**
   * Obtiene los roles asignados a un usuario
   */
  async getUserRoles(userID: string): Promise<Role[]> {
    const urs = await this.urRepo.find({
      where: { userID },
      relations: ['role'],
    });
    return urs.map((u) => u.role);
  }

  /**
   * (Opcional) Mantengo método original si lo necesitas
   */
  async getRoleUsers(roleId: string): Promise<any[]> {
    const urs = await this.urRepo.find({
      where: { roleID: roleId },
      relations: ['user'],
    });
    return urs.map((u) => u.user);
  }
}
