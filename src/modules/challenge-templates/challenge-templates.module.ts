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
import { RulesService } from './services/rules.service';
import { AddonsController } from './controllers/addons.controller';
import { RelationAddonController } from './controllers/relation-addon.controller';
import { RulesWithdrawalController } from './controllers/rules-withdrawal.controller';
import { RulesController } from './controllers/rules.controller';
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
  WithdrawalRule,
  RelationRules,
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
      WithdrawalRule,
      RelationRules,
    ]),
  ],
  controllers: [
    ChallengeTemplatesController,
    AddonsController,
    RelationAddonController,
    RulesWithdrawalController,
    RulesController,
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
    RulesService,
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
    RulesService,
    TypeOrmModule,
  ],
})
export class ChallengeTemplatesModule {}
