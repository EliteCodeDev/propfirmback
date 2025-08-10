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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new challenge' })
  create(@Request() req, @Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(req.user.userID, createChallengeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all challenges' })
  findAll(@Query() query: ChallengeQueryDto) {
    return this.challengesService.findAll(query);
  }

  @Get('my-challenges')
  @ApiOperation({ summary: 'Get current user challenges' })
  findMyChallenges(@Request() req, @Query() query: ChallengeQueryDto) {
    return this.challengesService.findByUserId(req.user.userID, query);
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
}
