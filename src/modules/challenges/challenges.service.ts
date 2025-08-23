import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, DataSource } from 'typeorm';
import { MetaStats, positionsDetails } from 'src/common/utils';
import { RiskParams } from 'src/common/utils/risk';
import { riskEvaluationResult } from 'src/common/types/risk-results';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDetails } from './entities/challenge-details.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { CreateChallengeDetailsDto } from './dto/create-challenge-details.dto';
import { UpdateChallengeDetailsDto } from './dto/update-challenge-details.dto';
import { ChallengeTemplatesService } from '../challenge-templates/challenge-templates.service';
import { VerificationService } from '../verification/verification.service';
import { CertificatesService } from '../certificates/certificates.service';
import { BrokerAccountsService } from '../broker-accounts/broker-accounts.service';
import { MailerService } from '../mailer/mailer.service';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { UserAccount } from '../users/entities/user-account.entity';
import { ConfigService } from '@nestjs/config';
import { ChallengeStatus, VerificationStatus, CertificateType } from 'src/common/enums';
@Injectable()
export class ChallengesService {
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
    private dataSource: DataSource,
  ) {}

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

    if (status) {
      whereConditions.status = status;
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
      const relation = await this.challengeTemplatesService.findCompleteRelationChain(challenge.relationID);
      const stages = relation.stages.sort((a, b) => a.numPhase - b.numPhase);
      const totalPhases = stages.length;
      const isFinalPhase = challenge.numPhase === totalPhases;
      const isBeforeFinalPhase = challenge.numPhase === totalPhases - 1;

      // Actualizar el estado del challenge
      challenge.status = ChallengeStatus.APPROVED;
      challenge.endDate = new Date();
      challenge.isActive = false;

      // Si es la fase final, solo guardar y retornar
      if (isFinalPhase) {
        const savedChallenge = await queryRunner.manager.save(Challenge, challenge);
        await queryRunner.commitTransaction();
        return savedChallenge;
      }

      // Remover cuenta del buffer si existe
      if (challenge.brokerAccount) {
        try {
          await this.bufferService.upsertAccount(challenge.brokerAccount.login, null);
        } catch (error) {
          console.warn('Error removing account from buffer:', error.message);
        }
      }

      // Si es la fase antes de la final, verificar estado de verificación del usuario
      if (isBeforeFinalPhase) {
        const user = await queryRunner.manager.findOne(UserAccount, {
          where: { userID: challenge.userID },
        });

        if (!user.isVerified) {
          // Crear verificación si no existe
          const existingVerification = await this.verificationService.findByUserId(user.userID, {});
          if (!existingVerification || existingVerification.data.length === 0) {
            await this.verificationService.create(
              user.userID,
              {
                documentType: 'passport' as any,
                numDocument: '',
              }
            );
          }

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

          // Crear cuenta interna con isUsed = false
          const newBrokerAccount = await this.brokerAccountsService.create({
            login: `internal_${Date.now()}`,
            password: 'pending_verification',
            server: 'internal',
            platform: 'internal',
            serverIp: '127.0.0.1',
            isUsed: false,
          });

          // Crear nuevo challenge para la siguiente fase
          const newChallenge = await queryRunner.manager.save(Challenge, {
            userID: challenge.userID,
            relationID: challenge.relationID,
            numPhase: challenge.numPhase + 1,
            dynamicBalance: challenge.dynamicBalance,
            status: ChallengeStatus.INNITIAL,
            isActive: false,
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

          const savedChallenge = await queryRunner.manager.save(Challenge, challenge);
          await queryRunner.commitTransaction();
          return savedChallenge;
        }
      }

      // Para todas las demás fases o cuando el usuario está verificado
      // Crear nueva cuenta de broker
      const newBrokerAccount = await this.brokerAccountsService.create({
        login: `challenge_${Date.now()}`,
        password: this.generateRandomPassword(),
        server: 'live_server',
        platform: 'MT5',
        serverIp: '192.168.1.100',
        isUsed: true,
      });

      // Crear nuevo challenge para la siguiente fase
      const newChallenge = await queryRunner.manager.save(Challenge, {
        userID: challenge.userID,
        relationID: challenge.relationID,
        numPhase: challenge.numPhase + 1,
        dynamicBalance: challenge.dynamicBalance,
        status: ChallengeStatus.INNITIAL,
        isActive: true,
        parentID: challenge.challengeID,
        brokerAccountID: newBrokerAccount.brokerAccountID,
        startDate: new Date(),
      });

      // Enviar email con credenciales de la nueva cuenta
      const user = challenge.user;
      const challengeBalance = relation.balances.find(b => Number(b.balance) === Number(challenge.dynamicBalance));
      
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'New Phase Challenge Credentials',
        template: 'challenge-credentials',
        context: {
          email: user.email,
          challenge_type: relation.plan.name,
          Account_size: challengeBalance?.balance || challenge.dynamicBalance,
          login_details: {
            login: newBrokerAccount.login,
            password: newBrokerAccount.password,
            server: newBrokerAccount.server,
            platform: newBrokerAccount.platform,
          },
          landingUrl: this.configService.get<string>('app.clientUrl'),
        },
      });

      // Crear certificado para el challenge actual
      await this.certificatesService.create({
        userID: challenge.userID,
        challengeID: challenge.challengeID,
        type: CertificateType.phase2,
      });

      const savedChallenge = await queryRunner.manager.save(Challenge, challenge);
      await queryRunner.commitTransaction();
      return savedChallenge;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async setDisapprovedChallenge(id: string, observation?: string): Promise<Challenge> {
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
          await this.bufferService.upsertAccount(challenge.brokerAccount.login, null);
        } catch (error) {
          console.warn('Error removing account from buffer:', error.message);
        }
      }

      // Obtener información del challenge para el email
      const relation = await this.challengeTemplatesService.findCompleteRelationChain(challenge.relationID);
      const challengeBalance = relation.balances.find(b => Number(b.balance) === Number(challenge.dynamicBalance));
      
      // Enviar email de notificación de desaprobación
      await this.mailerService.sendMail({
        to: challenge.user.email,
        subject: 'Challenge Not Approved - Review Required',
        template: 'challenge-disapproved',
        context: {
          email: challenge.user.email,
          challengeType: relation.plan.name,
          accountSize: challengeBalance?.balance || challenge.dynamicBalance,
          reviewDate: new Date().toLocaleDateString(),
          observation: observation || null,
          landingUrl: this.configService.get<string>('app.clientUrl'),
        },
      });

      const savedChallenge = await queryRunner.manager.save(Challenge, challenge);
      await queryRunner.commitTransaction();
      return savedChallenge;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
}
