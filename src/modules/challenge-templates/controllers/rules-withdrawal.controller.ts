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
import { RulesWithdrawalService } from '../services/rules-withdrawal.service';
import { CreateRulesWithdrawalDto } from '../dto/create/create-rules-withdrawal.dto';
import { UpdateRulesWithdrawalDto } from '../dto/update/update-rules-withdrawal.dto';
import { RulesWithdrawalResponseDto } from '../dto/response/rules-withdrawal-response.dto';
import { Public } from 'src/common/decorators';

@ApiTags('Rules Withdrawal')
@Controller('rules-withdrawal')
export class RulesWithdrawalController {
  constructor(private readonly rulesWithdrawalService: RulesWithdrawalService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Crear una nueva regla de retiro' })
  @ApiResponse({
    status: 201,
    description: 'Regla de retiro creada exitosamente',
    type: RulesWithdrawalResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o IDs no existen',
  })
  create(@Body() createRulesWithdrawalDto: CreateRulesWithdrawalDto): Promise<RulesWithdrawalResponseDto> {
    return this.rulesWithdrawalService.create(createRulesWithdrawalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las reglas de retiro' })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas de retiro obtenida exitosamente',
    type: [RulesWithdrawalResponseDto],
  })
  findAll(): Promise<RulesWithdrawalResponseDto[]> {
    return this.rulesWithdrawalService.findAll();
  }

  @Get('by-rule/:idRule')
  @ApiOperation({ summary: 'Obtener reglas de retiro por ID de regla' })
  @ApiParam({
    name: 'idRule',
    description: 'ID de la regla',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Reglas de retiro encontradas por ID de regla',
    type: [RulesWithdrawalResponseDto],
  })
  findByRuleId(@Param('idRule') idRule: string): Promise<RulesWithdrawalResponseDto[]> {
    return this.rulesWithdrawalService.findByRuleId(idRule);
  }

  @Get('by-relation/:relationID')
  @ApiOperation({ summary: 'Obtener reglas de retiro por ID de relación' })
  @ApiParam({
    name: 'relationID',
    description: 'ID de la relación de challenge',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Reglas de retiro encontradas por ID de relación',
    type: [RulesWithdrawalResponseDto],
  })
  findByRelationId(@Param('relationID') relationID: string): Promise<RulesWithdrawalResponseDto[]> {
    return this.rulesWithdrawalService.findByRelationId(relationID);
  }

  @Get(':idRule/:relationID')
  @ApiOperation({ summary: 'Obtener una regla de retiro específica por ambos IDs' })
  @ApiParam({
    name: 'idRule',
    description: 'ID de la regla',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'relationID',
    description: 'ID de la relación de challenge',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de retiro encontrada',
    type: RulesWithdrawalResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Regla de retiro no encontrada',
  })
  findOne(
    @Param('idRule') idRule: string,
    @Param('relationID') relationID: string,
  ): Promise<RulesWithdrawalResponseDto> {
    return this.rulesWithdrawalService.findOne(idRule, relationID);
  }

  @Patch(':idRule/:relationID')
  @ApiOperation({ summary: 'Actualizar una regla de retiro' })
  @ApiParam({
    name: 'idRule',
    description: 'ID de la regla',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'relationID',
    description: 'ID de la relación de challenge',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de retiro actualizada exitosamente',
    type: RulesWithdrawalResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Regla de retiro no encontrada',
  })
  update(
    @Param('idRule') idRule: string,
    @Param('relationID') relationID: string,
    @Body() updateRulesWithdrawalDto: UpdateRulesWithdrawalDto,
  ): Promise<RulesWithdrawalResponseDto> {
    return this.rulesWithdrawalService.update(idRule, relationID, updateRulesWithdrawalDto);
  }

  @Delete(':idRule/:relationID')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una regla de retiro' })
  @ApiParam({
    name: 'idRule',
    description: 'ID de la regla',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'relationID',
    description: 'ID de la relación de challenge',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 204,
    description: 'Regla de retiro eliminada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Regla de retiro no encontrada',
  })
  remove(
    @Param('idRule') idRule: string,
    @Param('relationID') relationID: string,
  ): Promise<void> {
    return this.rulesWithdrawalService.remove(idRule, relationID);
  }
}