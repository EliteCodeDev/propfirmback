import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import {
  ChallengeRelation,
  RelationStage,
  StageParameter,
  ChallengeStage,
} from '../entities';
// DTOs
import {
  CreateChallengeRelationDto,
  CreateRelationStageDto,
  CreateRelationStagesDto,
  UpdateChallengeRelationDto,
  UpdateRelationStageDto,
} from '../dto';

@Injectable()
export class ChallengeRelationsService {
  constructor(
    @InjectRepository(ChallengeRelation)
    private challengeRelationRepository: Repository<ChallengeRelation>,
    @InjectRepository(RelationStage)
    private relationStageRepository: Repository<RelationStage>,
    @InjectRepository(StageParameter)
    private stageParameterRepository: Repository<StageParameter>,
    @InjectRepository(ChallengeStage)
    private challengeStageRepository: Repository<ChallengeStage>,
  ) {}

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

  async findAllRelationsComplete(): Promise<ChallengeRelation[]> {
    const data = await this.challengeRelationRepository.find();
    let relations = [];
    for (const item of data) {
      const relation = await this.findCompleteRelationChain(item.relationID);
      relations.push(relation);
    }
    return relations;
  }
  // async findAllRelationsCompleteOg(): Promise<ChallengeRelation[]> {
  //   const data = await this.challengeRelationRepository.find();
  //   let relations = [];
  //   for (const item of data) {
  //     const relation = await this.findCompleteRelationChainOg(item.relationID);
  //     relations.push(relation);
  //   }
  //   return relations;
  // }
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
      const savedRelationStage =
        await this.relationStageRepository.save(relationStage);

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

  async findRelationStagesByRelation(
    relationID: string,
  ): Promise<RelationStage[]> {
    return this.relationStageRepository.find({
      where: { relationID },
      relations: ['stage', 'relation', 'parameters'],
    });
  }

  async findParametersByRelationStage(
    relationStageID: string,
  ): Promise<StageParameter[]> {
    return this.stageParameterRepository.find({
      where: { relationStageID },
      relations: ['rule', 'relationStage'],
    });
  }

  /**
   * Obtiene toda la cadena de relaciones completa a partir de un relationID
   * Incluye RelationStages, stages, RelationParameters y StageRules
   */
  // async findCompleteRelationChainOg(
  //   relationID: string,
  // ): Promise<ChallengeRelation> {
  //   // Buscar la relación principal con todas sus relaciones
  //   const relation = await this.challengeRelationRepository.findOne({
  //     where: { relationID },
  //     relations: [
  //       'category',
  //       'plan',
  //       'balances',
  //       'stages',
  //       'withdrawalRules',
  //       'addons',
  //       'withdrawalRules.rule',
  //     ],
  //     // 'withdrawalRules'
  //   });

  //   if (!relation) {
  //     throw new NotFoundException('Challenge relation not found');
  //   }

  //   // Ordenar los stages por numPhase y cargar sus parámetros
  //   if (relation.stages && relation.stages.length > 0) {
  //     // Ordenar stages por numPhase
  //     relation.stages.sort((a, b) => a.numPhase - b.numPhase);

  //     // Para cada RelationStage, cargar sus parámetros con las reglas
  //     for (const relationStage of relation.stages) {
  //       relationStage.parameters = await this.stageParameterRepository.find({
  //         where: { relationStageID: relationStage.relationStageID },
  //         relations: ['rule'],
  //       });

  //       // También cargar la información del stage asociado
  //       if (relationStage.stageID) {
  //         relationStage.stage = await this.challengeStageRepository.findOne({
  //           where: { stageID: relationStage.stageID },
  //         });
  //       }
  //     }
  //   }

  //   return relation;
  // }
  async findCompleteRelationChain(
    relationID: string,
  ): Promise<ChallengeRelation> {
    const relation = await this.challengeRelationRepository.findOne({
      where: { relationID },
      relations: {
        category: true,
        plan: true,
        balances: true,
        addons: {
          addon: true,
        },
        stages: {
          parameters: { rule: true }, // ← carga parámetros + su rule
          stage: true, // ← carga la entidad stage asociada
        },
        withdrawalRules: { rule: true }, // ← carga reglas de retiro + su rule
      },
      order: {
        stages: { numPhase: 'ASC' }, // ← ordena los stages en DB
      },
    });

    if (!relation) {
      throw new NotFoundException('Challenge relation not found');
    }

    return relation;
  }
}
