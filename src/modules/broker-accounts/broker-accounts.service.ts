import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BrokerAccount } from './entities/broker-account.entity';
import { ChallengesService } from '../challenges/services/challenges.service';
import { CreateBrokerAccountDto } from './dto/create-broker-account.dto';
import { UpdateBrokerAccountDto } from './dto/update-broker-account.dto';
import { GenerateBrokerAccountDto } from './dto/generate-broker-account.dto';
import { UsersService } from 'src/modules/users/services/users.service';
import { generateRandomPassword } from 'src/common/utils/randomPassword';
import { ConfigService } from '@nestjs/config';
import { ChallengeRelationsService } from '../challenge-templates/services';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class BrokerAccountsService {
  private logger = new Logger(BrokerAccountsService.name);
  constructor(
    @InjectRepository(BrokerAccount)
    private brokerAccountRepository: Repository<BrokerAccount>,
    @Inject(forwardRef(() => ChallengesService))
    private challengesService: ChallengesService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private configService: ConfigService,
    private relationsService: ChallengeRelationsService,
    private usersService: UsersService,
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

  async generate(data: GenerateBrokerAccountDto) {
    this.logger.log(
      `Starting broker account generation for login: ${data.login}`,
    );

    try {
      const {
        email,
        login,
        masterPassword,
        investorPassword,
        groupName,
        relationID,
        initialBalance,
        isActive = true,
      } = data;

      this.logger.log(`Validating user with email: ${email}`);
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.error(`User not found with email: ${email}`);
        throw new NotFoundException(`User not found with email: ${email}`);
      }
      this.logger.log(`User found: ${user.userID}`);

      this.logger.log(`Checking if login already exists: ${login}`);
      const existingBrokerAccount = await this.findByLogin(login);
      if (existingBrokerAccount) {
        this.logger.error(`Login already exists: ${login}`);
        throw new ConflictException(`Login already exists: ${login}`);
      }
      this.logger.log(`Login is available: ${login}`);

      let relation;
      if (relationID) {
        this.logger.log(`Validating relation with ID: ${relationID}`);
        relation =
          await this.relationsService.findCompleteRelationChain(relationID);
        if (!relation) {
          this.logger.error(`Relation not found with ID: ${relationID}`);
          throw new NotFoundException(
            `Relation not found with ID: ${relationID}`,
          );
        }
        this.logger.log(`Relation found: ${relation.relationID}`);
      } else {
        this.logger.log('No relationID provided, proceeding without relation');
      }

      this.logger.log('Building broker account DTO');
      const brokerAccountDto: CreateBrokerAccountDto = {
        login,
        server: this.configService.get<string>('MT_SERVER') || 'DefaultServer',
        isUsed: true,
        ...(masterPassword && { password: masterPassword }),
        ...(investorPassword && { investorPass: investorPassword }),
        ...(initialBalance && { innitialBalance: initialBalance }),
      };
      this.logger.log('Dto:', JSON.stringify(brokerAccountDto));
      this.logger.log(`Broker account DTO created for login: ${login}`);

      this.logger.log(
        'Creating broker account and challenge through orders service',
      );
      const challengeRes = await this.ordersService.createBrokerAndChallenge(
        brokerAccountDto,
        user,
        relation,
      );

      if (!challengeRes || !challengeRes.data) {
        this.logger.error('Failed to create broker account and challenge');
        throw new Error('Failed to create broker account and challenge');
      }

      const challenge = challengeRes.data;
      this.logger.log(`Challenge created with ID: ${challenge.challengeID}`);

      if (isActive !== undefined) {
        this.logger.log(`Updating challenge active status to: ${isActive}`);
        challenge.isActive = isActive;
        await this.challengesService.update(challenge.challengeID, challenge);
        this.logger.log(`Challenge active status updated successfully`);
      }

      this.logger.log(
        `Broker account generation completed successfully for login: ${login}`,
      );
      return {
        success: true,
        message: 'Broker account generated successfully',
        data: {
          challengeID: challenge.challengeID,
          login: brokerAccountDto.login,
          server: brokerAccountDto.server,
          isActive: challenge.isActive,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error generating broker account for login ${data.login}:`,
        error.message,
      );

      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Handle unexpected errors
      this.logger.error(
        'Unexpected error during broker account generation:',
        error.stack,
      );
      throw new Error(`Failed to generate broker account: ${error.message}`);
    }
  }
}
