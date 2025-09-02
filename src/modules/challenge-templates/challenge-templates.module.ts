import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeTemplatesController } from './controllers/challenge-templates.controller';

import {
  ChallengeRelationsService,
  ChallengeTemplatesService,
  ChallengeBalancesService,
  ChallengeStagesService,
} from './services';
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
  Addon,
  ChallengeAddon,
  RelationAddon,
} from './entities';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChallengeCategory,
      ChallengePlan,
      ChallengeBalance,
      RelationBalance,
      ChallengeRelation,
      ChallengeStage,
      RelationStage,
      StageRule,
      StageParameter,
      Addon,
      ChallengeAddon,
      RelationAddon,
    ]),
  ],
  controllers: [ChallengeTemplatesController],
  providers: [
    ChallengeTemplatesService,
    ChallengeRelationsService,
    ChallengeBalancesService,
    ChallengeStagesService,
  ],
  exports: [
    ChallengeTemplatesService,
    ChallengeRelationsService,
    ChallengeBalancesService,
    ChallengeStagesService,
    TypeOrmModule,
  ],
})
export class ChallengeTemplatesModule {}
