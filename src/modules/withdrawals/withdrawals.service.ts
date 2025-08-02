import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { WithdrawalStatus } from 'src/common/enums/withdrawal-status.enum';
@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
  ) {}

  async create(
    userID: string,
    createWithdrawalDto: CreateWithdrawalDto,
  ): Promise<Withdrawal> {
    const withdrawal = this.withdrawalRepository.create({
      ...createWithdrawalDto,
      userID,
      status: WithdrawalStatus.PENDING,
    });

    return this.withdrawalRepository.save(withdrawal);
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (status) {
      whereConditions.status = status;
    }

    const [withdrawals, total] = await this.withdrawalRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user', 'challenge'],
    });

    return {
      data: withdrawals,
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

    const [withdrawals, total] = await this.withdrawalRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['challenge'],
    });

    return {
      data: withdrawals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { withdrawalID: id },
      relations: ['user', 'challenge'],
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }

  async update(
    id: string,
    updateWithdrawalDto: UpdateWithdrawalDto,
  ): Promise<Withdrawal> {
    const withdrawal = await this.findOne(id);

    Object.assign(withdrawal, updateWithdrawalDto);

    return this.withdrawalRepository.save(withdrawal);
  }

  async remove(id: string): Promise<void> {
    const withdrawal = await this.findOne(id);
    await this.withdrawalRepository.remove(withdrawal);
  }
}
