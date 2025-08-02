import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verification } from './entities/verification.entity';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { VerificationStatus } from 'src/common/enums/verification-status.enum';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
  ) {}

  async create(
    userID: string,
    createVerificationDto: CreateVerificationDto,
  ): Promise<Verification> {
    const verification = this.verificationRepository.create({
      ...createVerificationDto,
      userID,
      status: VerificationStatus.PENDING,
    });

    return this.verificationRepository.save(verification);
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, status, documentType } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (status) {
      whereConditions.status = status;
    }
    if (documentType) {
      whereConditions.documentType = documentType;
    }

    const [verifications, total] =
      await this.verificationRepository.findAndCount({
        where: whereConditions,
        skip,
        take: limit,
        order: { submittedAt: 'DESC' },
        relations: ['user', 'media'],
      });

    return {
      data: verifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(userID: string, query: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = { userID };
    if (status) {
      whereConditions.status = status;
    }

    const [verifications, total] =
      await this.verificationRepository.findAndCount({
        where: whereConditions,
        skip,
        take: limit,
        order: { submittedAt: 'DESC' },
        relations: ['media'],
      });

    return {
      data: verifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Verification> {
    const verification = await this.verificationRepository.findOne({
      where: { verificationID: id },
      relations: ['user', 'media'],
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    return verification;
  }

  async update(
    id: string,
    updateVerificationDto: UpdateVerificationDto,
  ): Promise<Verification> {
    const verification = await this.findOne(id);

    Object.assign(verification, updateVerificationDto);

    if (updateVerificationDto.status === VerificationStatus.APPROVED) {
      verification.approvedAt = new Date();
    } else if (updateVerificationDto.status === VerificationStatus.REJECTED) {
      verification.rejectedAt = new Date();
    }

    return this.verificationRepository.save(verification);
  }

  async remove(id: string): Promise<void> {
    const verification = await this.findOne(id);
    await this.verificationRepository.remove(verification);
  }
}
