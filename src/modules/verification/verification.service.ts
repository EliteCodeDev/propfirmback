import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verification } from './entities/verification.entity';
import { Media } from './entities/media.entity';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { VerificationStatus } from 'src/common/enums/verification-status.enum';
import { MediaType } from 'src/common/enums/media-type.enum';
import { MinioService } from 'src/modules/storage/minio/minio.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private minioService: MinioService,
  ) {}

  async create(
    userID: string,
    createVerificationDto: CreateVerificationDto,
    files?: any[],
  ): Promise<Verification> {
    const verification = this.verificationRepository.create({
      ...createVerificationDto,
      userID,
      status: VerificationStatus.PENDING,
    });

    const savedVerification =
      await this.verificationRepository.save(verification);

    // Si hay archivos, guardarlos en MinIO
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = this.getFileTypeFromIndex(i); // front, back, selfie
        const folderPath = `verifications/${userID}/${savedVerification.verificationID}`;
        
        const uploadResult = await this.minioService.uploadFile(
          file,
          folderPath,
        );

        // Crear registro en Media
        const media = this.mediaRepository.create({
          url: uploadResult.url,
          type: this.getMediaType(file.mimetype),
          scope: 'verification',
          verificationID: savedVerification.verificationID,
        });

        await this.mediaRepository.save(media);
      }
    }

    return savedVerification;
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

    // Eliminar archivos asociados de MinIO
    if (verification.media && verification.media.length > 0) {
      for (const media of verification.media) {
        // Extraer el nombre del archivo de la URL
        const fileName = media.url.split('/').pop();
        if (fileName) {
          await this.minioService.deleteFile(fileName);
        }
      }
    }

    await this.verificationRepository.remove(verification);
  }

  private getFileTypeFromIndex(index: number): string {
    const types = ['front', 'back', 'selfie'];
    return types[index] || 'document';
  }

  private getMediaType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) {
      return MediaType.IMAGE;
    } else if (mimetype === 'application/pdf') {
      return MediaType.DOCUMENT;
    } else {
      return MediaType.DOCUMENT; // Default
    }
  }
}
