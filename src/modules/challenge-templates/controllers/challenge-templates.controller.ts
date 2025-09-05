import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChallengeTemplatesService } from '../services/challenge-templates.service';
import { RulesService } from '../services/rules.service';
import { RulesWithdrawalService } from '../services/rules-withdrawal.service';

// DTOs

import {
  CreateChallengeCategoryDto,
  CreateChallengePlanDto,
  CreateChallengeBalanceDto,
  CreateChallengeRelationDto,
  CreateChallengeStageDto,
  CreateStageRuleDto,
  CreateStageParameterDto,
  CreateRelationStageDto,
  CreateRelationBalanceDto,
  CreateRelationStagesDto,
  UpdateChallengeCategoryDto,
  UpdateChallengePlanDto,
  UpdateChallengeBalanceDto,
  UpdateChallengeRelationDto,
  UpdateChallengeStageDto,
  UpdateStageRuleDto,
  UpdateStageParameterDto,
  UpdateRelationStageDto,
  UpdateRelationBalanceDto,
  CreateRelationBalancesDto,
} from '../dto';
import { RuleDto } from '../dto/create/create-rule.dto';
import { CreateRulesWithdrawalDto } from '../dto/create/create-rules-withdrawal.dto';
import { UpdateRulesWithdrawalDto } from '../dto/update/update-rules-withdrawal.dto';

// Guards & Decorators
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Challenge Templates')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
@Public()
@Controller('challenge-templates')
export class ChallengeTemplatesController {
  constructor(
    private readonly challengeTemplatesService: ChallengeTemplatesService,
    private readonly rulesService: RulesService,
    private readonly rulesWithdrawalService: RulesWithdrawalService,
  ) {}

  // Challenge Categories
  @Post('categories')
  @ApiOperation({ summary: 'Create a new challenge category' })
  createCategory(
    @Body() createChallengeCategoryDto: CreateChallengeCategoryDto,
  ) {
    return this.challengeTemplatesService.createCategory(
      createChallengeCategoryDto,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all challenge categories' })
  findAllCategories() {
    return this.challengeTemplatesService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get challenge category by ID' })
  findOneCategory(@Param('id') id: string) {
    return this.challengeTemplatesService.findOneCategory(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update challenge category' })
  updateCategory(
    @Param('id') id: string,
    @Body() updateChallengeCategoryDto: UpdateChallengeCategoryDto,
  ) {
    return this.challengeTemplatesService.updateCategory(
      id,
      updateChallengeCategoryDto,
    );
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete challenge category' })
  removeCategory(@Param('id') id: string) {
    return this.challengeTemplatesService.removeCategory(id);
  }

  // Challenge Plans
  @Post('plans')
  @ApiOperation({ summary: 'Create a new challenge plan' })
  createPlan(@Body() createChallengePlanDto: CreateChallengePlanDto) {
    return this.challengeTemplatesService.createPlan(createChallengePlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all challenge plans' })
  findAllPlans() {
    return this.challengeTemplatesService.findAllPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get challenge plan by ID' })
  findOnePlan(@Param('id') id: string) {
    return this.challengeTemplatesService.findOnePlan(id);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update challenge plan' })
  updatePlan(
    @Param('id') id: string,
    @Body() updateChallengePlanDto: UpdateChallengePlanDto,
  ) {
    return this.challengeTemplatesService.updatePlan(
      id,
      updateChallengePlanDto,
    );
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete challenge plan' })
  removePlan(@Param('id') id: string) {
    return this.challengeTemplatesService.removePlan(id);
  }

  // Challenge Balances
  @Post('balances')
  @ApiOperation({ summary: 'Create a new challenge balance' })
  createBalance(@Body() createChallengeBalanceDto: CreateChallengeBalanceDto) {
    return this.challengeTemplatesService.createBalance(
      createChallengeBalanceDto,
    );
  }

  @Get('balances')
  @ApiOperation({ summary: 'Get all challenge balances' })
  findAllBalances() {
    return this.challengeTemplatesService.findAllBalances();
  }

  @Get('balances/:id')
  @ApiOperation({ summary: 'Get challenge balance by ID' })
  findOneBalance(@Param('id') id: string) {
    return this.challengeTemplatesService.findOneBalance(id);
  }

  @Patch('balances/:id')
  @ApiOperation({ summary: 'Update challenge balance' })
  updateBalance(
    @Param('id') id: string,
    @Body() updateChallengeBalanceDto: UpdateChallengeBalanceDto,
  ) {
    return this.challengeTemplatesService.updateBalance(
      id,
      updateChallengeBalanceDto,
    );
  }

  @Delete('balances/:id')
  @ApiOperation({ summary: 'Delete challenge balance' })
  removeBalance(@Param('id') id: string) {
    return this.challengeTemplatesService.removeBalance(id);
  }

  // Challenge Relations
  @Post('relations')
  @ApiOperation({ summary: 'Create a new challenge relation' })
  createRelation(
    @Body() createChallengeRelationDto: CreateChallengeRelationDto,
  ) {
    return this.challengeTemplatesService.createRelation(
      createChallengeRelationDto,
    );
  }

  @Get('relations')
  @ApiOperation({ summary: 'Get all challenge relations' })
  findAllRelations() {
    return this.challengeTemplatesService.findAllRelations();
  }
  @Get('relations-complete')
  @ApiOperation({ summary: 'Get all challenge relations with complete chain' })
  findAllRelationsComplete() {
    return this.challengeTemplatesService.findAllRelationsComplete();
  }
  // @Get('relations-complete-og')
  // @ApiOperation({
  //   summary: 'Get all challenge relations with complete chain (OG)',
  // })
  // findAllRelationsCompleteOg() {
  //   return this.challengeTemplatesService.findAllRelationsCompleteOg();
  // }

  @Get('relations/:id')
  @ApiOperation({ summary: 'Get challenge relation by ID' })
  findOneRelation(@Param('id') id: string) {
    return this.challengeTemplatesService.findOneRelation(id);
  }

  @Patch('relations/:id')
  @ApiOperation({ summary: 'Update challenge relation' })
  updateRelation(
    @Param('id') id: string,
    @Body() updateChallengeRelationDto: UpdateChallengeRelationDto,
  ) {
    return this.challengeTemplatesService.updateRelation(
      id,
      updateChallengeRelationDto,
    );
  }

  @Delete('relations/:id')
  @ApiOperation({ summary: 'Delete challenge relation' })
  removeRelation(@Param('id') id: string) {
    return this.challengeTemplatesService.removeRelation(id);
  }

  // Additional endpoints
  @Post('stages')
  @ApiOperation({ summary: 'Create a new challenge stage' })
  createStage(@Body() createChallengeStageDto: CreateChallengeStageDto) {
    return this.challengeTemplatesService.createStage(createChallengeStageDto);
  }

  @Get('stages')
  @ApiOperation({ summary: 'Get all challenge stages' })
  findAllStages() {
    return this.challengeTemplatesService.findAllStages();
  }

  @Get('stages/:id')
  @ApiOperation({ summary: 'Get challenge stage by ID' })
  findOneStage(@Param('id') id: string) {
    return this.challengeTemplatesService.findOneStage(id);
  }

  @Patch('stages/:id')
  @ApiOperation({ summary: 'Update challenge stage' })
  updateStage(
    @Param('id') id: string,
    @Body() updateChallengeStageDto: UpdateChallengeStageDto,
  ) {
    return this.challengeTemplatesService.updateStage(
      id,
      updateChallengeStageDto,
    );
  }

  @Delete('stages/:id')
  @ApiOperation({ summary: 'Delete challenge stage' })
  removeStage(@Param('id') id: string) {
    return this.challengeTemplatesService.removeStage(id);
  }

  // Stage Rules
  @Post('rules')
  @ApiOperation({ summary: 'Create a new stage rule' })
  createRule(@Body() createStageRuleDto: CreateStageRuleDto) {
    return this.challengeTemplatesService.createRule(createStageRuleDto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all stage rules' })
  findAllRules() {
    return this.challengeTemplatesService.findAllRules();
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get stage rule by ID' })
  findOneRule(@Param('id') id: string) {
    return this.challengeTemplatesService.findOneRule(id);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update stage rule' })
  updateRule(
    @Param('id') id: string,
    @Body() updateStageRuleDto: UpdateStageRuleDto,
  ) {
    return this.challengeTemplatesService.updateRule(id, updateStageRuleDto);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete stage rule' })
  removeRule(@Param('id') id: string) {
    return this.challengeTemplatesService.removeRule(id);
  }

  // Stage Parameters
  @Post('parameters')
  @ApiOperation({ summary: 'Create a new stage parameter' })
  createParameter(@Body() createStageParameterDto: CreateStageParameterDto) {
    return this.challengeTemplatesService.createParameter(
      createStageParameterDto,
    );
  }

  @Get('parameters')
  @ApiOperation({ summary: 'Get all stage parameters' })
  findAllParameters() {
    return this.challengeTemplatesService.findAllParameters();
  }

  @Get('parameters/by-relation-stage/:relationStageId')
  @ApiOperation({ summary: 'Get stage parameters by relation stage ID' })
  findParametersByRelationStage(
    @Param('relationStageId') relationStageId: string,
  ) {
    return this.challengeTemplatesService.findParametersByRelationStage(
      relationStageId,
    );
  }

  @Get('parameters/:ruleId/:relationStageId')
  @ApiOperation({ summary: 'Get stage parameter by composite ID' })
  findOneParameter(
    @Param('ruleId') ruleId: string,
    @Param('relationStageId') relationStageId: string,
  ) {
    return this.challengeTemplatesService.findOneParameter(
      ruleId,
      relationStageId,
    );
  }

  @Patch('parameters/:ruleId/:relationStageId')
  @ApiOperation({ summary: 'Update stage parameter' })
  updateParameter(
    @Param('ruleId') ruleId: string,
    @Param('relationStageId') relationStageId: string,
    @Body() updateStageParameterDto: UpdateStageParameterDto,
  ) {
    return this.challengeTemplatesService.updateParameter(
      ruleId,
      relationStageId,
      updateStageParameterDto,
    );
  }

  @Delete('parameters/:ruleId/:relationStageId')
  @ApiOperation({ summary: 'Delete stage parameter' })
  removeParameter(
    @Param('ruleId') ruleId: string,
    @Param('relationStageId') relationStageId: string,
  ) {
    return this.challengeTemplatesService.removeParameter(
      ruleId,
      relationStageId,
    );
  }

  // Relation Stages
  @Post('relation-stages')
  @ApiOperation({ summary: 'Create a new relation stage' })
  createRelationStage(@Body() createRelationStageDto: CreateRelationStageDto) {
    return this.challengeTemplatesService.createRelationStage(
      createRelationStageDto,
    );
  }

  @Post('relation-stages/create')
  @ApiOperation({ summary: 'Create complete relation stages with rules' })
  createCompleteRelationStages(
    @Body() createRelationStagesDto: CreateRelationStagesDto,
  ) {
    return this.challengeTemplatesService.createRelationStages(
      createRelationStagesDto,
    );
  }

  @Get('relation-stages')
  @ApiOperation({ summary: 'Get all relation stages' })
  findAllRelationStages() {
    return this.challengeTemplatesService.findAllRelationStages();
  }

  @Get('relation-stages/by-relation/:relationId')
  @ApiOperation({ summary: 'Get relation stages by relation ID' })
  findRelationStagesByRelation(@Param('relationId') relationId: string) {
    return this.challengeTemplatesService.findRelationStagesByRelation(
      relationId,
    );
  }

  @Get('relation-stages/:id')
  @ApiOperation({ summary: 'Get relation stage by ID' })
  findOneRelationStage(@Param('id') id: string) {
    return this.challengeTemplatesService.findOneRelationStage(id);
  }

  @Patch('relation-stages/:id')
  @ApiOperation({ summary: 'Update relation stage' })
  updateRelationStage(
    @Param('id') id: string,
    @Body() updateRelationStageDto: UpdateRelationStageDto,
  ) {
    return this.challengeTemplatesService.updateRelationStage(
      id,
      updateRelationStageDto,
    );
  }

  @Delete('relation-stages/:id')
  @ApiOperation({ summary: 'Delete relation stage' })
  removeRelationStage(@Param('id') id: string) {
    return this.challengeTemplatesService.removeRelationStage(id);
  }

  // Relation Balances
  @Post('relation-balances')
  @ApiOperation({ summary: 'Create a new relation balance' })
  createRelationBalance(
    @Body() createRelationBalanceDto: CreateRelationBalanceDto,
  ) {
    return this.challengeTemplatesService.createRelationBalance(
      createRelationBalanceDto,
    );
  }

  //create relation to admin

  @Post('relation-balances/create')
  @ApiOperation({ summary: 'Create a new complete relation balance' })
  createCompleteRelationBalance(
    @Body() createRelationBalanceDto: CreateRelationBalancesDto,
  ) {
    return this.challengeTemplatesService.createRelationBalances(
      createRelationBalanceDto,
    );
  }

  @Get('relation-balances')
  @ApiOperation({ summary: 'Get all relation balances' })
  findAllRelationBalances() {
    return this.challengeTemplatesService.findAllRelationBalances();
  }

  @Get('relation-balances/:id')
  @ApiOperation({ summary: 'Get relation balance by ID' })
  findOneRelationBalance(@Param('id') id: string) {
    return this.challengeTemplatesService.findOneRelationBalance(id);
  }

  @Patch('relation-balances/:id')
  @ApiOperation({ summary: 'Update relation balance' })
  updateRelationBalance(
    @Param('id') id: string,
    @Body() updateRelationBalanceDto: UpdateRelationBalanceDto,
  ) {
    return this.challengeTemplatesService.updateRelationBalance(
      id,
      updateRelationBalanceDto,
    );
  }

  @Delete('relation-balances/:id')
  @ApiOperation({ summary: 'Delete relation balance' })
  removeRelationBalance(@Param('id') id: string) {
    return this.challengeTemplatesService.removeRelationBalance(id);
  }

  @Delete('relation-balances/by-relation/:relationId')
  @ApiOperation({
    summary: 'Delete all relation balances for a specific relation',
  })
  removeAllRelationBalancesByRelation(@Param('relationId') relationId: string) {
    return this.challengeTemplatesService.removeAllRelationBalancesByRelation(
      relationId,
    );
  }

  // Withdrawal Rules (Main Table)
  @Post('withdrawal-rules')
  @ApiOperation({ summary: 'Create a new withdrawal rule' })
  createWithdrawalRule(@Body() ruleDto: RuleDto) {
    return this.rulesService.create(ruleDto);
  }

  @Get('withdrawal-rules')
  @ApiOperation({ summary: 'Get all withdrawal rules' })
  findAllWithdrawalRules() {
    return this.rulesService.findAll();
  }

  @Get('withdrawal-rules/:id')
  @ApiOperation({ summary: 'Get withdrawal rule by ID' })
  findOneWithdrawalRule(@Param('id') id: string) {
    return this.rulesService.findById(id);
  }

  @Patch('withdrawal-rules/:id')
  @ApiOperation({ summary: 'Update withdrawal rule' })
  updateWithdrawalRule(@Param('id') id: string, @Body() ruleDto: RuleDto) {
    return this.rulesService.update(id, ruleDto);
  }

  @Delete('withdrawal-rules/:id')
  @ApiOperation({ summary: 'Delete withdrawal rule' })
  removeWithdrawalRule(@Param('id') id: string) {
    return this.rulesService.remove(id);
  }

  // Withdrawal Rules Relations (Intermediate Table)
  @Post('withdrawal-rules-relations')
  @ApiOperation({ summary: 'Create a new withdrawal rule relation' })
  createWithdrawalRuleRelation(@Body() createRulesWithdrawalDto: CreateRulesWithdrawalDto) {
    return this.rulesWithdrawalService.create(createRulesWithdrawalDto);
  }

  @Get('withdrawal-rules-relations')
  @ApiOperation({ summary: 'Get all withdrawal rule relations' })
  findAllWithdrawalRuleRelations() {
    return this.rulesWithdrawalService.findAll();
  }

  @Get('withdrawal-rules-relations/by-rule/:ruleId')
  @ApiOperation({ summary: 'Get withdrawal rule relations by rule ID' })
  findWithdrawalRuleRelationsByRule(@Param('ruleId') ruleId: string) {
    return this.rulesWithdrawalService.findByRuleId(ruleId);
  }

  @Get('withdrawal-rules-relations/by-relation/:relationId')
  @ApiOperation({ summary: 'Get withdrawal rule relations by relation ID' })
  findWithdrawalRuleRelationsByRelation(@Param('relationId') relationId: string) {
    return this.rulesWithdrawalService.findByRelationId(relationId);
  }

  @Get('withdrawal-rules-relations/:ruleId/:relationId')
  @ApiOperation({ summary: 'Get withdrawal rule relation by composite ID' })
  findOneWithdrawalRuleRelation(
    @Param('ruleId') ruleId: string,
    @Param('relationId') relationId: string,
  ) {
    return this.rulesWithdrawalService.findOne(ruleId, relationId);
  }

  @Patch('withdrawal-rules-relations/:ruleId/:relationId')
  @ApiOperation({ summary: 'Update withdrawal rule relation' })
  updateWithdrawalRuleRelation(
    @Param('ruleId') ruleId: string,
    @Param('relationId') relationId: string,
    @Body() updateRulesWithdrawalDto: UpdateRulesWithdrawalDto,
  ) {
    return this.rulesWithdrawalService.update(ruleId, relationId, updateRulesWithdrawalDto);
  }

  @Delete('withdrawal-rules-relations/:ruleId/:relationId')
  @ApiOperation({ summary: 'Delete withdrawal rule relation' })
  removeWithdrawalRuleRelation(
    @Param('ruleId') ruleId: string,
    @Param('relationId') relationId: string,
  ) {
    return this.rulesWithdrawalService.remove(ruleId, relationId);
  }
}
