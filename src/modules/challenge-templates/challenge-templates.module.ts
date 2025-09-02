import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeTemplatesController } from './controllers/challenge-templates.controller';

import {
  ChallengeRelationsService,
  ChallengeTemplatesService,
  ChallengeBalancesService,
  ChallengeStagesService,
} from './services';
import { AddonsService } from './services/addons.service';
import { RelationAddonService } from './services/relation-addon.service';
import { AddonsController } from './controllers/addons.controller';
import { RelationAddonController } from './controllers/relation-addon.controller';
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
  controllers: [
    ChallengeTemplatesController,
    AddonsController,
    RelationAddonController,
  ],
  providers: [
    ChallengeTemplatesService,
    ChallengeRelationsService,
    ChallengeBalancesService,
    ChallengeStagesService,
    AddonsService,
    RelationAddonService,
  ],
  exports: [
    ChallengeTemplatesService,
    ChallengeRelationsService,
    ChallengeBalancesService,
    ChallengeStagesService,
    AddonsService,
    RelationAddonService,
    TypeOrmModule,
  ],
})
export class ChallengeTemplatesModule {}
