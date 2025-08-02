import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affiliate } from './entities/affiliate.entity';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';

@Injectable()
export class AffiliatesService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
  ) {}

  async create(createAffiliateDto: CreateAffiliateDto): Promise<Affiliate> {
    const existingCode = await this.findByReferralCode(
      createAffiliateDto.referralCode,
    );
    if (existingCode) {
      throw new ConflictException('Referral code already exists');
    }

    const affiliate = this.affiliateRepository.create(createAffiliateDto);
    return this.affiliateRepository.save(affiliate);
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (status) {
      whereConditions.status = status;
    }

    const [affiliates, total] = await this.affiliateRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['parentAffiliate', 'childAffiliates', 'user'],
    });

    return {
      data: affiliates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Affiliate> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { affiliateID: id },
      relations: ['parentAffiliate', 'childAffiliates', 'user'],
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    return affiliate;
  }

  async findByReferralCode(referralCode: string): Promise<Affiliate | null> {
    return this.affiliateRepository.findOne({
      where: { referralCode },
    });
  }

  async update(
    id: string,
    updateAffiliateDto: UpdateAffiliateDto,
  ): Promise<Affiliate> {
    const affiliate = await this.findOne(id);

    if (
      updateAffiliateDto.referralCode &&
      updateAffiliateDto.referralCode !== affiliate.referralCode
    ) {
      const existingCode = await this.findByReferralCode(
        updateAffiliateDto.referralCode,
      );
      if (existingCode) {
        throw new ConflictException('Referral code already exists');
      }
    }

    Object.assign(affiliate, updateAffiliateDto);
    affiliate.updatedAt = new Date();

    return this.affiliateRepository.save(affiliate);
  }

  async remove(id: string): Promise<void> {
    const affiliate = await this.findOne(id);
    await this.affiliateRepository.remove(affiliate);
  }
}
