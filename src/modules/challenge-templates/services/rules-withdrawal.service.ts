import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RelationRules } from '../entities/rules/relation-rule.entity';
import { WithdrawalRule } from '../entities/rules/withdrawal-rule.entity';
import { ChallengeRelation } from '../entities/challenge-relation.entity';
import { CreateRulesWithdrawalDto } from '../dto/create/create-rules-withdrawal.dto';
import { UpdateRulesWithdrawalDto } from '../dto/update/update-rules-withdrawal.dto';
import { RulesWithdrawalResponseDto } from '../dto/response/rules-withdrawal-response.dto';

@Injectable()
export class RulesWithdrawalService {
  constructor(
    @InjectRepository(RelationRules)
    private readonly rulesWithdrawalRepository: Repository<RelationRules>,
    @InjectRepository(WithdrawalRule)
    private readonly rulesRepository: Repository<WithdrawalRule>,
    @InjectRepository(ChallengeRelation)
    private readonly challengeRelationRepository: Repository<ChallengeRelation>,
  ) {}

  async findAll(): Promise<RulesWithdrawalResponseDto[]> {
    const rulesWithdrawals = await this.rulesWithdrawalRepository.find({
      relations: ['rule', 'relation'],
    });
    return rulesWithdrawals.map(this.mapToResponseDto);
  }

  async findByRuleId(ruleID: string): Promise<RulesWithdrawalResponseDto[]> {
    const rulesWithdrawals = await this.rulesWithdrawalRepository.find({
      where: { ruleID },
      relations: ['rule', 'relation'],
    });
    return rulesWithdrawals.map(this.mapToResponseDto);
  }

  async findByRelationId(
    relationID: string,
  ): Promise<RulesWithdrawalResponseDto[]> {
    const rulesWithdrawals = await this.rulesWithdrawalRepository.find({
      where: { relationID },
      relations: ['rule', 'relation'],
    });
    return rulesWithdrawals.map(this.mapToResponseDto);
  }

  async findRulesByRelationId(
    relationID: string,
  ): Promise<RelationRules[]> {
    const rulesWithdrawals = await this.rulesWithdrawalRepository.find({
      where: { relationID },
      relations: ['rule', 'relation'],
    });
    return rulesWithdrawals;
  }

  async findOne(
    ruleID: string,
    relationID: string,
  ): Promise<RulesWithdrawalResponseDto> {
    const rulesWithdrawal = await this.rulesWithdrawalRepository.findOne({
      where: { ruleID, relationID },
      relations: ['rule', 'relation'],
    });

    if (!rulesWithdrawal) {
      throw new NotFoundException(
        `RulesWithdrawal con idRule ${ruleID} y relationID ${relationID} no encontrado`,
      );
    }

    return this.mapToResponseDto(rulesWithdrawal);
  }

  async create(
    createRulesWithdrawalDto: CreateRulesWithdrawalDto,
  ): Promise<RulesWithdrawalResponseDto> {
    const { ruleID, relationID } = createRulesWithdrawalDto;

    const ruleExists = await this.rulesRepository.findOne({
      where: { ruleID },
    });
    if (!ruleExists) {
      throw new BadRequestException(`La regla con ID ${ruleID} no existe`);
    }

    const relationExists = await this.challengeRelationRepository.findOne({
      where: { relationID },
    });
    if (!relationExists) {
      throw new BadRequestException(
        `La relación de challenge con ID ${relationID} no existe`,
      );
    }

    const existingRulesWithdrawal =
      await this.rulesWithdrawalRepository.findOne({
        where: { ruleID, relationID },
      });
    if (existingRulesWithdrawal) {
      throw new BadRequestException(
        `Ya existe una regla de retiro para la regla ${ruleID} y relación ${relationID}`,
      );
    }

    const rulesWithdrawal = this.rulesWithdrawalRepository.create(
      createRulesWithdrawalDto,
    );
    const savedRulesWithdrawal =
      await this.rulesWithdrawalRepository.save(rulesWithdrawal);

    return this.findOne(
      savedRulesWithdrawal.ruleID,
      savedRulesWithdrawal.relationID,
    );
  }

  async update(
    ruleID: string,
    relationID: string,
    updateRulesWithdrawalDto: UpdateRulesWithdrawalDto,
  ): Promise<RulesWithdrawalResponseDto> {
    const rulesWithdrawal = await this.rulesWithdrawalRepository.findOne({
      where: { ruleID, relationID },
    });

    if (!rulesWithdrawal) {
      throw new NotFoundException(
        `RulesWithdrawal con idRule ${ruleID} y relationID ${relationID} no encontrado`,
      );
    }

    Object.assign(rulesWithdrawal, updateRulesWithdrawalDto);
    await this.rulesWithdrawalRepository.save(rulesWithdrawal);

    return this.findOne(ruleID, relationID);
  }

  async remove(ruleID: string, relationID: string): Promise<void> {
    const rulesWithdrawal = await this.rulesWithdrawalRepository.findOne({
      where: { ruleID, relationID },
    });

    if (!rulesWithdrawal) {
      throw new NotFoundException(
        `RulesWithdrawal con idRule ${ruleID} y relationID ${relationID} no encontrado`,
      );
    }

    await this.rulesWithdrawalRepository.remove(rulesWithdrawal);
  }

  private mapToResponseDto(
    rulesWithdrawal: RelationRules,
  ): RulesWithdrawalResponseDto {
    return {
      ruleID: rulesWithdrawal.ruleID,
      relationID: rulesWithdrawal.relationID,
      value: rulesWithdrawal.value,
      rule: rulesWithdrawal.rule,
      relation: rulesWithdrawal.relation,
    };
  }

  
}
