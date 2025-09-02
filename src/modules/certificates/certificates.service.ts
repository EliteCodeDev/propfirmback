import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { ConfigService } from '@nestjs/config';
import QRCode from 'qrcode';
@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    private configService: ConfigService,
  ) {}

  async create(
    createCertificateDto: CreateCertificateDto,
  ): Promise<Certificate> {
    const frontendUrl = this.configService.get<string>('app.clientUrl');
    const createCertificate = {
      ...createCertificateDto,
      qrLink: await QRCode.toDataURL(
        `${frontendUrl}/certificates/${createCertificateDto.challengeID}`,
      ),
      certificateDate: createCertificateDto.certificateDate
        ? new Date(createCertificateDto.certificateDate)
        : new Date(),
    };
    const certificate = this.certificateRepository.create(createCertificate);
    return this.certificateRepository.save(certificate);
  }

  async findAll(query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [certificates, total] = await this.certificateRepository.findAndCount(
      {
        skip,
        take: limit,
        order: { certificateDate: 'DESC' },
        relations: ['user', 'challenge'],
      },
    );

    return {
      data: certificates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(userID: string, query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [certificates, total] = await this.certificateRepository.findAndCount(
      {
        where: { userID },
        skip,
        take: limit,
        order: { certificateDate: 'DESC' },
        relations: ['challenge'],
      },
    );

    return {
      data: certificates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.certificateRepository.findOne({
      where: { certificateID: id },
      relations: ['user', 'challenge','challenge.brokerAccount'],
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return certificate;
  }

  async remove(id: string): Promise<void> {
    const certificate = await this.findOne(id);
    await this.certificateRepository.remove(certificate);
  }
}
