import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { CreateChallengeDetailsDto } from './dto/create-challenge-details.dto';
import { UpdateChallengeDetailsDto } from './dto/update-challenge-details.dto';
import { DisapproveChallengeDto } from './dto/disapprove-challenge.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import {
  mapChallengesToBasicAccounts,
  mapChallengesToAccounts,
  mapChallengeToAccount,
} from 'src/common/utils/account-mapper';
import { ChallengeTemplatesService } from '../challenge-templates/services/challenge-templates.service';

@ApiTags('Challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly challengeTemplatesService: ChallengeTemplatesService,
  ) {}

  @Post()
  // @UseGuards(RolesGuard)
  @Public()
  @ApiOperation({ summary: 'Create a new challenge' })
  create(@Request() req, @Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(createChallengeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all challenges' })
  findAll(@Query() query: ChallengeQueryDto) {
    return this.challengesService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user challenges' })
  async findMyChallenges(@Request() req, @Query() query: ChallengeQueryDto) {
    return await this.challengesService.findByUserIdSimple(
      req.user.userID,
      query,
    );
  }
  @Get('me-basic')
  @ApiOperation({ summary: 'Get current basic user challenges' })
  async findMyBasicChallenges(
    @Request() req,
    @Query() query: ChallengeQueryDto,
  ) {
    const challenges = await this.challengesService.findByUserId(
      req.user.userID,
      query,
    );
    return mapChallengesToBasicAccounts(challenges.data).map((challenge) => ({
      ...challenge,
      // user: req.user,
    }));
  }

  @Get('me/:challengeID')
  @ApiOperation({ summary: 'Get all challenge details' })
  @ApiResponse({ status: 200, description: 'List of all challenge details' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Challenge does not belong to user',
  })
  async finMyChallengesDetails(
    @Request() req,
    @Query() query: ChallengeQueryDto,
    @Param('challengeID') challengeID: string,
  ) {
    const challenge = await this.challengesService.findOne(challengeID);

    // Verificar que el challenge pertenece al usuario
    if (challenge.userID !== req.user.userID) {
      throw new ForbiddenException('You do not have access to this challenge');
    }
    challenge.relation =
      await this.challengeTemplatesService.findCompleteRelationChain(
        challenge.relationID,
      );
      
    return mapChallengeToAccount(challenge);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge by ID' })
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update challenge' })
  update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ) {
    return this.challengesService.update(id, updateChallengeDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete challenge' })
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }

  // Template-related endpoints (read-only for challenge creation)
  @Get('templates/relations')
  @ApiOperation({
    summary: 'Get available challenge relations for creating challenges',
  })
  getAvailableRelations() {
    return this.challengesService.getAvailableRelations();
  }

  @Get('templates/categories')
  @ApiOperation({
    summary: 'Get available challenge categories for creating challenges',
  })
  getAvailableCategories() {
    return this.challengesService.getAvailableCategories();
  }

  @Get('templates/plans')
  @ApiOperation({
    summary: 'Get available challenge plans for creating challenges',
  })
  getAvailablePlans() {
    return this.challengesService.getAvailablePlans();
  }

  // Challenge Details endpoints
  @Post('details')
  @ApiOperation({ summary: 'Create challenge details' })
  @ApiResponse({
    status: 201,
    description: 'Challenge details created successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  @ApiResponse({ status: 403, description: 'Challenge details already exist' })
  createChallengeDetails(
    @Body() createChallengeDetailsDto: CreateChallengeDetailsDto,
  ) {
    return this.challengesService.createChallengeDetails(
      createChallengeDetailsDto,
    );
  }

  @Get('details')
  @ApiOperation({ summary: 'Get all challenge details' })
  @ApiResponse({ status: 200, description: 'List of all challenge details' })
  findAllChallengeDetails() {
    return this.challengesService.findAllChallengeDetails();
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get challenge details by challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge details found' })
  @ApiResponse({ status: 404, description: 'Challenge details not found' })
  findChallengeDetails(@Param('id') challengeID: string) {
    return this.challengesService.findChallengeDetails(challengeID);
  }

  @Patch(':id/details')
  @ApiOperation({ summary: 'Update challenge details' })
  @ApiResponse({
    status: 200,
    description: 'Challenge details updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge details not found' })
  updateChallengeDetails(
    @Param('id') challengeID: string,
    @Body() updateChallengeDetailsDto: UpdateChallengeDetailsDto,
  ) {
    return this.challengesService.updateChallengeDetails(
      challengeID,
      updateChallengeDetailsDto,
    );
  }

  @Post(':id/details/upsert')
  @ApiOperation({
    summary: 'Create or update challenge details (upsert)',
    description:
      "Creates new challenge details if they don't exist, or updates existing ones",
  })
  @ApiResponse({
    status: 200,
    description: 'Challenge details created or updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  upsertChallengeDetails(
    @Param('id') challengeID: string,
    @Body()
    challengeDetailsData: Omit<CreateChallengeDetailsDto, 'challengeID'>,
  ) {
    return this.challengesService.upsertChallengeDetails(
      challengeID,
      challengeDetailsData,
    );
  }

  @Delete(':id/details')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete challenge details' })
  @ApiResponse({
    status: 200,
    description: 'Challenge details deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge details not found' })
  removeChallengeDetails(@Param('id') challengeID: string) {
    return this.challengesService.removeChallengeDetails(challengeID);
  }

  // Challenge approval endpoints
  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve challenge' })
  @ApiResponse({
    status: 200,
    description: 'Challenge approved successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  approveChallenge(@Param('id') id: string) {
    return this.challengesService.setApprovedChallenge(id);
  }

  @Post(':id/disapprove')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Disapprove challenge' })
  @ApiResponse({
    status: 200,
    description: 'Challenge disapproved successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  disapproveChallenge(
    @Param('id') id: string,
    @Body() disapproveChallengeDto: DisapproveChallengeDto,
  ) {
    return this.challengesService.setDisapprovedChallenge(
      id,
      disapproveChallengeDto.observation,
    );
  }
}
