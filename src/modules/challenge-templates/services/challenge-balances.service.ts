import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import {
  ChallengeBalance,
  RelationBalance,
} from '../entities';
// DTOs
import {
  CreateChallengeBalanceDto,
  CreateRelationBalanceDto,
  CreateRelationBalancesDto,
  UpdateChallengeBalanceDto,
  UpdateRelationBalanceDto,
} from '../dto';

@Injectable()
export class ChallengeBalancesService {
  constructor(
    @InjectRepository(ChallengeBalance)
    private challengeBalanceRepository: Repository<ChallengeBalance>,
    @InjectRepository(RelationBalance)
    private relationBalanceRepository: Repository<RelationBalance>,
  ) {}

  // Challenge Balances
  async createBalance(
    dto: CreateChallengeBalanceDto,
  ): Promise<ChallengeBalance> {
    const balance = this.challengeBalanceRepository.create(dto);
    return this.challengeBalanceRepository.save(balance);
  }

  async findAllBalances(): Promise<ChallengeBalance[]> {
    return this.challengeBalanceRepository.find({
      relations: ['relationBalances'],
    });
  }

  async findOneBalance(id: string): Promise<ChallengeBalance> {
    const balance = await this.challengeBalanceRepository.findOne({
      where: { balanceID: id },
      relations: ['relationBalances'],
    });

    if (!balance) {
      throw new NotFoundException('Challenge balance not found');
    }

    return balance;
  }

  async updateBalance(
    id: string,
    dto: UpdateChallengeBalanceDto,
  ): Promise<ChallengeBalance> {
    const balance = await this.findOneBalance(id);
    Object.assign(balance, dto);
    return this.challengeBalanceRepository.save(balance);
  }

  async removeBalance(id: string): Promise<void> {
    const balance = await this.findOneBalance(id);
    await this.challengeBalanceRepository.remove(balance);
  }

  // Relation Balances
  async createRelationBalance(
    dto: CreateRelationBalanceDto,
  ): Promise<RelationBalance> {
    const relationBalance = this.relationBalanceRepository.create(dto);
    return this.relationBalanceRepository.save(relationBalance);
  }

  async createRelationBalances(
    dtos: CreateRelationBalancesDto,
  ): Promise<RelationBalance[]> {
    // Primero eliminar todos los relation balances existentes para esta relación
    await this.removeAllRelationBalancesByRelation(dtos.challengeRelationID);

    // Luego crear los nuevos relation balances
    let relationBalances: RelationBalance[] = [];
    for (const dto of dtos.relationBalances) {
      relationBalances.push(
        this.relationBalanceRepository.create({
          ...dto,
          balanceID: dto.challengeBalanceID,
          relationID: dtos.challengeRelationID,
        }),
      );
    }
    await this.relationBalanceRepository.save(relationBalances);
    return relationBalances;
  }

  async findAllRelationBalances(): Promise<RelationBalance[]> {
    return this.relationBalanceRepository.find({
      relations: ['balance', 'relation'],
    });
  }

  async findOneRelationBalance(id: string): Promise<RelationBalance> {
    const relationBalance = await this.relationBalanceRepository.findOne({
      where: { relationBalanceID: id },
      relations: ['balance', 'relation'],
    });

    if (!relationBalance) {
      throw new NotFoundException('Relation balance not found');
    }

    return relationBalance;
  }

  async updateRelationBalance(
    id: string,
    dto: UpdateRelationBalanceDto,
  ): Promise<RelationBalance> {
    const relationBalance = await this.findOneRelationBalance(id);
    Object.assign(relationBalance, dto);
    return this.relationBalanceRepository.save(relationBalance);
  }

  async removeRelationBalance(id: string): Promise<void> {
    const relationBalance = await this.findOneRelationBalance(id);
    await this.relationBalanceRepository.remove(relationBalance);
  }

  async removeAllRelationBalancesByRelation(relationId: string): Promise<void> {
    await this.relationBalanceRepository.delete({ relationID: relationId });
  }
}