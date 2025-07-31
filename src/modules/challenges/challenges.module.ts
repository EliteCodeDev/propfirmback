import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDetails } from './entities/challenge-details.entity';
import { ChallengeBalance } from './entities/challenge-balance.entity';
import { ChallengeCategory } from './entities/challenge-category.entity';
import { ChallengePlan } from './entities/challenge-plan.entity';
import { ChallengeRelation } from './entities/challenge-relation.entity';
import { ChallengeStage } from './entities/challenge-stage.entity';
import { RelationStage } from './entities/relation-stage.entity';
import { StageRule } from './entities/stage-rule.entity';
import { StageParameter } from './entities/stage-parameter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Challenge,
    ChallengeDetails,
    ChallengeBalance,
    ChallengeCategory,
    ChallengePlan,
    ChallengeRelation,
    ChallengeStage,
    RelationStage,
    StageRule,
    StageParameter,
  ])],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}