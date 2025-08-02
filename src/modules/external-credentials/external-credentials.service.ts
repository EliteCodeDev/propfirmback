import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalCredential } from './entities/external-credential.entity';
import { CreateExternalCredentialDto } from './dto/create-external-credential.dto';

@Injectable()
export class ExternalCredentialsService {
  constructor(
    @InjectRepository(ExternalCredential)
    private externalCredentialRepository: Repository<ExternalCredential>,
  ) {}

  async create(
    createExternalCredentialDto: CreateExternalCredentialDto,
  ): Promise<ExternalCredential> {
    const credential = this.externalCredentialRepository.create(
      createExternalCredentialDto,
    );
    return this.externalCredentialRepository.save(credential);
  }

  async findAll(): Promise<ExternalCredential[]> {
    return this.externalCredentialRepository.find({
      relations: ['user'],
    });
  }

  async findByUserId(userID: string): Promise<ExternalCredential> {
    const credential = await this.externalCredentialRepository.findOne({
      where: { userID: userID },
      relations: ['user'],
    });

    if (!credential) {
      throw new NotFoundException('External credential not found');
    }

    return credential;
  }

  async update(
    userID: string,
    updateData: Partial<CreateExternalCredentialDto>,
  ): Promise<ExternalCredential> {
    const credential = await this.findByUserId(userID);

    Object.assign(credential, updateData);

    return this.externalCredentialRepository.save(credential);
  }

  async remove(userID: string): Promise<void> {
    const credential = await this.findByUserId(userID);
    await this.externalCredentialRepository.remove(credential);
  }
}
