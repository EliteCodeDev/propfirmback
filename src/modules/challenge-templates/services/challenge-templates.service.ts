import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import {
  ChallengeCategory,
  ChallengePlan,
} from '../entities';
// DTOs
import {
  CreateChallengeCategoryDto,
  CreateChallengePlanDto,
  UpdateChallengeCategoryDto,
  UpdateChallengePlanDto,
} from '../dto';
// Services
import { ChallengeRelationsService } from './challenge-relations.service';
import { ChallengeBalancesService } from './challenge-balances.service';
import { ChallengeStagesService } from './challenge-stages.service';

@Injectable()
export class ChallengeTemplatesService {
  constructor(
    @InjectRepository(ChallengeCategory)
    private challengeCategoryRepository: Repository<ChallengeCategory>,
    @InjectRepository(ChallengePlan)
    private challengePlanRepository: Repository<ChallengePlan>,
    private challengeRelationsService: ChallengeRelationsService,
    private challengeBalancesService: ChallengeBalancesService,
    private challengeStagesService: ChallengeStagesService,
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

  // Delegated methods for balances
  async createBalance(dto: any) {
    return this.challengeBalancesService.createBalance(dto);
  }

  async findAllBalances() {
    return this.challengeBalancesService.findAllBalances();
  }

  async findOneBalance(id: string) {
    return this.challengeBalancesService.findOneBalance(id);
  }

  async updateBalance(id: string, dto: any) {
    return this.challengeBalancesService.updateBalance(id, dto);
  }

  async removeBalance(id: string) {
    return this.challengeBalancesService.removeBalance(id);
  }

  // Delegated methods for relations
  async createRelation(dto: any) {
    return this.challengeRelationsService.createRelation(dto);
  }

  async findAllRelations() {
    return this.challengeRelationsService.findAllRelations();
  }

  async findAllRelationsComplete() {
    return this.challengeRelationsService.findAllRelationsComplete();
  }

  async findOneRelation(id: string) {
    return this.challengeRelationsService.findOneRelation(id);
  }

  async updateRelation(id: string, dto: any) {
    return this.challengeRelationsService.updateRelation(id, dto);
  }

  async removeRelation(id: string) {
    return this.challengeRelationsService.removeRelation(id);
  }

  async findCompleteRelationChain(relationID: string) {
    return this.challengeRelationsService.findCompleteRelationChain(relationID);
  }

  // Delegated methods for stages
  async createStage(dto: any) {
    return this.challengeStagesService.createStage(dto);
  }

  async findAllStages() {
    return this.challengeStagesService.findAllStages();
  }

  async findOneStage(id: string) {
    return this.challengeStagesService.findOneStage(id);
  }

  async updateStage(id: string, dto: any) {
    return this.challengeStagesService.updateStage(id, dto);
  }

  async removeStage(id: string) {
    return this.challengeStagesService.removeStage(id);
  }

  // Delegated methods for stage rules
  async createRule(dto: any) {
    return this.challengeStagesService.createRule(dto);
  }

  async findAllRules() {
    return this.challengeStagesService.findAllRules();
  }

  async findOneRule(id: string) {
    return this.challengeStagesService.findOneRule(id);
  }

  async updateRule(id: string, dto: any) {
    return this.challengeStagesService.updateRule(id, dto);
  }

  async removeRule(id: string) {
    return this.challengeStagesService.removeRule(id);
  }

  // Delegated methods for stage parameters
  async createParameter(dto: any) {
    return this.challengeStagesService.createParameter(dto);
  }

  async findAllParameters() {
    return this.challengeStagesService.findAllParameters();
  }

  async findOneParameter(ruleID: string, relationStageID: string) {
    return this.challengeStagesService.findOneParameter(ruleID, relationStageID);
  }

  async updateParameter(ruleID: string, relationStageID: string, dto: any) {
    return this.challengeStagesService.updateParameter(ruleID, relationStageID, dto);
  }

  async removeParameter(ruleID: string, relationStageID: string) {
    return this.challengeStagesService.removeParameter(ruleID, relationStageID);
  }

  // Delegated methods for relation stages
  async createRelationStage(dto: any) {
    return this.challengeRelationsService.createRelationStage(dto);
  }

  async findAllRelationStages() {
    return this.challengeRelationsService.findAllRelationStages();
  }

  async findOneRelationStage(id: string) {
    return this.challengeRelationsService.findOneRelationStage(id);
  }

  async updateRelationStage(id: string, dto: any) {
    return this.challengeRelationsService.updateRelationStage(id, dto);
  }

  async removeRelationStage(id: string) {
    return this.challengeRelationsService.removeRelationStage(id);
  }

  async createRelationStages(dto: any) {
    return this.challengeRelationsService.createRelationStages(dto);
  }

  async findRelationStagesByRelation(relationID: string) {
    return this.challengeRelationsService.findRelationStagesByRelation(relationID);
  }

  async findParametersByRelationStage(relationStageID: string) {
    return this.challengeRelationsService.findParametersByRelationStage(relationStageID);
  }

  // Delegated methods for relation balances
  async createRelationBalance(dto: any) {
    return this.challengeBalancesService.createRelationBalance(dto);
  }

  async createRelationBalances(dtos: any) {
    return this.challengeBalancesService.createRelationBalances(dtos);
  }

  async findAllRelationBalances() {
    return this.challengeBalancesService.findAllRelationBalances();
  }

  async findOneRelationBalance(id: string) {
    return this.challengeBalancesService.findOneRelationBalance(id);
  }

  async updateRelationBalance(id: string, dto: any) {
    return this.challengeBalancesService.updateRelationBalance(id, dto);
  }

  async removeRelationBalance(id: string) {
    return this.challengeBalancesService.removeRelationBalance(id);
  }

  async removeAllRelationBalancesByRelation(relationId: string) {
    return this.challengeBalancesService.removeAllRelationBalancesByRelation(relationId);
  }
}
