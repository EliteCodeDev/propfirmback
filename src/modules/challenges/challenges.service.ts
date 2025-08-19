import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { MetaStats, positionsDetails } from 'src/common/utils';
import { riskEvaluationResult } from 'src/common/types/risk-results';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDetails } from './entities/challenge-details.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { CreateChallengeDetailsDto } from './dto/create-challenge-details.dto';
import { UpdateChallengeDetailsDto } from './dto/update-challenge-details.dto';
import { ChallengeTemplatesService } from '../challenge-templates/challenge-templates.service';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeDetails)
    private challengeDetailsRepository: Repository<ChallengeDetails>,
    private challengeTemplatesService: ChallengeTemplatesService,
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
      metaStats: createChallengeDetailsDto.metaStats
        ? (JSON.parse(createChallengeDetailsDto.metaStats) as MetaStats)
        : null,
      positions: createChallengeDetailsDto.positions
        ? (JSON.parse(createChallengeDetailsDto.positions) as positionsDetails)
        : null,
      rulesValidation: createChallengeDetailsDto.rulesValidation
        ? (JSON.parse(
            createChallengeDetailsDto.rulesValidation,
          ) as riskEvaluationResult)
        : null,
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
      updates.metaStats = updateChallengeDetailsDto.metaStats
        ? (JSON.parse(updateChallengeDetailsDto.metaStats) as MetaStats)
        : null;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'positions',
      )
    ) {
      updates.positions = updateChallengeDetailsDto.positions
        ? (JSON.parse(updateChallengeDetailsDto.positions) as positionsDetails)
        : null;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'rulesValidation',
      )
    ) {
      updates.rulesValidation = updateChallengeDetailsDto.rulesValidation
        ? (JSON.parse(
            updateChallengeDetailsDto.rulesValidation,
          ) as riskEvaluationResult)
        : null;
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
        updates.metaStats = challengeDetailsData.metaStats
          ? (JSON.parse(challengeDetailsData.metaStats) as MetaStats)
          : null;
      }
      if (
        Object.prototype.hasOwnProperty.call(challengeDetailsData, 'positions')
      ) {
        updates.positions = challengeDetailsData.positions
          ? (JSON.parse(challengeDetailsData.positions) as positionsDetails)
          : null;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          challengeDetailsData,
          'rulesValidation',
        )
      ) {
        updates.rulesValidation = challengeDetailsData.rulesValidation
          ? (JSON.parse(
              challengeDetailsData.rulesValidation,
            ) as riskEvaluationResult)
          : null;
      }
      Object.assign(existingDetails, updates);
      return this.challengeDetailsRepository.save(existingDetails);
    } else {
      // Create new details
      const payloadNew: DeepPartial<ChallengeDetails> = {
        challengeID,
        metaStats: challengeDetailsData.metaStats
          ? (JSON.parse(challengeDetailsData.metaStats) as MetaStats)
          : null,
        positions: challengeDetailsData.positions
          ? (JSON.parse(challengeDetailsData.positions) as positionsDetails)
          : null,
        rulesValidation: challengeDetailsData.rulesValidation
          ? (JSON.parse(
              challengeDetailsData.rulesValidation,
            ) as riskEvaluationResult)
          : null,
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
