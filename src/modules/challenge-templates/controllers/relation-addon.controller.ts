import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RelationAddonService } from '../services/relation-addon.service';
import { CreateRelationAddonDto } from '../dto/create/create-relation-addon.dto';
import { UpdateRelationAddonDto } from '../dto/update/update-relation-addon.dto';
import { RelationAddonResponseDto } from '../dto/response/relation-addon-response.dto';

@ApiTags('Relation Addons')
@Controller('relation-addons')
export class RelationAddonController {
  constructor(private readonly relationAddonService: RelationAddonService) {}

  @Get()
  @ApiOperation({ summary: 'Get all relation addons' })
  @ApiResponse({
    status: 200,
    description: 'List of all relation addons retrieved successfully',
    type: [RelationAddonResponseDto],
  })
  async findAll(): Promise<RelationAddonResponseDto[]> {
    return await this.relationAddonService.findAll();
  }

  @Get('relation/:relationID')
  @ApiOperation({ summary: 'Get all relation addons by relation ID' })
  @ApiParam({ name: 'relationID', description: 'Relation ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'List of relation addons for the specified relation retrieved successfully',
    type: [RelationAddonResponseDto],
  })
  async findByRelationId(@Param('relationID') relationID: string): Promise<RelationAddonResponseDto[]> {
    return await this.relationAddonService.findByRelationId(relationID);
  }

  @Get(':addonID/:relationID')
  @ApiOperation({ summary: 'Get a specific relation addon by addon ID and relation ID' })
  @ApiParam({ name: 'addonID', description: 'Addon ID', type: 'string' })
  @ApiParam({ name: 'relationID', description: 'Relation ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Relation addon retrieved successfully',
    type: RelationAddonResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Relation addon not found',
  })
  async findOne(
    @Param('addonID') addonID: string,
    @Param('relationID') relationID: string,
  ): Promise<RelationAddonResponseDto> {
    return await this.relationAddonService.findOne(addonID, relationID);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new relation addon' })
  @ApiResponse({
    status: 201,
    description: 'Relation addon created successfully',
    type: RelationAddonResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or addon/relation does not exist',
  })
  async create(@Body() createRelationAddonDto: CreateRelationAddonDto): Promise<RelationAddonResponseDto> {
    return await this.relationAddonService.create(createRelationAddonDto);
  }

  @Patch(':addonID/:relationID')
  @ApiOperation({ summary: 'Update a relation addon' })
  @ApiParam({ name: 'addonID', description: 'Addon ID', type: 'string' })
  @ApiParam({ name: 'relationID', description: 'Relation ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Relation addon updated successfully',
    type: RelationAddonResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Relation addon not found',
  })
  async update(
    @Param('addonID') addonID: string,
    @Param('relationID') relationID: string,
    @Body() updateRelationAddonDto: UpdateRelationAddonDto,
  ): Promise<RelationAddonResponseDto> {
    return await this.relationAddonService.update(addonID, relationID, updateRelationAddonDto);
  }

  @Delete(':addonID/:relationID')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a relation addon' })
  @ApiParam({ name: 'addonID', description: 'Addon ID', type: 'string' })
  @ApiParam({ name: 'relationID', description: 'Relation ID', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Relation addon deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Relation addon not found',
  })
  async remove(
    @Param('addonID') addonID: string,
    @Param('relationID') relationID: string,
  ): Promise<void> {
    return await this.relationAddonService.remove(addonID, relationID);
  }
}