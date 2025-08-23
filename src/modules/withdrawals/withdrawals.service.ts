import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { WithdrawalStatus } from 'src/common/enums/withdrawal-status.enum';
import { ChallengesService } from '../challenges/challenges.service';
import { CertificatesService } from '../certificates/certificates.service';
import { ChallengeTemplatesService } from '../challenge-templates/challenge-templates.service';
import { BrokerAccountsService } from '../broker-accounts/broker-accounts.service';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { ChallengeStatus, CertificateType } from 'src/common/enums';
import { generateRandomPassword } from 'src/common/utils/randomPassword';
@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    private challengesService: ChallengesService,
    private certificatesService: CertificatesService,
    private challengeTemplatesService: ChallengeTemplatesService,
    private brokerAccountsService: BrokerAccountsService,
    private mailerService: MailerService,
    private configService: ConfigService,
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
    const { page = 1, limit = 10, status, email } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const qb = this.withdrawalRepository
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.user', 'user')
      .leftJoinAndSelect('w.challenge', 'challenge')
      .orderBy('w.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum);

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      qb.andWhere('w.status = :status', { status: normalizedStatus });
    }

    if (email) {
      qb.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
        email: `%${String(email).trim()}%`,
      });
    }

    const [withdrawals, total] = await qb.getManyAndCount();

    return {
      data: withdrawals,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findByUserId(userID: string, query: any) {
    const { page = 1, limit = 10, status } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const whereConditions: any = { userID };
    if (status) {
      whereConditions.status = String(status).toLowerCase();
    }

    const [withdrawals, total] = await this.withdrawalRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limitNum,
      order: { createdAt: 'DESC' },
      relations: ['challenge'],
    });

    return {
      data: withdrawals,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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

  async updateWithdrawalStatus(
    id: string,
    updateWithdrawalStatusDto: UpdateWithdrawalStatusDto,
  ): Promise<Withdrawal> {
    const withdrawal = await this.findOne(id);

    // Actualizar campos básicos
    withdrawal.status = updateWithdrawalStatusDto.status;
    if (updateWithdrawalStatusDto.observation) {
      withdrawal.observation = updateWithdrawalStatusDto.observation;
    }

    // Si el retiro es aprobado, crear un nuevo challenge y certificado
    if (updateWithdrawalStatusDto.status === WithdrawalStatus.APPROVED) {
      await this.handleWithdrawalApproval(withdrawal);
    }

    return this.withdrawalRepository.save(withdrawal);
  }

  private async handleWithdrawalApproval(
    withdrawal: Withdrawal,
  ): Promise<void> {
    try {
      // Obtener el usuario y challenge actual
      const currentWithdrawal = await this.withdrawalRepository.findOne({
        where: { withdrawalID: withdrawal.withdrawalID },
        relations: [
          'user',
          'challenge',
          'challenge.relation',
          'challenge.relation.balances',
        ],
      });

      if (!currentWithdrawal?.challenge?.relation) {
        throw new BadRequestException(
          'Challenge relation not found for withdrawal',
        );
      }

      const user = currentWithdrawal.user;
      const currentChallenge = currentWithdrawal.challenge;
      const relation = currentChallenge.relation;

      // Crear nueva cuenta de broker para el nuevo challenge
      const newBrokerAccount = await this.brokerAccountsService.create({
        login: `withdrawal_${Date.now()}`,
        password: generateRandomPassword(),
        server: 'live_server',
        platform: 'MT5',
        serverIp: '192.168.1.100',
        isUsed: true,
        investorPass: generateRandomPassword(),
        innitialBalance: currentChallenge.dynamicBalance,
      });

      // Crear nuevo challenge
      const newChallenge = await this.challengesService.create({
        userID: user.userID,
        relationID: relation.relationID,
        brokerAccountID: newBrokerAccount.brokerAccountID,
        startDate: new Date(),
        numPhase: 1, // Nuevo challenge comienza en fase 1
        isActive: true,
        status: ChallengeStatus.INNITIAL,
        parentID: currentChallenge.challengeID,
      });

      // Crear certificado para el challenge actual
      await this.certificatesService.create({
        userID: user.userID,
        challengeID: currentChallenge.challengeID,
        type: CertificateType.phase1,
        amount: withdrawal.amount,
      });

      // Enviar email con credenciales del nuevo challenge
      const challengeBalance = relation.balances?.find(
        (b) => Number(b.balance) === Number(currentChallenge.dynamicBalance),
      );

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Withdrawal Approved - New Challenge Credentials',
        template: 'withdrawal-approved-credentials',
        context: {
          email: user.email,
          withdrawal_amount: withdrawal.amount,
          challenge_type: relation.plan?.name || 'Challenge',
          Account_size:
            challengeBalance?.balance || currentChallenge.dynamicBalance,
          login_details: {
            login: newBrokerAccount.login,
            password: newBrokerAccount.password,
            server: newBrokerAccount.server,
            platform: newBrokerAccount.platform,
          },
          landingUrl: this.configService.get<string>('app.clientUrl'),
        },
      });

      // Actualizar el withdrawal con el nuevo challengeID
      withdrawal.challengeID = newChallenge.challengeID;
    } catch (error) {
      throw new BadRequestException(
        `Failed to process withdrawal approval: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const withdrawal = await this.findOne(id);
    await this.withdrawalRepository.remove(withdrawal);
  }
}
