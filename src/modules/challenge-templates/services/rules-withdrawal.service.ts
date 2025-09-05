import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RulesWithdrawal } from '../entities/rules/rules-withdrawal.entity';
import { Rules } from '../entities/rules/rules.entity';
import { ChallengeRelation } from '../entities/challenge-relation.entity';
import { CreateRulesWithdrawalDto } from '../dto/create/create-rules-withdrawal.dto';
import { UpdateRulesWithdrawalDto } from '../dto/update/update-rules-withdrawal.dto';
import { RulesWithdrawalResponseDto } from '../dto/response/rules-withdrawal-response.dto';

@Injectable()
export class RulesWithdrawalService {
  constructor(
    @InjectRepository(RulesWithdrawal)
    private readonly rulesWithdrawalRepository: Repository<RulesWithdrawal>,
    @InjectRepository(Rules)
    private readonly rulesRepository: Repository<Rules>,
    @InjectRepository(ChallengeRelation)
    private readonly challengeRelationRepository: Repository<ChallengeRelation>,
  ) {}

  async findAll(): Promise<RulesWithdrawalResponseDto[]> {
    const rulesWithdrawals = await this.rulesWithdrawalRepository.find({
      relations: ['rules', 'relation'],
    });
    return rulesWithdrawals.map(this.mapToResponseDto);
  }

  async findByRuleId(idRule: string): Promise<RulesWithdrawalResponseDto[]> {
    const rulesWithdrawals = await this.rulesWithdrawalRepository.find({
      where: { idRule },
      relations: ['rules', 'relation'],
    });
    return rulesWithdrawals.map(this.mapToResponseDto);
  }

  async findByRelationId(relationID: string): Promise<RulesWithdrawalResponseDto[]> {
    const rulesWithdrawals = await this.rulesWithdrawalRepository.find({
      where: { relationID },
      relations: ['rules', 'relation'],
    });
    return rulesWithdrawals.map(this.mapToResponseDto);
  }

  async findOne(idRule: string, relationID: string): Promise<RulesWithdrawalResponseDto> {
    const rulesWithdrawal = await this.rulesWithdrawalRepository.findOne({
      where: { idRule, relationID },
      relations: ['rules', 'relation'],
    });

    if (!rulesWithdrawal) {
      throw new NotFoundException(
        `RulesWithdrawal con idRule ${idRule} y relationID ${relationID} no encontrado`,
      );
    }

    return this.mapToResponseDto(rulesWithdrawal);
  }

  async create(createRulesWithdrawalDto: CreateRulesWithdrawalDto): Promise<RulesWithdrawalResponseDto> {
    const { idRule, relationID } = createRulesWithdrawalDto;

    const ruleExists = await this.rulesRepository.findOne({ where: { idRule } });
    if (!ruleExists) {
      throw new BadRequestException(`La regla con ID ${idRule} no existe`);
    }

    const relationExists = await this.challengeRelationRepository.findOne({
      where: { relationID },
    });
    if (!relationExists) {
      throw new BadRequestException(`La relación de challenge con ID ${relationID} no existe`);
    }

    const existingRulesWithdrawal = await this.rulesWithdrawalRepository.findOne({
      where: { idRule, relationID },
    });
    if (existingRulesWithdrawal) {
      throw new BadRequestException(
        `Ya existe una regla de retiro para la regla ${idRule} y relación ${relationID}`,
      );
    }

    const rulesWithdrawal = this.rulesWithdrawalRepository.create(createRulesWithdrawalDto);
    const savedRulesWithdrawal = await this.rulesWithdrawalRepository.save(rulesWithdrawal);

    return this.findOne(savedRulesWithdrawal.idRule, savedRulesWithdrawal.relationID);
  }

  async update(
    idRule: string,
    relationID: string,
    updateRulesWithdrawalDto: UpdateRulesWithdrawalDto,
  ): Promise<RulesWithdrawalResponseDto> {
    const rulesWithdrawal = await this.rulesWithdrawalRepository.findOne({
      where: { idRule, relationID },
    });

    if (!rulesWithdrawal) {
      throw new NotFoundException(
        `RulesWithdrawal con idRule ${idRule} y relationID ${relationID} no encontrado`,
      );
    }

    Object.assign(rulesWithdrawal, updateRulesWithdrawalDto);
    await this.rulesWithdrawalRepository.save(rulesWithdrawal);

    return this.findOne(idRule, relationID);
  }

  async remove(idRule: string, relationID: string): Promise<void> {
    const rulesWithdrawal = await this.rulesWithdrawalRepository.findOne({
      where: { idRule, relationID },
    });

    if (!rulesWithdrawal) {
      throw new NotFoundException(
        `RulesWithdrawal con idRule ${idRule} y relationID ${relationID} no encontrado`,
      );
    }

    await this.rulesWithdrawalRepository.remove(rulesWithdrawal);
  }

  private mapToResponseDto(rulesWithdrawal: RulesWithdrawal): RulesWithdrawalResponseDto {
    return {
      idRule: rulesWithdrawal.idRule,
      relationID: rulesWithdrawal.relationID,
      value: rulesWithdrawal.value,
      rules: rulesWithdrawal.rules,
      relation: rulesWithdrawal.relation,
    };
  }
}