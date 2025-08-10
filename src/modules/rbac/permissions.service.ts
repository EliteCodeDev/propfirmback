import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const exists = await this.permissionRepository.findOne({
      where: { name: dto.name },
    });
    if (exists) throw new ConflictException('Permission already exists');
    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  /**
   * Ahora acepta query y devuelve [datos, total] para paginación
   */
  async findAll(query: BaseQueryDto): Promise<[Permission[], number]> {
    const { page = 1, limit = 10 } = query;
    return this.permissionRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { name: 'ASC' }, // <-- ordenamos por name en lugar de un campo inexistente
    });
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { permissionID: id },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(
    id: string,
    dto: Partial<CreatePermissionDto>,
  ): Promise<Permission> {
    const permission = await this.findOne(id);
    Object.assign(permission, dto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }
}
