import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Style } from './entities/style.entity';
import { CreateStyleDto, UpdateStyleDto } from './dto';

@Injectable()
export class StylesService {
  constructor(
    @InjectRepository(Style)
    private styleRepository: Repository<Style>,
  ) {}

  async create(createStyleDto: CreateStyleDto): Promise<Style> {
    // Verificar si ya existe un estilo con el mismo nombre (si se proporciona)
    if (createStyleDto.name) {
      const existingStyle = await this.findByName(createStyleDto.name);
      if (existingStyle) {
        throw new ConflictException('Style name already exists');
      }
    }

    const style = this.styleRepository.create(createStyleDto);
    return this.styleRepository.save(style);
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, isActive } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (isActive !== undefined) {
      whereConditions.isActive = isActive === 'true';
    }

    const [styles, total] = await this.styleRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: styles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { styleID: id },
    });

    if (!style) {
      throw new NotFoundException('Style not found');
    }

    return style;
  }

  async findByName(name: string): Promise<Style | null> {
    return this.styleRepository.findOne({
      where: { name },
    });
  }

  async findActiveStyle(): Promise<Style | null> {
    return this.styleRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateStyleDto: UpdateStyleDto): Promise<Style> {
    const style = await this.findOne(id);

    // Verificar si el nombre ya existe (si se está actualizando)
    if (updateStyleDto.name && updateStyleDto.name !== style.name) {
      const existingStyle = await this.findByName(updateStyleDto.name);
      if (existingStyle) {
        throw new ConflictException('Style name already exists');
      }
    }

    Object.assign(style, updateStyleDto);
    style.updatedAt = new Date();

    return this.styleRepository.save(style);
  }

  async setActiveStyle(id: string): Promise<Style> {
    // Desactivar todos los estilos
    await this.styleRepository.update({}, { isActive: false });

    // Activar el estilo seleccionado
    const style = await this.findOne(id);
    style.isActive = true;
    style.updatedAt = new Date();

    return this.styleRepository.save(style);
  }

  async remove(id: string): Promise<void> {
    const style = await this.findOne(id);
    await this.styleRepository.remove(style);
  }
}