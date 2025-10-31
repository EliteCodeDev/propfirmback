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
      const incomingMeta = updateChallengeDetailsDto.metaStats as any;
      const existingMeta = (challengeDetails.metaStats ?? {}) as any;
      const mergedMeta: any = { ...existingMeta };

      // Equity: actualizar solo si es un número válido y > 0
      if (Object.prototype.hasOwnProperty.call(incomingMeta, 'equity')) {
        const eq = Number(incomingMeta.equity);
        if (!isNaN(eq) && isFinite(eq) && eq > 0) {
          mergedMeta.equity = eq;
        }
      }

      // maxMinBalance: merge superficial (no restringimos valores)
      if (incomingMeta.maxMinBalance != null) {
        mergedMeta.maxMinBalance = {
          ...(existingMeta.maxMinBalance ?? {}),
          ...incomingMeta.maxMinBalance,
        };
      }

      // averageMetrics: merge superficial
      if (incomingMeta.averageMetrics != null) {
        mergedMeta.averageMetrics = {
          ...(existingMeta.averageMetrics ?? {}),
          ...incomingMeta.averageMetrics,
        };
      }

      // Otros campos simples
      if (Object.prototype.hasOwnProperty.call(incomingMeta, 'numTrades')) {
        mergedMeta.numTrades =
          incomingMeta.numTrades != null ? incomingMeta.numTrades : existingMeta.numTrades;
      }
      if (Object.prototype.hasOwnProperty.call(incomingMeta, 'tradingDays')) {
        mergedMeta.tradingDays =
          incomingMeta.tradingDays != null ? incomingMeta.tradingDays : existingMeta.tradingDays;
      }

      updates.metaStats = mergedMeta;
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

      // openPositions: NO resetear si viene [] o undefined; solo actualizar si trae elementos
      if (
        Array.isArray(incomingPositions.openPositions) &&
        incomingPositions.openPositions.length > 0
      ) {
        mergedPositions.openPositions = incomingPositions.openPositions;
      } else if (Array.isArray(existingPositions.openPositions)) {
        mergedPositions.openPositions = existingPositions.openPositions;
      }

      // closedPositions: NO resetear si viene [] o undefined; solo actualizar si trae elementos
      if (
        Array.isArray(incomingPositions.closedPositions) &&
        incomingPositions.closedPositions.length > 0
      ) {
        // Validación defensiva: asegurar que realmente estén cerradas
        mergedPositions.closedPositions = (incomingPositions.closedPositions as any[]).filter(
          (p) =>
            p && typeof p.TimeClose === 'string' && !!p.TimeClose &&
            typeof p.ClosePrice === 'number' && !isNaN(p.ClosePrice),
        );
      } else if (Array.isArray(existingPositions.closedPositions)) {
        // Preservar cerradas desde BD, pero validar que sean realmente cerradas
        mergedPositions.closedPositions = (existingPositions.closedPositions as any[]).filter(
          (p) =>
            p && typeof p.TimeClose === 'string' && !!p.TimeClose &&
            typeof p.ClosePrice === 'number' && !isNaN(p.ClosePrice),
        );
      }

      // Extra: excluir de cerradas cualquier orden que esté reportada como abierta (evitar duplicaciones)
      try {
        const openList = Array.isArray(mergedPositions.openPositions)
          ? (mergedPositions.openPositions as any[])
          : [];
        const openIds = new Set(
          openList
            .map((op) => (op?.OrderId !== undefined ? String(op.OrderId) : ''))
            .filter((id) => id && id.length > 0),
        );
        if (Array.isArray(mergedPositions.closedPositions)) {
          mergedPositions.closedPositions = (mergedPositions.closedPositions as any[]).filter(
            (cp) => !openIds.has(String(cp?.OrderId)),
          );
        }
      } catch {}

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

    // Merge seguro de balance: ignorar valores nulos/NaN/cero
    if (
      Object.prototype.hasOwnProperty.call(
        updateChallengeDetailsDto,
        'balance',
      ) && updateChallengeDetailsDto.balance != null
    ) {
      const incomingBal = updateChallengeDetailsDto.balance as any;
      const existingBal = (challengeDetails.balance ?? {}) as any;
      const mergedBal: any = { ...existingBal };

      if (Object.prototype.hasOwnProperty.call(incomingBal, 'currentBalance')) {
        const v = Number(incomingBal.currentBalance);
        if (!isNaN(v) && isFinite(v) && v > 0) {
          mergedBal.currentBalance = v;
        }
      }
      if (Object.prototype.hasOwnProperty.call(incomingBal, 'dailyBalance')) {
        const v = Number(incomingBal.dailyBalance);
        if (!isNaN(v) && isFinite(v) && v > 0) {
          mergedBal.dailyBalance = v;
        }
      }
      if (Object.prototype.hasOwnProperty.call(incomingBal, 'initialBalance')) {
        const v = Number(incomingBal.initialBalance);
        if (!isNaN(v) && isFinite(v) && v > 0) {
          mergedBal.initialBalance = v;
        }
      }

      updates.balance = mergedBal;
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
        const incomingMeta = challengeDetailsData.metaStats as any;
        const existingMeta = (existingDetails.metaStats ?? {}) as any;
        const mergedMeta: any = { ...existingMeta };

        if (Object.prototype.hasOwnProperty.call(incomingMeta, 'equity')) {
          const eq = Number(incomingMeta.equity);
          if (!isNaN(eq) && isFinite(eq) && eq > 0) {
            mergedMeta.equity = eq;
          }
        }
        if (incomingMeta.maxMinBalance != null) {
          mergedMeta.maxMinBalance = {
            ...(existingMeta.maxMinBalance ?? {}),
            ...incomingMeta.maxMinBalance,
          };
        }
        if (incomingMeta.averageMetrics != null) {
          mergedMeta.averageMetrics = {
            ...(existingMeta.averageMetrics ?? {}),
            ...incomingMeta.averageMetrics,
          };
        }
        if (Object.prototype.hasOwnProperty.call(incomingMeta, 'numTrades')) {
          mergedMeta.numTrades =
            incomingMeta.numTrades != null ? incomingMeta.numTrades : existingMeta.numTrades;
        }
        if (Object.prototype.hasOwnProperty.call(incomingMeta, 'tradingDays')) {
          mergedMeta.tradingDays =
            incomingMeta.tradingDays != null ? incomingMeta.tradingDays : existingMeta.tradingDays;
        }

        updates.metaStats = mergedMeta;
      }
      if (
        Object.prototype.hasOwnProperty.call(challengeDetailsData, 'positions') &&
        challengeDetailsData.positions != null
      ) {
        const existingPositions = (existingDetails.positions ?? {}) as any;
        const incomingPositions = challengeDetailsData.positions as any;
        const mergedPositions: any = {};

        // openPositions: solo actualizar si hay elementos (>0)
        if (
          Array.isArray(incomingPositions.openPositions) &&
          incomingPositions.openPositions.length > 0
        ) {
          mergedPositions.openPositions = incomingPositions.openPositions;
        } else if (Array.isArray(existingPositions.openPositions)) {
          mergedPositions.openPositions = existingPositions.openPositions;
        }

        // closedPositions: solo actualizar si hay elementos (>0)
        if (
          Array.isArray(incomingPositions.closedPositions) &&
          incomingPositions.closedPositions.length > 0
        ) {
          // Validación defensiva: asegurar que realmente estén cerradas
          mergedPositions.closedPositions = (incomingPositions.closedPositions as any[]).filter(
            (p) =>
              p && typeof p.TimeClose === 'string' && !!p.TimeClose &&
              typeof p.ClosePrice === 'number' && !isNaN(p.ClosePrice),
          );
        } else if (Array.isArray(existingPositions.closedPositions)) {
          // Preservar cerradas desde BD, pero validar que sean realmente cerradas
          mergedPositions.closedPositions = (existingPositions.closedPositions as any[]).filter(
            (p) =>
              p && typeof p.TimeClose === 'string' && !!p.TimeClose &&
              typeof p.ClosePrice === 'number' && !isNaN(p.ClosePrice),
          );
        }

        // Extra: excluir de cerradas cualquier orden que esté reportada como abierta (evitar duplicaciones)
        try {
          const openList = Array.isArray(mergedPositions.openPositions)
            ? (mergedPositions.openPositions as any[])
            : [];
          const openIds = new Set(
            openList
              .map((op) => (op?.OrderId !== undefined ? String(op.OrderId) : ''))
              .filter((id) => id && id.length > 0),
          );
          if (Array.isArray(mergedPositions.closedPositions)) {
            mergedPositions.closedPositions = (mergedPositions.closedPositions as any[]).filter(
              (cp) => !openIds.has(String(cp?.OrderId)),
            );
          }
        } catch {}

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
      // Merge seguro de balance en upsert (actualización): ignorar valores nulos/NaN/cero
      if (
        Object.prototype.hasOwnProperty.call(
          challengeDetailsData,
          'balance',
        ) && challengeDetailsData.balance != null
      ) {
        const incomingBal = challengeDetailsData.balance as any;
        const existingBal = (existingDetails.balance ?? {}) as any;
        const mergedBal: any = { ...existingBal };

        if (Object.prototype.hasOwnProperty.call(incomingBal, 'currentBalance')) {
          const v = Number(incomingBal.currentBalance);
          if (!isNaN(v) && isFinite(v) && v > 0) {
            mergedBal.currentBalance = v;
          }
        }
        if (Object.prototype.hasOwnProperty.call(incomingBal, 'dailyBalance')) {
          const v = Number(incomingBal.dailyBalance);
          if (!isNaN(v) && isFinite(v) && v > 0) {
            mergedBal.dailyBalance = v;
          }
        }
        if (Object.prototype.hasOwnProperty.call(incomingBal, 'initialBalance')) {
          const v = Number(incomingBal.initialBalance);
          if (!isNaN(v) && isFinite(v) && v > 0) {
            mergedBal.initialBalance = v;
          }
        }

        updates.balance = mergedBal;
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
