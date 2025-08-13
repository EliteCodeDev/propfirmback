import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async create(createApiKeyDto: CreateApiKeyDto, createdBy?: string) {
    // Verificar que el nombre no exista
    const existingKey = await this.apiKeyRepository.findOne({
      where: { name: createApiKeyDto.name },
    });

    if (existingKey) {
      throw new ConflictException('API key name already exists');
    }

    // Generar la API key
    const apiKey = this.generateApiKey();
    const keyHash = this.hashApiKey(apiKey);

    // Crear la entidad
    const newApiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      keyHash,
      createdBy,
      expiresAt: createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : null,
    });

    const savedApiKey = await this.apiKeyRepository.save(newApiKey);

    // Retornar la API key en texto plano solo una vez
    return {
      ...savedApiKey,
      apiKey, // Solo se muestra una vez
      keyHash: undefined, // No exponer el hash
    };
  }

  async findAll() {
    const apiKeys = await this.apiKeyRepository.find({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    return apiKeys;
  }

  async findOne(id: string) {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  async update(id: string, updateApiKeyDto: UpdateApiKeyDto) {
    const apiKey = await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista
    if (updateApiKeyDto.name && updateApiKeyDto.name !== apiKey.name) {
      const existingKey = await this.apiKeyRepository.findOne({
        where: { name: updateApiKeyDto.name },
      });

      if (existingKey) {
        throw new ConflictException('API key name already exists');
      }
    }

    const updateData = {
      ...updateApiKeyDto,
      expiresAt: updateApiKeyDto.expiresAt ? new Date(updateApiKeyDto.expiresAt) : undefined,
    };

    await this.apiKeyRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string) {
    const apiKey = await this.findOne(id);
    await this.apiKeyRepository.remove(apiKey);
    return { message: 'API key deleted successfully' };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    const keyHash = this.hashApiKey(apiKey);
    
    const dbApiKey = await this.apiKeyRepository.findOne({
      where: { keyHash, isActive: true },
    });

    if (!dbApiKey) {
      return false;
    }

    // Verificar si ha expirado
    if (dbApiKey.expiresAt && dbApiKey.expiresAt < new Date()) {
      return false;
    }

    // Actualizar último uso
    await this.apiKeyRepository.update(dbApiKey.id, {
      lastUsedAt: new Date(),
    });

    return true;
  }

  async regenerateApiKey(id: string, regeneratedBy?: string) {
    const existingApiKey = await this.findOne(id);
    
    // Generar nueva API key
    const newApiKey = this.generateApiKey();
    const newKeyHash = this.hashApiKey(newApiKey);

    // Actualizar en base de datos
    await this.apiKeyRepository.update(id, {
      keyHash: newKeyHash,
      updatedAt: new Date(),
    });

    const updatedApiKey = await this.findOne(id);

    return {
      ...updatedApiKey,
      apiKey: newApiKey, // Solo se muestra una vez
    };
  }

  private generateApiKey(): string {
    // Generar una API key de 32 bytes (256 bits) en formato hexadecimal
    const prefix = 'pk_'; // Prefijo para identificar fácilmente las keys
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
  }

  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }
}