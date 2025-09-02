import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, DataSource, In } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDetails } from './entities/challenge-details.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { CreateChallengeDetailsDto } from './dto/create-challenge-details.dto';
import { UpdateChallengeDetailsDto } from './dto/update-challenge-details.dto';
import { ChallengeTemplatesService } from '../challenge-templates/services/challenge-templates.service';
import { VerificationService } from '../verification/verification.service';
import { CertificatesService } from '../certificates/certificates.service';
import { BrokerAccountsService } from '../broker-accounts/broker-accounts.service';
import { MailerService } from '../mailer/mailer.service';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { UserAccount } from '../users/entities/user-account.entity';
import { ConfigService } from '@nestjs/config';
import { StylesService } from '../styles/styles.service';
import { OrdersService } from '../orders/orders.service';
import {
  ChallengeStatus,
  VerificationStatus,
  CertificateType,
} from 'src/common/enums';
import { BrokerAccount } from '../broker-accounts/entities/broker-account.entity';
import { use } from 'passport';
import { generateRandomPassword } from 'src/common/utils/randomPassword';
import { CreateBrokerAccountDto } from '../broker-accounts/dto/create-broker-account.dto';
import { CreateAccountDto } from '../data/brokeret-api/dto/create-account.dto';
import { CreationFazoClient } from '../data/brokeret-api/client/creation-fazo.client';
import { BrokeretApiClient } from '../data/brokeret-api/client/brokeret-api.client';
@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeDetails)
    private challengeDetailsRepository: Repository<ChallengeDetails>,
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
    private challengeTemplatesService: ChallengeTemplatesService,
    private verificationService: VerificationService,
    private certificatesService: CertificatesService,
    private brokerAccountsService: BrokerAccountsService,
    private mailerService: MailerService,
    private bufferService: BufferService,
    private configService: ConfigService,
    private stylesService: StylesService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private dataSource: DataSource,
    private creationFazoClient: CreationFazoClient,
    private brokeretApiClient: BrokeretApiClient,
  ) {}

  /**
   * Función simplificada para crear una cuenta Brokeret
   * Encapsula la generación de contraseñas y la lógica de creación
   */
  async createBrokeretAccount(
    user: UserAccount,
    balance: number,
    groupName: string = 'contest\\PG\\kbst\\contestphase1',
    retryCount: number = 0,
  ): Promise<CreateBrokerAccountDto> {
    const maxRetries = 3;
    const retryDelay = 1000;

    try {
      this.logger.log('Creando cuenta Brokeret:', {
        userId: user.userID,
        email: user.email,
        balance,
        attempt: retryCount + 1,
      });

      // Generar contraseñas aleatorias
      const masterPassword = generateRandomPassword(8);
      const investorPassword = generateRandomPassword(8);

      // Construir nombre único para evitar duplicados
      const baseName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.username;

      const uniqueName =
        retryCount > 0 ? `${baseName}_${Date.now()}` : baseName;

      // Crear datos para la API de Fazo
      const createAccountData: CreateAccountDto = {
        name: uniqueName,
        groupName: groupName,
        email: user.email,
        phone: user.phone || '+1234567890',
        country: user.address?.country || 'US',
        city: user.address?.city || 'Unknown',
        address: user.address?.addressLine1 || 'Unknown',
        balance: balance,
        mPassword: masterPassword,
        iPassword: investorPassword,
        leverage: 100,
      };

      // Crear cuenta en Fazo
      const fazoResponse =
        await this.creationFazoClient.createAccount(createAccountData);

      this.logger.log('Cuenta Brokeret creada exitosamente:', {
        accountId: fazoResponse.user.accountid,
        balance: fazoResponse.user.balance,
      });

      // Realizar depósito inicial
      try {
        const depositData = {
          login: Number(fazoResponse.user.accountid),
          amount: balance,
          comment: 'Initial deposit for challenge account',
          payment_method: 'internal',
        };

        await this.brokeretApiClient.makeDeposit(depositData);
        this.logger.log('Depósito inicial completado');
      } catch (balanceError) {
        this.logger.error('Error en depósito inicial:', balanceError.message);
        throw new Error(
          `Failed to deposit initial balance: ${balanceError.message}`,
        );
      }

      // Retornar DTO de cuenta broker
      return {
        login: fazoResponse.user.accountid.toString(),
        password: masterPassword,
        server: process.env.MT_SERVER || 'FazoLiquidity',
        platform: 'MT5',
        isUsed: true,
        investorPass: investorPassword,
        innitialBalance: balance,
      };
    } catch (error) {
      this.logger.error('Error creando cuenta Brokeret:', {
        error: error.message,
        attempt: retryCount + 1,
        maxRetries,
      });

      // Reintentar en caso de conflicto de login
      if (
        (error.message.includes('Login already exists') ||
          error.message.includes('already exists') ||
          error.message.includes('duplicate')) &&
        retryCount < maxRetries
      ) {
        this.logger.warn(
          `Reintentando creación de cuenta. Intento ${retryCount + 2}/${maxRetries + 1}`,
        );

        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (retryCount + 1)),
        );

        return this.createBrokeretAccount(
          user,
          balance,
          groupName,
          retryCount + 1,
        );
      }

      throw new Error(`Failed to create Brokeret account: ${error.message}`);
    }
  }

  async create(createChallengeDto: CreateChallengeDto): Promise<Challenge> {
    // Validate that the relation exists if relationID is provided
    if (createChallengeDto.relationID) {
      await this.challengeTemplatesService.findOneRelation(
        createChallengeDto.relationID,
      );
    }

    const challenge = this.challengeRepository.create({
      ...createChallengeDto,
    });

    return this.challengeRepository.save(challenge);
  }

  async findAll(query: ChallengeQueryDto) {
    const { page = 1, limit = 10, status, userID } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    // Filtrar por status si se proporciona (array de strings)
    if (status && Array.isArray(status) && status.length > 0) {
      whereConditions.status = In(status);
    }

    if (userID) {
      whereConditions.userID = userID;
    }

    const [challenges, total] = await this.challengeRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { startDate: 'DESC' },
      relations: ['user', 'relation', 'parent', 'brokerAccount', 'details'],
    });

    return {
      data: challenges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(userID: string, query: ChallengeQueryDto) {
    return this.findAll({ ...query, userID });
  }

  async findByUserIdSimple(userID: string, query: ChallengeQueryDto) {
    this.logger.debug('find: ' + JSON.stringify(query.limit) + userID);
    const { page = 1, limit = 20, status, isActive } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {
      userID,
    };

    // Filtrar por status si se proporciona (array de strings)
    if (status && Array.isArray(status) && status.length > 0) {
      whereConditions.status = In(status);
    }

    // Filtrar por isActive si se proporciona (boolean)
    if (typeof isActive === 'boolean') {
      whereConditions.isActive = isActive;
    }

    const [challenges, total] = await this.challengeRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { startDate: 'DESC' },
      relations: ['relation', 'brokerAccount'],
    });

    return {
      data: challenges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Challenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { challengeID: id },
      relations: ['user', 'relation', 'parent', 'brokerAccount', 'details'],
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async update(
    id: string,
    updateChallengeDto: UpdateChallengeDto,
  ): Promise<Challenge> {
    const challenge = await this.findOne(id);

    Object.assign(challenge, updateChallengeDto);

    return this.challengeRepository.save(challenge);
  }

  async remove(id: string): Promise<void> {
    const challenge = await this.findOne(id);
    await this.challengeRepository.remove(challenge);
  }

  async setApprovedChallenge(id: string): Promise<Challenge> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar el challenge con todas las relaciones necesarias
      const challenge = await queryRunner.manager.findOne(Challenge, {
        where: { challengeID: id },
        relations: ['user', 'relation', 'parent', 'brokerAccount', 'details'],
      });

      if (!challenge) {
        throw new NotFoundException(`Challenge with ID ${id} not found`);
      }

      // Obtener la cadena completa de relaciones y stages
      const relation =
        await this.challengeTemplatesService.findCompleteRelationChain(
          challenge.relationID,
        );
      const stages = relation.stages.sort((a, b) => a.numPhase - b.numPhase);
      const totalPhases = stages.length;
      const isFinalPhase = challenge.numPhase === totalPhases;
      const isBeforeFinalPhase = challenge.numPhase === totalPhases - 1;

      // Obtener balance para usar en toda la función
      let challengeBalance;
      let balance;

      if (challenge.dynamicBalance && challenge.dynamicBalance > 0) {
        // Si hay un dynamicBalance válido, buscar el balance correspondiente
        challengeBalance = relation.balances.find(
          (b) => Number(b.balance) === Number(challenge.dynamicBalance),
        );
        balance = challengeBalance?.balance || challenge.dynamicBalance;
      } else {
        // Si no hay dynamicBalance válido, usar el primer balance disponible
        challengeBalance = relation.balances?.[0];
        balance = challengeBalance?.balance || 10000; // Fallback por defecto
      }

      // Actualizar datos del challenge
      challenge.status = ChallengeStatus.APPROVED;
      challenge.endDate = new Date();
      challenge.isActive = false;

      // Si es la fase final, solo guardar y retornar
      if (isFinalPhase) {
        const savedChallenge = await queryRunner.manager.save(
          Challenge,
          challenge,
        );
        await queryRunner.commitTransaction();
        return savedChallenge;
      }

      // Remover cuenta del buffer si existe
      if (challenge.brokerAccount) {
        try {
          await this.bufferService.deleteAccount(challenge.brokerAccount.login);
        } catch (error) {
          console.warn('Error removing account from buffer:', error.message);
        }
      }

      // Si es la fase antes de la final, verificar estado de verificación del usuario
      if (isBeforeFinalPhase) {
        this.logger.debug(
          'setApprovedChallenge: Verificando estado de verificación del usuario',
        );
        const user = await queryRunner.manager.findOne(UserAccount, {
          where: { userID: challenge.userID },
        });

        if (!user.isVerified) {
          // Enviar email de verificación requerida
          await this.mailerService.sendMail({
            to: user.email,
            subject: 'Verification Required for Next Phase',
            template: 'verification-required',
            context: {
              email: user.email,
              challengeType: relation.plan.name,
              landingUrl: this.configService.get<string>('app.clientUrl'),
            },
          });

          // Crear cuenta en Brokeret incluso para usuarios no verificados

          this.logger.log(
            `Creando cuenta Brokeret para usuario no verificado - challenge ${challenge.challengeID}:`,
            {
              userId: user.userID,
              email: user.email,
              balance: Number(balance),
              isVerified: user.isVerified,
            },
          );
          let brokeretAccountDto;
          try {
            brokeretAccountDto = await this.createBrokeretAccount(
              user,
              Number(balance),
              relation.groupName,
            );

            this.logger.log(
              `Cuenta Brokeret creada para usuario no verificado - challenge ${challenge.challengeID}:`,
              {
                login: brokeretAccountDto.login,
                balance: brokeretAccountDto.innitialBalance,
              },
            );
          } catch (brokeretError) {
            this.logger.error(
              `Error crítico creando cuenta Brokeret para usuario no verificado - challenge ${challenge.challengeID}:`,
              {
                error: brokeretError.message,
                stack: brokeretError.stack,
                userId: user.userID,
                email: user.email,
                balance: Number(balance),
              },
            );

            // Re-lanzar el error para que falle la transacción completa
            throw new Error(
              `Failed to create Brokeret account for challenge ${challenge.challengeID}: ${brokeretError.message}`,
            );
          }

          const newBrokerAccount = await this.brokerAccountsService.create({
            login: brokeretAccountDto.login,
            password: brokeretAccountDto.password,
            server: brokeretAccountDto.server,
            platform: brokeretAccountDto.platform || 'MT5',
            serverIp: brokeretAccountDto.serverIp || '',
            isUsed: user.isVerified, // true si está verificado, false si no
            investorPass: brokeretAccountDto.investorPass,
            innitialBalance: brokeretAccountDto.innitialBalance,
          });

          // Crear nuevo challenge para la siguiente fase
          const newChallenge = await queryRunner.manager.save(Challenge, {
            userID: challenge.userID,
            relationID: challenge.relationID,
            numPhase: challenge.numPhase + 1,
            dynamicBalance: challenge.dynamicBalance,
            status: ChallengeStatus.INNITIAL,
            isActive: user.isVerified, // true si está verificado, false si no
            parentID: challenge.challengeID,
            brokerAccountID: newBrokerAccount.brokerAccountID,
            startDate: new Date(),
          });

          // Crear certificado para el challenge actual
          await this.certificatesService.create({
            userID: challenge.userID,
            challengeID: challenge.challengeID,
            type: CertificateType.phase1,
          });

          const savedChallenge = await queryRunner.manager.save(
            Challenge,
            challenge,
          );
          await queryRunner.commitTransaction();
          return savedChallenge;
        }
      }

      // Para todas las demás fases o cuando el usuario está verificado
      // Crear nueva cuenta de broker en Brokeret
      const user = challenge.user;

      // Crear cuenta en Brokeret con el balance del challenge
      this.logger.log(
        `Iniciando creación de cuenta Brokeret para challenge ${challenge.challengeID}:`,
        {
          userId: user.userID,
          email: user.email,
          balance: Number(balance),
          isVerified: user.isVerified,
        },
      );

      let brokeretAccountDto;
      try {
        brokeretAccountDto = await this.createBrokeretAccount(
          user,
          Number(balance),
          relation.groupName,
        );

        this.logger.log(
          `Cuenta de Brokeret creada exitosamente para challenge ${challenge.challengeID}:`,
          {
            login: brokeretAccountDto.login,
            balance: brokeretAccountDto.innitialBalance,
            groupName: relation.groupName,
          },
        );
      } catch (brokeretError) {
        this.logger.error(
          `Error crítico creando cuenta Brokeret para challenge ${challenge.challengeID}:`,
          {
            error: brokeretError.message,
            stack: brokeretError.stack,
            userId: user.userID,
            email: user.email,
            balance: Number(balance),
          },
        );

        // Re-lanzar el error para que falle la transacción completa
        throw new Error(
          `Failed to create Brokeret account for challenge ${challenge.challengeID}: ${brokeretError.message}`,
        );
      }

      // Crear registro local de la cuenta de broker

      const newBrokerAccount = await this.brokerAccountsService.create({
        login: brokeretAccountDto.login,
        password: brokeretAccountDto.password,
        server: brokeretAccountDto.server || 'brokeret-server',
        platform: brokeretAccountDto.platform || 'MT5',
        serverIp: brokeretAccountDto.serverIp || 'brokeret-server.com',
        isUsed: user.isVerified, // true si está verificado, false si no
        investorPass: brokeretAccountDto.investorPass,
        innitialBalance: brokeretAccountDto.innitialBalance,
      });

      // Crear nuevo challenge para la siguiente fase
      const newChallenge = await queryRunner.manager.save(Challenge, {
        userID: challenge.userID,
        relationID: challenge.relationID,
        numPhase: challenge.numPhase + 1,
        dynamicBalance: challenge.dynamicBalance,
        status: ChallengeStatus.INNITIAL,
        isActive: user.isVerified, // true si está verificado, false si no
        parentID: challenge.challengeID,
        brokerAccountID: newBrokerAccount.brokerAccountID,
        startDate: new Date(),
      });

      // Enviar email de aprobación con credenciales de la nueva cuenta

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Challenge Approved - Next Phase Credentials',
        template: 'challenge-approved',
        context: {
          object: 'Challenge Approved',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          old_login: challenge.brokerAccount?.login || 'N/A',
          login: newBrokerAccount.login,
          password: newBrokerAccount.password,
          server: newBrokerAccount.server,
          account_size: balance || challenge.dynamicBalance,
          profit_target: balance || 'N/A',
          currentYear: new Date().getFullYear(),
          logoUrl: this.configService.get<string>('app.logoUrl') || '',
          landingUrl: this.configService.get<string>('app.clientUrl'),
          certificateUrl: `${this.configService.get<string>('app.clientUrl')}/certificates/${challenge.challengeID}`,
        },
      });

      // Crear certificado para el challenge actual
      await this.certificatesService.create({
        userID: challenge.userID,
        challengeID: challenge.challengeID,
        type: CertificateType.phase2,
      });

      const savedChallenge = await queryRunner.manager.save(
        Challenge,
        challenge,
      );
      await queryRunner.commitTransaction();
      return savedChallenge;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async setDisapprovedChallenge(
    id: string,
    observation?: string,
  ): Promise<Challenge> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar el challenge con todas las relaciones necesarias
      const challenge = await queryRunner.manager.findOne(Challenge, {
        where: { challengeID: id },
        relations: ['user', 'relation', 'brokerAccount'],
      });

      if (!challenge) {
        throw new NotFoundException(`Challenge with ID ${id} not found`);
      }

      // Actualizar el estado del challenge
      challenge.status = ChallengeStatus.DISAPPROVED;
      challenge.endDate = new Date();
      challenge.isActive = false;

      // Remover cuenta del buffer si existe
      if (challenge.brokerAccount) {
        try {
          await this.bufferService.deleteAccount(challenge.brokerAccount.login);
        } catch (error) {
          console.warn('Error removing account from buffer:', error.message);
        }
      }

      // Obtener información del challenge para el email
      const relation =
        await this.challengeTemplatesService.findCompleteRelationChain(
          challenge.relationID,
        );
      let challengeBalance;
      if (challenge.dynamicBalance && challenge.dynamicBalance > 0) {
        challengeBalance = relation.balances.find(
          (b) => Number(b.balance) === Number(challenge.dynamicBalance),
        );
      } else {
        challengeBalance = relation.balances?.[0];
      }

      // Enviar email de notificación de desaprobación
      await this.mailerService.sendMail({
        to: challenge.user.email,
        subject: 'Challenge Not Approved - Review Required',
        template: 'challenge-not-approved',
        context: {
          email: challenge.user.email,
          challenge_type: relation.plan.name,
          account_size: challengeBalance?.balance || challenge.dynamicBalance,
          challenge_id: challenge.challengeID,
          disapproval_reason: observation || 'No specific reason provided',
          logoUrl: this.configService.get<string>('app.logoUrl') || '',
          landingUrl: this.configService.get<string>('app.clientUrl'),
          new_challenge_url: `${this.configService.get<string>('app.clientUrl')}/challenges/new`,
        },
      });

      const savedChallenge = await queryRunner.manager.save(
        Challenge,
        challenge,
      );
      await queryRunner.commitTransaction();
      return savedChallenge;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Template-related methods
  async getAvailableRelations() {
    return this.challengeTemplatesService.findAllRelations();
  }

  async getAvailableCategories() {
    return this.challengeTemplatesService.findAllCategories();
  }

  async getAvailablePlans() {
    return this.challengeTemplatesService.findAllPlans();
  }

  // Challenge Details methods
  async createChallengeDetails(
    createChallengeDetailsDto: CreateChallengeDetailsDto,
  ): Promise<ChallengeDetails> {
    // Verify that the challenge exists
    const challenge = await this.findOne(createChallengeDetailsDto.challengeID);
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Check if details already exist for this challenge
    const existingDetails = await this.challengeDetailsRepository.findOne({
      where: { challengeID: createChallengeDetailsDto.challengeID },
    });

    if (existingDetails) {
      throw new ForbiddenException(
        'Challenge details already exist for this challenge',
      );
    }

    const payloadCreate: DeepPartial<ChallengeDetails> = {
      challengeID: createChallengeDetailsDto.challengeID,
      metaStats: createChallengeDetailsDto.metaStats || null,
      positions: createChallengeDetailsDto.positions || null,
      rulesValidation: createChallengeDetailsDto.rulesValidation || null,
      rulesParams: createChallengeDetailsDto.rulesParams || null,
      lastUpdate: createChallengeDetailsDto.lastUpdate ?? new Date(),
    };
    const challengeDetails =
      this.challengeDetailsRepository.create(payloadCreate);

    return this.challengeDetailsRepository.save(challengeDetails);
  }

  async findAllChallengeDetails(): Promise<ChallengeDetails[]> {
    return this.challengeDetailsRepository.find({
      relations: ['challenge'],
    });
  }

  async findChallengeDetails(challengeID: string): Promise<ChallengeDetails> {
    const challengeDetails = await this.challengeDetailsRepository.findOne({
      where: { challengeID },
      relations: ['challenge'],
    });

    if (!challengeDetails) {
      throw new NotFoundException('Challenge details not found');
    }

    return challengeDetails;
  }

  async updateChallengeDetails(
    challengeID: string,
    updateChallengeDetailsDto: UpdateChallengeDetailsDto,
  ): Promise<ChallengeDetails> {
    const challengeDetails = await this.findChallengeDetails(challengeID);

    const updates: DeepPartial<ChallengeDetails> = {
      lastUpdate: new Date(),
    };
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'metaStats',
      )
    ) {
      updates.metaStats = updateChallengeDetailsDto.metaStats || null;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'positions',
      )
    ) {
      updates.positions = updateChallengeDetailsDto.positions || null;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'rulesValidation',
      )
    ) {
      updates.rulesValidation =
        updateChallengeDetailsDto.rulesValidation || null;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'rulesParams',
      )
    ) {
      updates.rulesParams = updateChallengeDetailsDto.rulesParams || null;
    }

    Object.assign(challengeDetails, updates);

    return this.challengeDetailsRepository.save(challengeDetails);
  }

  async upsertChallengeDetails(
    challengeID: string,
    challengeDetailsData: Omit<CreateChallengeDetailsDto, 'challengeID'>,
  ): Promise<ChallengeDetails> {
    // Verify that the challenge exists
    const challenge = await this.findOne(challengeID);
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const existingDetails = await this.challengeDetailsRepository.findOne({
      where: { challengeID },
    });

    if (existingDetails) {
      // Update existing details
      const updates: DeepPartial<ChallengeDetails> = {
        lastUpdate: new Date(),
      };
      if (
        Object.prototype.hasOwnProperty.call(challengeDetailsData, 'metaStats')
      ) {
        updates.metaStats = challengeDetailsData.metaStats || null;
      }
      if (
        Object.prototype.hasOwnProperty.call(challengeDetailsData, 'positions')
      ) {
        updates.positions = challengeDetailsData.positions || null;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          challengeDetailsData,
          'rulesValidation',
        )
      ) {
        updates.rulesValidation = challengeDetailsData.rulesValidation || null;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          challengeDetailsData,
          'rulesParams',
        )
      ) {
        updates.rulesParams = challengeDetailsData.rulesParams || null;
      }
      Object.assign(existingDetails, updates);
      return this.challengeDetailsRepository.save(existingDetails);
    } else {
      // Create new details
      const payloadNew: DeepPartial<ChallengeDetails> = {
        challengeID,
        metaStats: challengeDetailsData.metaStats || null,
        positions: challengeDetailsData.positions || null,
        rulesValidation: challengeDetailsData.rulesValidation || null,
        rulesParams: challengeDetailsData.rulesParams || null,
        lastUpdate: new Date(),
      };
      const challengeDetails =
        this.challengeDetailsRepository.create(payloadNew);
      return this.challengeDetailsRepository.save(challengeDetails);
    }
  }

  async removeChallengeDetails(challengeID: string): Promise<void> {
    const challengeDetails = await this.findChallengeDetails(challengeID);
    await this.challengeDetailsRepository.remove(challengeDetails);
  }

  async sendChallengeCredentials(id: string): Promise<{ message: string }> {
    // Buscar el challenge con todas las relaciones necesarias
    const challenge = await this.challengeRepository.findOne({
      where: { challengeID: id },
      relations: ['user', 'relation', 'brokerAccount'],
    });

    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${id} not found`);
    }

    if (!challenge.brokerAccount) {
      throw new NotFoundException('No broker account found for this challenge');
    }

    // Obtener información del challenge para el email
    const relation =
      await this.challengeTemplatesService.findCompleteRelationChain(
        challenge.relationID,
      );
    let challengeBalance;
    if (challenge.dynamicBalance && challenge.dynamicBalance > 0) {
      challengeBalance = relation.balances.find(
        (b) => Number(b.balance?.balance) === Number(challenge.dynamicBalance),
      );
    } else {
      challengeBalance = relation.balances?.[0];
    }

    // Obtener el estilo activo de la base de datos
    const activeStyle = await this.stylesService.findActiveStyle();

    // Valores por defecto si no hay estilo activo
    const defaultStyle = {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      tertiaryColor: '#28a745',
      banner: this.configService.get<string>('DEFAULT_BANNER_URL') || '',
    };

    // Asegurar que siempre tengamos los valores de color
    const styleData = {
      primaryColor: activeStyle?.primaryColor || defaultStyle.primaryColor,
      secondaryColor:
        activeStyle?.secondaryColor || defaultStyle.secondaryColor,
      tertiaryColor: activeStyle?.tertiaryColor || defaultStyle.tertiaryColor,
      banner: activeStyle?.banner || defaultStyle.banner,
    };

    // Log para depuración
    console.log('Active Style:', activeStyle);
    console.log('Style Data being sent to template:', styleData);

    // Enviar email con credenciales usando la plantilla
    await this.mailerService.sendMail({
      to: challenge.user.email,
      subject: 'Challenge Credentials - Access Information',
      template: 'challenge-credentials',
      context: {
        ...styleData,
        object: 'Challenge Credentials',
        email: challenge.user.email,
        subject: 'Challenge Credentials - Access Information',
        challenge_type: relation.plan.name,
        account_size: challengeBalance?.balance?.balance,
        platform: challenge.brokerAccount.platform,
        login_details: {
          login: challenge.brokerAccount.login,
          password: challenge.brokerAccount.password,
          server: challenge.brokerAccount.server,
          platform: challenge.brokerAccount.platform,
        },
        logoUrl: this.configService.get<string>('app.logoUrl') || '',
        landingUrl: this.configService.get<string>('app.clientUrl'),
      },
    });

    return { message: 'Credentials sent successfully' };
  }
}
