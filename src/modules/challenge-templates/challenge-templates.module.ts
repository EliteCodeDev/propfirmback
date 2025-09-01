import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeTemplatesController } from './challenge-templates.controller';
import { ChallengeTemplatesService } from './challenge-templates.service';

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
  providers: [ChallengeTemplatesService],
  exports: [ChallengeTemplatesService, TypeOrmModule],
})
export class ChallengeTemplatesModule {}
