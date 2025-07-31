import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrokerAccount } from './entities/broker-account.entity';
import { CreateBrokerAccountDto } from './dto/create-broker-account.dto';
import { UpdateBrokerAccountDto } from './dto/update-broker-account.dto';

@Injectable()
export class BrokerAccountsService {
  constructor(
    @InjectRepository(BrokerAccount)
    private brokerAccountRepository: Repository<BrokerAccount>,
  ) {}

  async create(createBrokerAccountDto: CreateBrokerAccountDto): Promise<BrokerAccount> {
    const existingLogin = await this.findByLogin(createBrokerAccountDto.login);
    if (existingLogin) {
      throw new ConflictException('Login already exists');
    }

    const brokerAccount = this.brokerAccountRepository.create(createBrokerAccountDto);
    return this.brokerAccountRepository.save(brokerAccount);
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, isUsed } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (isUsed !== undefined) {
      whereConditions.isUsed = isUsed;
    }

    const [accounts, total] = await this.brokerAccountRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { login: 'ASC' },
    });

    return {
      data: accounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAvailable(): Promise<BrokerAccount[]> {
    return this.brokerAccountRepository.find({
      where: { isUsed: false },
      order: { login: 'ASC' },
    });
  }

  async findOne(id: string): Promise<BrokerAccount> {
    const account = await this.brokerAccountRepository.findOne({
      where: { brokerAccountID: id },
    });

    if (!account) {
      throw new NotFoundException('Broker account not found');
    }

    return account;
  }

  async findByLogin(login: string): Promise<BrokerAccount | null> {
    return this.brokerAccountRepository.findOne({
      where: { login },
    });
  }

  async update(id: string, updateBrokerAccountDto: UpdateBrokerAccountDto): Promise<BrokerAccount> {
    const account = await this.findOne(id);

    if (updateBrokerAccountDto.login && updateBrokerAccountDto.login !== account.login) {
      const existingLogin = await this.findByLogin(updateBrokerAccountDto.login);
      if (existingLogin) {
        throw new ConflictException('Login already exists');
      }
    }

    Object.assign(account, updateBrokerAccountDto);
    return this.brokerAccountRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    await this.brokerAccountRepository.remove(account);
  }
}