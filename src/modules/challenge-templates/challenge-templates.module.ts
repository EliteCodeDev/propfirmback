import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeTemplatesController } from './challenge-templates.controller';
import { ChallengeTemplatesService } from './challenge-templates.service';

// Entities
import { ChallengeCategory } from './entities/challenge-category.entity';
import { ChallengePlan } from './entities/challenge-plan.entity';
import { ChallengeBalance } from './entities/challenge-balance.entity';
import { ChallengeRelation } from './entities/challenge-relation.entity';
import { ChallengeStage } from './entities/stage/challenge-stage.entity';
import { RelationStage } from './entities/stage/relation-stage.entity';
import { StageRule } from './entities/stage/stage-rule.entity';
import { StageParameter } from './entities/stage/stage-parameter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChallengeCategory,
      ChallengePlan,
      ChallengeBalance,
      ChallengeRelation,
      ChallengeStage,
      RelationStage,
      StageRule,
      StageParameter,
    ]),
  ],
  controllers: [ChallengeTemplatesController],
  providers: [ChallengeTemplatesService],
  exports: [ChallengeTemplatesService],
})
export class ChallengeTemplatesModule {}
