import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BrokerAccount } from './entities/broker-account.entity';
import { CreateBrokerAccountDto } from './dto/create-broker-account.dto';
import { UpdateBrokerAccountDto } from './dto/update-broker-account.dto';

@Injectable()
export class BrokerAccountsService {
  private logger = new Logger(BrokerAccountsService.name);
  constructor(
    @InjectRepository(BrokerAccount)
    private brokerAccountRepository: Repository<BrokerAccount>,
  ) {}

  async create(
    createBrokerAccountDto: CreateBrokerAccountDto,
  ): Promise<BrokerAccount> {
    this.logger.log(
      'Creating broker account with DTO:',
      createBrokerAccountDto,
    );
    const existingLogin = await this.findByLogin(createBrokerAccountDto.login);
    if (existingLogin) {
      throw new ConflictException('Login already exists');
    }

    // Usar MT_SERVER como fallback si no se especifica server
    if (!createBrokerAccountDto.server) {
      createBrokerAccountDto.server = process.env.MT_SERVER || 'DefaultServer';
    }

    const brokerAccount = this.brokerAccountRepository.create(
      createBrokerAccountDto,
    );
    return this.brokerAccountRepository.save(brokerAccount);
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, isUsed, login } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    
    // Filter by usage status
    if (isUsed !== undefined) {
      whereConditions.isUsed = isUsed === 'true';
    }
    
    // Filter by login (partial match)
    if (login && login.trim()) {
      whereConditions.login = Like(`%${login.trim()}%`);
    }

    const [accounts, total] = await this.brokerAccountRepository.findAndCount({
      where: whereConditions,
      skip,
      take: parseInt(limit),
      order: { login: 'DESC' },
    });

    return {
      data: accounts,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
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

  async update(
    id: string,
    updateBrokerAccountDto: UpdateBrokerAccountDto,
  ): Promise<BrokerAccount> {
    const account = await this.findOne(id);

    if (
      updateBrokerAccountDto.login &&
      updateBrokerAccountDto.login !== account.login
    ) {
      const existingLogin = await this.findByLogin(
        updateBrokerAccountDto.login,
      );
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
