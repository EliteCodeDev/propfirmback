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
import { ChallengeDetailsService } from '../services/challenge-details.service';
import { CreateChallengeDetailsDto } from '../dto/create-challenge-details.dto';
import { UpdateChallengeDetailsDto } from '../dto/update-challenge-details.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Challenge Details')
@ApiBearerAuth()
@Public()
@Controller('challenge-details')
export class ChallengeDetailsController {
  constructor(
    private readonly challengeDetailsService: ChallengeDetailsService,
  ) {}

  @Post()
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
    return this.challengeDetailsService.createChallengeDetails(
      createChallengeDetailsDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all challenge details' })
  @ApiResponse({ status: 200, description: 'List of all challenge details' })
  findAllChallengeDetails() {
    return this.challengeDetailsService.findAllChallengeDetails();
  }

  @Get(':challengeID')
  @ApiOperation({ summary: 'Get challenge details by challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge details found' })
  @ApiResponse({ status: 404, description: 'Challenge details not found' })
  findChallengeDetails(@Param('challengeID') challengeID: string) {
    return this.challengeDetailsService.findChallengeDetails(challengeID);
  }

  @Patch(':challengeID')
  @ApiOperation({ summary: 'Update challenge details' })
  @ApiResponse({
    status: 200,
    description: 'Challenge details updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge details not found' })
  updateChallengeDetails(
    @Param('challengeID') challengeID: string,
    @Body() updateChallengeDetailsDto: UpdateChallengeDetailsDto,
  ) {
    return this.challengeDetailsService.updateChallengeDetails(
      challengeID,
      updateChallengeDetailsDto,
    );
  }

  @Post(':challengeID/upsert')
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
    @Param('challengeID') challengeID: string,
    @Body()
    challengeDetailsData: Omit<CreateChallengeDetailsDto, 'challengeID'>,
  ) {
    return this.challengeDetailsService.upsertChallengeDetails(
      challengeID,
      challengeDetailsData,
    );
  }

  @Delete(':challengeID')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete challenge details' })
  @ApiResponse({
    status: 200,
    description: 'Challenge details deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge details not found' })
  removeChallengeDetails(@Param('challengeID') challengeID: string) {
    return this.challengeDetailsService.removeChallengeDetails(challengeID);
  }
}
