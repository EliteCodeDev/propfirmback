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
import { RulesWithdrawalService } from './services/rules-withdrawal.service';
import { AddonRulesService } from './services/addon-rules.service';
import { AddonsController } from './controllers/addons.controller';
import { RelationAddonController } from './controllers/relation-addon.controller';
import { RulesWithdrawalController } from './controllers/rules-withdrawal.controller';
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
    RulesWithdrawalController,
  ],
  providers: [
    ChallengeTemplatesService,
    ChallengeRelationsService,
    ChallengeBalancesService,
    ChallengeStagesService,
    AddonsService,
    RelationAddonService,
    RulesWithdrawalService,
    AddonRulesService,
  ],
  exports: [
    ChallengeTemplatesService,
    ChallengeRelationsService,
    ChallengeBalancesService,
    ChallengeStagesService,
    AddonsService,
    RelationAddonService,
    RulesWithdrawalService,
    AddonRulesService,
    TypeOrmModule,
  ],
})
export class ChallengeTemplatesModule {}
