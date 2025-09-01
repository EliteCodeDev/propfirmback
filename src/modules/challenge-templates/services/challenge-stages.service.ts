import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import {
  ChallengeStage,
  StageRule,
  StageParameter,
} from '../entities';
// DTOs
import {
  CreateChallengeStageDto,
  CreateStageRuleDto,
  CreateStageParameterDto,
  UpdateChallengeStageDto,
  UpdateStageRuleDto,
  UpdateStageParameterDto,
} from '../dto';

@Injectable()
export class ChallengeStagesService {
  constructor(
    @InjectRepository(ChallengeStage)
    private challengeStageRepository: Repository<ChallengeStage>,
    @InjectRepository(StageRule)
    private stageRuleRepository: Repository<StageRule>,
    @InjectRepository(StageParameter)
    private stageParameterRepository: Repository<StageParameter>,
  ) {}

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
}