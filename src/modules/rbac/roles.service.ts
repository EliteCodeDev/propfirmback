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
import { UserAccount } from '../users/entities/user-account.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
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
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
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
    const user = await this.userRepo.findOne({ where: { userID: dto.userID } });
    if (!user) throw new NotFoundException('User not found');
    const role = await this.roleRepo.findOne({ where: { roleID: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');
    user.roleID = role.roleID;
    await this.userRepo.save(user);
  }

  /**
   * Quita un rol de un usuario
   */
  async removeRole(userID: string, roleId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { userID } });
    if (!user) throw new NotFoundException('User not found');
    if (user.roleID !== roleId) return; // nothing to do
    user.roleID = null as any;
    await this.userRepo.save(user);
  }

  /**
   * Obtiene los roles asignados a un usuario
   */
  async getUserRoles(userID: string): Promise<Role[]> {
    const user = await this.userRepo.findOne({
      where: { userID },
      relations: ['role'],
    });
    return user?.role ? [user.role] : [];
  }

  /**
   * (Opcional) Mantengo método original si lo necesitas
   */
  async getRoleUsers(roleId: string): Promise<any[]> {
    const users = await this.userRepo.find({ where: { roleID: roleId } });
    return users;
  }
}
