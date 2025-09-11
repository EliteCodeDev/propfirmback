import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { WithdrawalStatus } from 'src/common/enums/withdrawal-status.enum';
import { ChallengesService } from '../challenges/services/challenges.service';
import { CertificatesService } from '../certificates/certificates.service';
import { ChallengeTemplatesService } from '../challenge-templates/services/challenge-templates.service';
import { BrokerAccountsService } from '../broker-accounts/broker-accounts.service';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { ChallengeStatus, CertificateType } from 'src/common/enums';
import { generateRandomPassword } from 'src/common/utils/randomPassword';
import { OrdersService } from '../orders/orders.service';
import { getLimitWeek, getWithdrawalRuleValueBySlug } from 'src/common/utils/mappers/account-mapper';
import { RulesWithdrawalService } from '../challenge-templates/services/rules-withdrawal.service';
import { ChallengeDetails } from '../challenges/entities/challenge-details.entity';
import { ChallengeDetailsService } from '../challenges/services/challenge-details.service';
@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    private challengeDetailsService: ChallengeDetailsService,
    private challengesService: ChallengesService,
    private certificatesService: CertificatesService,
    private challengeTemplatesService: ChallengeTemplatesService,
    private brokerAccountsService: BrokerAccountsService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private ordersService: OrdersService,
    private rulesWithdrawalService: RulesWithdrawalService,
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
  // VALIDACION DE UN RETIRO
  async createRequest(
    userID: string,
    createWithdrawalDto: CreateWithdrawalDto,
  ): Promise<Withdrawal> {     

    const challenge = await this.challengesService.findOne(
      createWithdrawalDto.challengeID,
    );

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const withdrawalRules = await this.rulesWithdrawalService.findRulesByRelationId(
      challenge.relationID,
    );

    if (!withdrawalRules || withdrawalRules.length === 0) {
      throw new NotFoundException('Withdrawal rules not found for this challenge');
    }

    console.log("REGLAS EXISTENTES => ", withdrawalRules);

    // const existingWithdrawals = await this.withdrawalRepository.count({
    //   where: {
    //     challengeID: createWithdrawalDto.challengeID,
    //     // status: WithdrawalStatus.APPROVED
    //     status: WithdrawalStatus.PENDING,
    //   },
    // });
    const myWithdrawals = await this.withdrawalRepository.find({
      where:{ 
        challengeID: createWithdrawalDto.challengeID,
        // status: WithdrawalStatus.PENDING
        status: WithdrawalStatus.APPROVED
      },
      order: {createdAt:'DESC'}
    })

    let start : Date, ruleDays: string | number;
    //LOGICA PARA VALIDAR EL PRIMER RETIRO----
    if(myWithdrawals.length === 0){
      ruleDays = getWithdrawalRuleValueBySlug(withdrawalRules, 'first-payout-day');
      start = new Date(challenge.startDate);
    }else{
      start = new Date(myWithdrawals[0].createdAt);
      ruleDays = getWithdrawalRuleValueBySlug(withdrawalRules, 'recurring-payout');
      // console.log("------------------RETIRO REALIZADO => ", myWithdrawals);
    }
    
    const days = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysSafe = Math.max(0, days);

    //VERIFICAR SI LA REGLA DEL PRIMER RETIRO EXISTE Y DESPUES VERIFICAR SI CUMPLEN CON LOS DIAS ESTABLEECIDOS PARA HACER LE RETIRO 
    if (ruleDays && !(daysSafe >= parseInt(ruleDays))) {
      throw new BadRequestException(`Cannot request first withdrawal yet. Required: ${ruleDays || 'N/A'} days, elapsed: ${daysSafe} days`);
    }
    
    // Validar según el número de retiro y los splits
    const withdrawalNumber = myWithdrawals.length + 1; // El próximo número de retiro
    // console.log("NUMERO DE RETIRO => ", withdrawalNumber);
    // Buscar el split específico para este número de retiro (split-n)
    const splitSlug = `split-${withdrawalNumber}`;
    const splitValue = getWithdrawalRuleValueBySlug(withdrawalRules, splitSlug);
    
    // Si no existe un split específico para este número, buscar valores por defecto
    let expectedSplit: number;
    if (splitValue && splitValue !== '0') {
      expectedSplit = parseFloat(splitValue);
    } else {
      //ULTIMO SPLIT GUARDADO
      const rules_split = withdrawalRules.filter((rule)=> rule.rule.slugRule.includes('split'))
      console.log("REGLAS DE SPLIT => ", rules_split);
      expectedSplit = parseFloat(rules_split.pop().value)

    }

    if (expectedSplit <= 0) {
      throw new BadRequestException(
        `No withdrawal split configuration found for withdrawal number ${withdrawalNumber}`,
      );
    }

    const limit = getWithdrawalRuleValueBySlug(withdrawalRules, 'max-payout');
    
    challenge.details.balance.currentBalance = challenge.details.balance.currentBalance - createWithdrawalDto.amount;
    createWithdrawalDto.amount = (createWithdrawalDto.amount * expectedSplit) / 100;
    const requestedFinal = createWithdrawalDto.amount;
    const {weekStart, weekEnd} = getLimitWeek();

    const recent = await this.withdrawalRepository.find({//revisar los retiros semanales que estan en pendiente o aprobados
      where: {
        userID,
        createdAt: Between(weekStart, weekEnd),
        status: In([
          WithdrawalStatus.PENDING,
          WithdrawalStatus.APPROVED,
        ]),
      },
    });

    const sumWeek = recent.reduce((s, w) => s + (parseFloat(String(w.amount)) || 0), 0);
    if (sumWeek + requestedFinal > Number(limit)) {
      throw new BadRequestException(
        `Weekly limit exceeded (Monday-Sunday). Limit: ${limit}, requested: ${requestedFinal.toFixed(2)}, already requested this week: ${sumWeek.toFixed(2)}.`,
      );
    }
    // console.log("BALANCE ACTUALIZADO => ", challenge.details);
    const actualizar = await this.challengeDetailsService.updateChallengeDetails(challenge.details.challengeID,challenge.details);
    // console.log("CHALLENGE DETAILS ACTUALIZADO => ", actualizar);
    // Crear el withdrawal request
    const withdrawal = this.withdrawalRepository.create({
      ...createWithdrawalDto,
      userID,
      status: WithdrawalStatus.PENDING,
    });

    return await this.withdrawalRepository.save(withdrawal);
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

    // Si es rechazado, enviar correo de rechazo
    if (updateWithdrawalStatusDto.status === WithdrawalStatus.REJECTED) {
      const w = await this.withdrawalRepository.findOne({
        where: { withdrawalID: withdrawal.withdrawalID },
        relations: ['user'],
      });
      await this.mailerService.sendMail({
        to: w.user.email,
        subject: 'Withdrawal Rejected',
        template: 'withdrawal-rejected',
        context: {
          status: 'rejected',
          amount: withdrawal.amount,
          wallet: withdrawal.wallet,
          correo: w.user.email,
          observation: withdrawal.observation || '',
          landingUrl: this.configService.get<string>('app.clientUrl'),
        },
      });
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
          'challenge.relation.plan',
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

      // Crear nueva cuenta de broker para el nuevo challenge (reutilizando OrdersService helper)
      const createOrderDto = {
        user: {
          billing: {
            first_name: user.firstName || 'Withdrawal',
            last_name: user.lastName || 'User',
            phone: user.phone || '+1234567890',
            country: 'US',
            city: 'Unknown',
            address_1: 'Withdrawal Address',
            address_2: '',
          },
        },
      } as any;

      const brokeretAccountDto =
        await this.ordersService.createBrokeretApiAccount(
          user,
          createOrderDto,
          currentChallenge.dynamicBalance,
          'contest\\PG\\kbst\\contestphase1',
          relation,
        );

      const newBrokerAccount = await this.brokerAccountsService.create({
        login: brokeretAccountDto.login,
        password: brokeretAccountDto.password,
        server:
          brokeretAccountDto.server ||
          this.configService.get<string>('MT_SERVER') ||
          'brokeret-server',
        platform: brokeretAccountDto.platform || 'MT5',
        serverIp: brokeretAccountDto.serverIp || 'brokeret-server.com',
        isUsed: true,
        investorPass: brokeretAccountDto.investorPass,
        innitialBalance: brokeretAccountDto.innitialBalance,
      });

      // Crear nuevo challenge
      const newChallenge = await this.challengesService.create({
        userID: user.userID,
        relationID: relation.relationID,
        brokerAccountID: newBrokerAccount.brokerAccountID,
        startDate: new Date(),
        numPhase: 1,
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

      // Enviar email con credenciales del nuevo challenge (usar misma estructura que orders)
      const challengeBalance = relation.balances?.find(
        (b) => Number(b.balance) === Number(currentChallenge.dynamicBalance),
      );

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Challenge is ready to use!',
        template: 'challenge-credentials',
        context: {
          email: user.email,
          subject: 'Challenge is ready to use!',
          challenge_type: relation.plan?.name || 'Challenge',
          account_size:
            (challengeBalance as any)?.balance ||
            currentChallenge.dynamicBalance,
          platform: newBrokerAccount.platform,
          login_details: {
            login: newBrokerAccount.login,
            password: newBrokerAccount.password,
            server: newBrokerAccount.server,
            platform: newBrokerAccount.platform,
          },
          landingUrl: this.configService.get<string>('app.clientUrl'),
        },
      });

      // Enviar email de aprobación del retiro
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Withdrawal Approved',
        template: 'withdrawal-approved',
        context: {
          status: 'approved',
          amount: withdrawal.amount,
          wallet: withdrawal.wallet,
          correo: user.email,
          landingUrl: this.configService.get<string>('app.clientUrl'),
        },
      });

      // Importante: NO reasignar el withdrawal al nuevo challenge
      // withdrawal.challengeID = newChallenge.challengeID; // removido a propósito
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
