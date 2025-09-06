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
import { MailerService } from 'src/modules/mailer/mailer.service';
import { UserAccount } from '../users/entities';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private minioService: MinioService,
    private mailerService: MailerService,
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
    private configService: ConfigService,
  ) {}

  async createVerification(
    userID: string,
    createVerificationDto: CreateVerificationDto,
    files?: any[],
  ): Promise<Verification> {
    //create verification

    const verification = await this.create(
      userID,
      createVerificationDto,
      files,
    );
    const user = await this.userAccountRepository.findOne({
      where: { userID: userID },
    });
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verification in Process',
      template: 'verification-in-process',
      context: {
        firstName: user.firstName,
        lastName: user.lastName,
        verificationID: verification.verificationID,
        currentYear: new Date().getFullYear(),
      },
    });
    return verification;
    //send email to user
  }
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
    const previousStatus = verification.status;

    Object.assign(verification, updateVerificationDto);

    if (updateVerificationDto.status === VerificationStatus.APPROVED) {
      verification.approvedAt = new Date();

      // Actualizar el campo isVerified del usuario cuando se aprueba la verificación
      await this.userAccountRepository.update(
        { userID: verification.userID },
        { isVerified: true },
      );
    } else if (updateVerificationDto.status === VerificationStatus.REJECTED) {
      verification.rejectedAt = new Date();
    }

    const updatedVerification =
      await this.verificationRepository.save(verification);

    // Enviar correo solo si el estado cambió
    if (previousStatus !== updateVerificationDto.status) {
      await this.sendVerificationStatusEmail(
        updatedVerification,
        updateVerificationDto.status,
      );
    }

    return updatedVerification;
  }

  private async sendVerificationStatusEmail(
    verification: Verification,
    newStatus: string,
  ): Promise<void> {
    try {
      const user = verification.user;
      const clientUrl = this.configService.get<string>('app.clientUrl');
      const dashboardUrl = `${clientUrl}/en/dashboard`;

      if (newStatus === VerificationStatus.APPROVED) {
        await this.mailerService.sendMail({
          to: user.email,
          subject: '¡Verificación Aprobada!',
          template: 'verification-approved',
          context: {
            firstName: user.firstName,
            lastName: user.lastName,
            verificationID: verification.verificationID,
            currentYear: new Date().getFullYear(),
            dashboardUrl,
          },
        });
      } else if (newStatus === VerificationStatus.REJECTED) {
        await this.mailerService.sendMail({
          to: user.email,
          subject: 'Verificación Rechazada',
          template: 'verification-rejected',
          context: {
            firstName: user.firstName,
            lastName: user.lastName,
            verificationID: verification.verificationID,
            rejectionReason: verification.rejectionReason,
            currentYear: new Date().getFullYear(),
          },
        });
      }
    } catch (error) {
      console.error('Error sending verification status email:', error);
      // No lanzamos el error para no afectar la actualización de la verificación
    }
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
