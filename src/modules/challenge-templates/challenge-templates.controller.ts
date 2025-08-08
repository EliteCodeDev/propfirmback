import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChallengeTemplatesService } from './challenge-templates.service';

// DTOs
import { CreateChallengeCategoryDto } from './dto/create/create-challenge-category.dto';
import { UpdateChallengeCategoryDto } from './dto/update/update-challenge-category.dto';
import { CreateChallengePlanDto } from './dto/create/create-challenge-plan.dto';
import { UpdateChallengePlanDto } from './dto/update/update-challenge-plan.dto';
import { CreateChallengeBalanceDto } from './dto/create/create-challenge-balance.dto';
import { UpdateChallengeBalanceDto } from './dto/update/update-challenge-balance.dto';
import { CreateChallengeRelationDto } from './dto/create/create-challenge-relation.dto';
import { UpdateChallengeRelationDto } from './dto/update/update-challenge-relation.dto';
import { CreateChallengeStageDto } from './dto/create/create-challenge-stage.dto';
import { UpdateChallengeStageDto } from './dto/update/update-challenge-stage.dto';
import { CreateStageRuleDto } from './dto/create/create-stage-rule.dto';
import { UpdateStageRuleDto } from './dto/update/update-stage-rule.dto';
import { CreateStageParameterDto } from './dto/create/create-stage-parameter.dto';
import { UpdateStageParameterDto } from './dto/update/update-stage-parameter.dto';
import { CreateRelationStageDto } from './dto/create/create-relation-stage.dto';
import { UpdateRelationStageDto } from './dto/update/update-relation-stage.dto';

// Guards & Decorators
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Challenge Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('challenge-templates')
export class ChallengeTemplatesController {
  constructor(
    private readonly challengeTemplatesService: ChallengeTemplatesService,
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

  @Get('relation-stages')
  @ApiOperation({ summary: 'Get all relation stages' })
  findAllRelationStages() {
    return this.challengeTemplatesService.findAllRelationStages();
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
}
