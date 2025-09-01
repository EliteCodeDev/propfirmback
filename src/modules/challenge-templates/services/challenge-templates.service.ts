import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import {
  ChallengeCategory,
  ChallengePlan,
  ChallengeBalance,
  RelationBalance,
  ChallengeRelation,
  ChallengeStage,
  RelationStage,
  StageRule,
  StageParameter,
} from '../entities';
// DTOs
import {
  CreateChallengeCategoryDto,
  CreateChallengePlanDto,
  CreateChallengeBalanceDto,
  CreateChallengeRelationDto,
  CreateChallengeStageDto,
  CreateStageRuleDto,
  CreateStageParameterDto,
  CreateRelationStageDto,
  CreateRelationBalanceDto,
  UpdateChallengeCategoryDto,
  UpdateChallengePlanDto,
  UpdateChallengeBalanceDto,
  UpdateChallengeRelationDto,
  UpdateChallengeStageDto,
  UpdateStageRuleDto,
  UpdateStageParameterDto,
  UpdateRelationStageDto,
  UpdateRelationBalanceDto,
  CreateRelationBalancesDto,
  CreateRelationStagesDto,
} from '../dto';

@Injectable()
export class ChallengeTemplatesService {
  constructor(
    @InjectRepository(ChallengeCategory)
    private challengeCategoryRepository: Repository<ChallengeCategory>,
    @InjectRepository(ChallengePlan)
    private challengePlanRepository: Repository<ChallengePlan>,
    @InjectRepository(ChallengeBalance)
    private challengeBalanceRepository: Repository<ChallengeBalance>,
    @InjectRepository(RelationBalance)
    private relationBalanceRepository: Repository<RelationBalance>,
    @InjectRepository(ChallengeRelation)
    private challengeRelationRepository: Repository<ChallengeRelation>,
    @InjectRepository(ChallengeStage)
    private challengeStageRepository: Repository<ChallengeStage>,
    @InjectRepository(RelationStage)
    private relationStageRepository: Repository<RelationStage>,
    @InjectRepository(StageRule)
    private stageRuleRepository: Repository<StageRule>,
    @InjectRepository(StageParameter)
    private stageParameterRepository: Repository<StageParameter>,
  ) {}

  // Challenge Categories
  async createCategory(
    dto: CreateChallengeCategoryDto,
  ): Promise<ChallengeCategory> {
    const category = this.challengeCategoryRepository.create(dto);
    return this.challengeCategoryRepository.save(category);
  }

  async findAllCategories(): Promise<ChallengeCategory[]> {
    return this.challengeCategoryRepository.find({
      relations: ['relations'],
    });
  }

  async findOneCategory(id: string): Promise<ChallengeCategory> {
    const category = await this.challengeCategoryRepository.findOne({
      where: { categoryID: id },
      relations: ['relations'],
    });

    if (!category) {
      throw new NotFoundException('Challenge category not found');
    }

    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateChallengeCategoryDto,
  ): Promise<ChallengeCategory> {
    const category = await this.findOneCategory(id);
    Object.assign(category, dto);
    return this.challengeCategoryRepository.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findOneCategory(id);
    await this.challengeCategoryRepository.remove(category);
  }

  // Challenge Plans
  async createPlan(dto: CreateChallengePlanDto): Promise<ChallengePlan> {
    const plan = this.challengePlanRepository.create(dto);
    return this.challengePlanRepository.save(plan);
  }

  async findAllPlans(): Promise<ChallengePlan[]> {
    return this.challengePlanRepository.find({
      relations: ['relations'],
    });
  }

  async findOnePlan(id: string): Promise<ChallengePlan> {
    const plan = await this.challengePlanRepository.findOne({
      where: { planID: id },
      relations: ['relations'],
    });

    if (!plan) {
      throw new NotFoundException('Challenge plan not found');
    }

    return plan;
  }
  async findOnePlanByWooID(wooID: number): Promise<ChallengePlan> {
    const plan = await this.challengePlanRepository.findOne({
      where: { wooID },
      relations: ['relations'],
    });

    if (!plan) {
      throw new NotFoundException('Challenge plan not found');
    }

    return plan;
  }
  async updatePlan(
    id: string,
    dto: UpdateChallengePlanDto,
  ): Promise<ChallengePlan> {
    const plan = await this.findOnePlan(id);
    Object.assign(plan, dto);
    return this.challengePlanRepository.save(plan);
  }

  async removePlan(id: string): Promise<void> {
    const plan = await this.findOnePlan(id);
    await this.challengePlanRepository.remove(plan);
  }

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

  // Challenge Relations
  async createRelation(
    dto: CreateChallengeRelationDto,
  ): Promise<ChallengeRelation> {
    const relation = this.challengeRelationRepository.create(dto);
    return this.challengeRelationRepository.save(relation);
  }

  async findAllRelations(): Promise<ChallengeRelation[]> {
    return this.challengeRelationRepository.find({
      relations: ['category', 'plan', 'balances', 'stages'],
    });
  }

  async findOneRelation(id: string): Promise<ChallengeRelation> {
    const relation = await this.challengeRelationRepository.findOne({
      where: { relationID: id },
      relations: ['category', 'plan', 'balances', 'stages'],
    });

    if (!relation) {
      throw new NotFoundException('Challenge relation not found');
    }

    return relation;
  }

  async updateRelation(
    id: string,
    dto: UpdateChallengeRelationDto,
  ): Promise<ChallengeRelation> {
    const relation = await this.findOneRelation(id);
    Object.assign(relation, dto);
    return this.challengeRelationRepository.save(relation);
  }

  async removeRelation(id: string): Promise<void> {
    const relation = await this.findOneRelation(id);
    await this.challengeRelationRepository.remove(relation);
  }

  // Additional methods for stages and rules
  // Challenge Stages
  async createStage(dto: CreateChallengeStageDto): Promise<ChallengeStage> {
    const stage = this.challengeStageRepository.create(dto);
    return this.challengeStageRepository.save(stage);
  }

  async findAllStages(): Promise<ChallengeStage[]> {
    return this.challengeStageRepository.find({
      relations: ['relationStages'],
    });
  }

  async findOneStage(id: string): Promise<ChallengeStage> {
    const stage = await this.challengeStageRepository.findOne({
      where: { stageID: id },
      relations: ['relationStages'],
    });

    if (!stage) {
      throw new NotFoundException('Challenge stage not found');
    }

    return stage;
  }

  async updateStage(
    id: string,
    dto: UpdateChallengeStageDto,
  ): Promise<ChallengeStage> {
    const stage = await this.findOneStage(id);
    Object.assign(stage, dto);
    return this.challengeStageRepository.save(stage);
  }

  async removeStage(id: string): Promise<void> {
    const stage = await this.findOneStage(id);
    await this.challengeStageRepository.remove(stage);
  }

  // Stage Rules
  async createRule(dto: CreateStageRuleDto): Promise<StageRule> {
    const rule = this.stageRuleRepository.create(dto);
    return this.stageRuleRepository.save(rule);
  }

  async findAllRules(): Promise<StageRule[]> {
    return this.stageRuleRepository.find({
      relations: ['parameters'],
    });
  }

  async findOneRule(id: string): Promise<StageRule> {
    const rule = await this.stageRuleRepository.findOne({
      where: { ruleID: id },
      relations: ['parameters'],
    });

    if (!rule) {
      throw new NotFoundException('Stage rule not found');
    }

    return rule;
  }

  async updateRule(id: string, dto: UpdateStageRuleDto): Promise<StageRule> {
    const rule = await this.findOneRule(id);
    Object.assign(rule, dto);
    return this.stageRuleRepository.save(rule);
  }

  async removeRule(id: string): Promise<void> {
    const rule = await this.findOneRule(id);
    await this.stageRuleRepository.remove(rule);
  }

  // Stage Parameters
  async createParameter(dto: CreateStageParameterDto): Promise<StageParameter> {
    const parameter = this.stageParameterRepository.create(dto);
    return this.stageParameterRepository.save(parameter);
  }

  async findAllParameters(): Promise<StageParameter[]> {
    return this.stageParameterRepository.find({
      relations: ['rule', 'relationStage'],
    });
  }

  async findOneParameter(
    ruleID: string,
    relationStageID: string,
  ): Promise<StageParameter> {
    const parameter = await this.stageParameterRepository.findOne({
      where: { ruleID, relationStageID },
      relations: ['rule', 'relationStage'],
    });

    if (!parameter) {
      throw new NotFoundException('Stage parameter not found');
    }

    return parameter;
  }

  async updateParameter(
    ruleID: string,
    relationStageID: string,
    dto: UpdateStageParameterDto,
  ): Promise<StageParameter> {
    const parameter = await this.findOneParameter(ruleID, relationStageID);
    Object.assign(parameter, dto);
    return this.stageParameterRepository.save(parameter);
  }

  async removeParameter(
    ruleID: string,
    relationStageID: string,
  ): Promise<void> {
    const parameter = await this.findOneParameter(ruleID, relationStageID);
    await this.stageParameterRepository.remove(parameter);
  }

  // Relation Stages
  async createRelationStage(
    dto: CreateRelationStageDto,
  ): Promise<RelationStage> {
    const relationStage = this.relationStageRepository.create(dto);
    return this.relationStageRepository.save(relationStage);
  }

  async findAllRelationStages(): Promise<RelationStage[]> {
    return this.relationStageRepository.find({
      relations: ['stage', 'relation', 'parameters'],
    });
  }

  async findOneRelationStage(id: string): Promise<RelationStage> {
    const relationStage = await this.relationStageRepository.findOne({
      where: { relationStageID: id },
      relations: ['stage', 'relation', 'parameters'],
    });

    if (!relationStage) {
      throw new NotFoundException('Relation stage not found');
    }

    return relationStage;
  }

  async updateRelationStage(
    id: string,
    dto: UpdateRelationStageDto,
  ): Promise<RelationStage> {
    const relationStage = await this.findOneRelationStage(id);
    Object.assign(relationStage, dto);
    return this.relationStageRepository.save(relationStage);
  }

  async removeRelationStage(id: string): Promise<void> {
    const relationStage = await this.findOneRelationStage(id);
    await this.relationStageRepository.remove(relationStage);
  }

  async createRelationStages(
    dto: CreateRelationStagesDto,
  ): Promise<RelationStage[]> {
    const relationStages: RelationStage[] = [];
    
    for (const stageDto of dto.stages) {
      // Crear RelationStage
      const relationStage = this.relationStageRepository.create({
        stageID: stageDto.stageID,
        relationID: dto.challengeRelationID,
      });
      const savedRelationStage = await this.relationStageRepository.save(relationStage);
      
      // Crear StageParameters para cada regla
      for (const ruleDto of stageDto.rules) {
        const parameter = this.stageParameterRepository.create({
          ruleID: ruleDto.ruleID,
          relationStageID: savedRelationStage.relationStageID,
          ruleValue: ruleDto.ruleValue,
          isActive: true,
        });
        await this.stageParameterRepository.save(parameter);
      }
      
      relationStages.push(savedRelationStage);
    }
    
    return relationStages;
  }

  async findRelationStagesByRelation(relationID: string): Promise<RelationStage[]> {
    return this.relationStageRepository.find({
      where: { relationID },
      relations: ['stage', 'relation', 'parameters'],
    });
  }

  async findParametersByRelationStage(relationStageID: string): Promise<StageParameter[]> {
    return this.stageParameterRepository.find({
      where: { relationStageID },
      relations: ['rule', 'relationStage'],
    });
  }

  /**
   * Obtiene toda la cadena de relaciones completa a partir de un relationID
   * Incluye RelationStages, stages, RelationParameters y StageRules
   */
  async findCompleteRelationChain(relationID: string): Promise<ChallengeRelation> {
    // Buscar la relación principal con todas sus relaciones
    const relation = await this.challengeRelationRepository.findOne({
      where: { relationID },
      relations: ['category', 'plan', 'balances', 'stages'],
    });

    if (!relation) {
      throw new NotFoundException('Challenge relation not found');
    }

    // Ordenar los stages por numPhase y cargar sus parámetros
    if (relation.stages && relation.stages.length > 0) {
      // Ordenar stages por numPhase
      relation.stages.sort((a, b) => a.numPhase - b.numPhase);

      // Para cada RelationStage, cargar sus parámetros con las reglas
      for (const relationStage of relation.stages) {
        relationStage.parameters = await this.stageParameterRepository.find({
          where: { relationStageID: relationStage.relationStageID },
          relations: ['rule'],
        });

        // También cargar la información del stage asociado
        if (relationStage.stageID) {
          relationStage.stage = await this.challengeStageRepository.findOne({
            where: { stageID: relationStage.stageID },
          });
        }
      }
    }

    return relation;
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
