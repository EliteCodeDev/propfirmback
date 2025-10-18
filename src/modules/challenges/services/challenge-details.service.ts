import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ChallengeDetails } from '../entities/challenge-details.entity';
import { CreateChallengeDetailsDto } from '../dto/create-challenge-details.dto';
import { UpdateChallengeDetailsDto } from '../dto/update-challenge-details.dto';
import { ChallengesService } from '../services/challenges.service';

@Injectable()
export class ChallengeDetailsService {
  constructor(
    @InjectRepository(ChallengeDetails)
    private challengeDetailsRepository: Repository<ChallengeDetails>,
    @Inject(forwardRef(() => ChallengesService))
    private challengesService: ChallengesService,
  ) {}

  async createChallengeDetails(
    createChallengeDetailsDto: CreateChallengeDetailsDto,
  ): Promise<ChallengeDetails> {
    // Verify that the challenge exists
    const challenge = await this.challengesService.findOne(
      createChallengeDetailsDto.challengeID,
    );
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
      ) && updateChallengeDetailsDto.metaStats != null
    ) {
      updates.metaStats = {
        ...(challengeDetails.metaStats ?? {}),
        ...updateChallengeDetailsDto.metaStats,
      } as any;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'positions',
      ) && updateChallengeDetailsDto.positions != null
    ) {
      const existingPositions = (challengeDetails.positions ?? {}) as any;
      const incomingPositions = updateChallengeDetailsDto.positions as any;
      const mergedPositions: any = {};

      // openPositions: actualizar incluso si viene [] (porque puede quedar en cero legítimamente)
      if (Array.isArray(incomingPositions.openPositions)) {
        mergedPositions.openPositions = incomingPositions.openPositions;
      } else if (Array.isArray(existingPositions.openPositions)) {
        mergedPositions.openPositions = existingPositions.openPositions;
      }

      // closedPositions: NO resetear si viene [] o undefined; solo actualizar si trae elementos
      if (
        Array.isArray(incomingPositions.closedPositions) &&
        incomingPositions.closedPositions.length > 0
      ) {
        mergedPositions.closedPositions = incomingPositions.closedPositions;
      } else if (Array.isArray(existingPositions.closedPositions)) {
        mergedPositions.closedPositions = existingPositions.closedPositions;
      }

      updates.positions = mergedPositions;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'rulesValidation',
      ) && updateChallengeDetailsDto.rulesValidation != null
    ) {
      updates.rulesValidation = updateChallengeDetailsDto.rulesValidation;
    }

    // AGREGAR ESTA VALIDACIÓN PARA BALANCE
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'balance',
      ) && updateChallengeDetailsDto.balance != null
    ) {
      updates.balance = {
        ...(challengeDetails.balance ?? {}),
        ...updateChallengeDetailsDto.balance,
      } as any;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'rulesParams',
      ) && updateChallengeDetailsDto.rulesParams != null
    ) {
      updates.rulesParams = updateChallengeDetailsDto.rulesParams;
    }

    Object.assign(challengeDetails, updates);

    return this.challengeDetailsRepository.save(challengeDetails);
  }

  async upsertChallengeDetails(
    challengeID: string,
    challengeDetailsData: Omit<CreateChallengeDetailsDto, 'challengeID'>,
  ): Promise<ChallengeDetails> {
    // Verify that the challenge exists
    const challenge = await this.challengesService.findOne(challengeID);
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const existingDetails = await this.challengeDetailsRepository.findOne({
      where: { challengeID },
    });

    if (existingDetails) {
      // Update existing details, ignorando null/undefined y haciendo merge seguro
      const updates: DeepPartial<ChallengeDetails> = {
        lastUpdate: new Date(),
      };
      if (
        Object.prototype.hasOwnProperty.call(challengeDetailsData, 'metaStats') &&
        challengeDetailsData.metaStats != null
      ) {
        updates.metaStats = {
          ...(existingDetails.metaStats ?? {}),
          ...challengeDetailsData.metaStats,
        } as any;
      }
      if (
        Object.prototype.hasOwnProperty.call(challengeDetailsData, 'positions') &&
        challengeDetailsData.positions != null
      ) {
        const existingPositions = (existingDetails.positions ?? {}) as any;
        const incomingPositions = challengeDetailsData.positions as any;
        const mergedPositions: any = {};

        // openPositions: actualizar incluso si viene []
        if (Array.isArray(incomingPositions.openPositions)) {
          mergedPositions.openPositions = incomingPositions.openPositions;
        } else if (Array.isArray(existingPositions.openPositions)) {
          mergedPositions.openPositions = existingPositions.openPositions;
        }

        // closedPositions: solo actualizar si hay elementos (>0)
        if (
          Array.isArray(incomingPositions.closedPositions) &&
          incomingPositions.closedPositions.length > 0
        ) {
          mergedPositions.closedPositions = incomingPositions.closedPositions;
        } else if (Array.isArray(existingPositions.closedPositions)) {
          mergedPositions.closedPositions = existingPositions.closedPositions;
        }

        updates.positions = mergedPositions;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          challengeDetailsData,
          'rulesValidation',
        ) && challengeDetailsData.rulesValidation != null
      ) {
        updates.rulesValidation = challengeDetailsData.rulesValidation;
      }
      // Incluir balance en updates para que se persista en upsert, ignorando null
      if (
        Object.prototype.hasOwnProperty.call(
          challengeDetailsData,
          'balance',
        ) && challengeDetailsData.balance != null
      ) {
        updates.balance = {
          ...(existingDetails.balance ?? {}),
          ...challengeDetailsData.balance,
        } as any;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          challengeDetailsData,
          'rulesParams',
        ) && challengeDetailsData.rulesParams != null
      ) {
        updates.rulesParams = challengeDetailsData.rulesParams;
      }
      Object.assign(existingDetails, updates);
      return this.challengeDetailsRepository.save(existingDetails);
    } else {
      // Create new details
      const payloadNew: DeepPartial<ChallengeDetails> = {
        challengeID,
        metaStats: challengeDetailsData.metaStats ?? null,
        positions: challengeDetailsData.positions ?? null,
        rulesValidation: challengeDetailsData.rulesValidation ?? null,
        rulesParams: challengeDetailsData.rulesParams ?? null,
        balance: challengeDetailsData.balance ?? null,
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
