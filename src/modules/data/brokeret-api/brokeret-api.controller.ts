import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { BrokeretApiService } from './brokeret-api.service';
import {
  BrokeretApiClient,
  TradingActivityBody,
  PositionsListBody,
  OrdersListBody,
} from './client/brokeret-api.client';
import { CreationFazoClient } from './client/creation-fazo.client';
import { GenericApiKeyGuard } from 'src/common/guards/generic-api-key.guard';
import { ApiKeyService } from 'src/common/decorators/api-key-service.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { BalanceAccountDto } from './dto/balance.dto';
import { AuthDto } from './dto/auth.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import {
  TokenResponse,
  CreateAccountResponse,
  OpenPositionsResponse,
  ClosedPositionsResponse,
  ClosedWithinRiskResponse,
  BrokeretUserResponse,
  CriticalUsersByMarginResponse,
  UsersByDrawdownResponse,
  PositionsAtRiskResponse,
  StatsPropResponse,
} from './types/response.type';
import { ListClosedPositionsDto } from './dto/list-closed-positions.dto';

@ApiTags('Brokeret API')
@Controller('brokeret-api')
@UseGuards(GenericApiKeyGuard)
@ApiKeyService('brokeret')
export class BrokeretApiController {
  constructor(
    private readonly brokeretApiService: BrokeretApiService,
    private readonly creationFazoClient: CreationFazoClient,
    private readonly brokeretApiClient: BrokeretApiClient,
  ) {}

  // === Autenticación Fazo ===

  @Post('fazo/auth')
  @ApiOperation({ summary: 'Autenticar con Fazo API para obtener token' })
  @ApiResponse({
    status: 200,
    description: 'Token obtenido exitosamente',
    type: Object,
  })
  @ApiBody({ type: AuthDto, description: 'Credenciales de autenticación' })
  async authenticateFazo(@Body() authData: AuthDto): Promise<TokenResponse> {
    return this.creationFazoClient.authenticate(authData);
  }

  @Post('fazo/create-account')
  @ApiOperation({ summary: 'Crear una nueva cuenta en Fazo' })
  @ApiResponse({
    status: 201,
    description: 'Cuenta creada exitosamente',
    type: Object,
  })
  @ApiBody({
    type: CreateAccountDto,
    description: 'Datos de la cuenta a crear',
  })
  async createFazoAccount(
    @Body() accountData: CreateAccountDto,
  ): Promise<CreateAccountResponse> {
    return this.creationFazoClient.createAccount(accountData);
  }

  // === Gestión de Usuarios ===

  @Post('user/create')
  @ApiOperation({ summary: 'Crear un nuevo usuario en Brokeret' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiBody({ type: CreateUserDto, description: 'Datos del usuario a crear' })
  async createUser(
    @Body() createUserData: CreateUserDto,
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.createUser(createUserData);
  }

  @Get('user/:login')
  @ApiOperation({ summary: 'Obtener información de un usuario' })
  @ApiResponse({ status: 200, description: 'Información del usuario obtenida' })
  async getUser(@Param('login') login: string): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.getUser(login);
  }

  @Post('user/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del usuario obtenidas',
  })
  @ApiBody({
    schema: { type: 'object', properties: { login: { type: 'string' } } },
  })
  async getUserStats(
    @Body() body: { login: string | number },
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.statsUser(body.login);
  }

  // === Gestión de Cuentas ===

  @Post('account/trading-activity')
  @ApiOperation({ summary: 'Activar o desactivar trading en una cuenta' })
  @ApiResponse({ status: 200, description: 'Estado de trading actualizado' })
  @ApiBody({
    type: Object,
    description: 'Datos para cambiar estado de trading',
  })
  async setTradingActivity(
    @Body() tradingActivityData: TradingActivityBody,
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.setTradingActivity(tradingActivityData);
  }

  @Post('account/balance-operation')
  @ApiOperation({ summary: 'Realizar operación de balance (depósito/retiro)' })
  @ApiResponse({ status: 200, description: 'Operación de balance realizada' })
  @ApiBody({
    type: BalanceAccountDto,
    description: 'Datos de la operación de balance',
  })
  async balanceOperation(
    @Body() balanceData: BalanceAccountDto,
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.balanceOperation(balanceData);
  }

  // === Posiciones ===

  @Get('positions/open/:login')
  @ApiOperation({ summary: 'Listar posiciones abiertas' })
  @ApiResponse({ status: 200, description: 'Lista de posiciones abiertas' })
  async listOpenPositions(
    @Param('login') login: string,
  ): Promise<OpenPositionsResponse> {
    return this.brokeretApiClient.listOpenPositions(Number(login));
  }

  @Post('positions/closed')
  @ApiOperation({ summary: 'Listar posiciones cerradas' })
  @ApiResponse({ status: 200, description: 'Lista de posiciones cerradas' })
  @ApiBody({
    type: ListClosedPositionsDto,
    description: 'Filtros para posiciones cerradas',
  })
  async listClosedPositions(
    @Body() dto: ListClosedPositionsDto,
  ): Promise<ClosedPositionsResponse> {
    return this.brokeretApiClient.listClosedPositions(dto);
  }

  // === Órdenes ===

  @Get('orders/user/:login')
  @ApiOperation({ summary: 'Listar órdenes de un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de órdenes del usuario' })
  async listUserOrders(@Param('login') login: string): Promise<any> {
    return this.brokeretApiClient.listUserOrders(Number(login));
  }

  // === Risk Management ===

  @Post('risk/total-score')
  @ApiOperation({ summary: 'Obtener puntuación total de riesgo' })
  @ApiResponse({
    status: 200,
    description: 'Puntuación total de riesgo obtenida',
  })
  @ApiBody({
    schema: { type: 'object', properties: { login: { type: 'string' } } },
  })
  async getRiskTotalScore(
    @Body() body: { login: string | number },
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.riskTotalScore(body.login);
  }

  @Post('risk/today-score')
  @ApiOperation({ summary: 'Obtener puntuación de riesgo del día' })
  @ApiResponse({
    status: 200,
    description: 'Puntuación de riesgo del día obtenida',
  })
  @ApiBody({
    schema: { type: 'object', properties: { login: { type: 'string' } } },
  })
  async getRiskTodayScore(
    @Body() body: { login: string | number },
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.riskTodayScore(body.login);
  }

  // === Estadísticas Prop ===

  @Post('stats/prop')
  @ApiOperation({ summary: 'Obtener estadísticas de prop trading' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de prop trading obtenidas',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logins: { type: 'array', items: { type: 'string' } },
        model: { type: 'string', required: ['false'], default: 'prop' },
      },
    },
  })
  async getStatsProp(
    @Body() body: { logins: Array<string | number>; model?: string },
  ): Promise<StatsPropResponse> {
    return this.brokeretApiClient.statsProp(body.logins, body.model);
  }

  // === Endpoint genérico para llamadas personalizadas ===

  // === Risk Management Adicional ===

  @Get('risk/critical-users-margin')
  @ApiOperation({ summary: 'Obtener usuarios críticos por margen' })
  @ApiResponse({ status: 200, description: 'Usuarios críticos por margen' })
  @ApiQuery({ name: 'marginLevelThreshold', type: 'number', required: true })
  async getCriticalUsersByMargin(
    @Query('marginLevelThreshold') marginLevelThreshold: number,
  ): Promise<CriticalUsersByMarginResponse> {
    return this.brokeretApiClient.getCriticalUsersByMargin(
      marginLevelThreshold,
    );
  }

  @Get('risk/users-drawdown')
  @ApiOperation({ summary: 'Obtener usuarios por drawdown' })
  @ApiResponse({ status: 200, description: 'Usuarios por drawdown' })
  @ApiQuery({ name: 'minDrawdown', type: 'number', required: true })
  @ApiQuery({ name: 'periodDays', type: 'number', required: true })
  async getUsersByDrawdown(
    @Query('minDrawdown') minDrawdown: number,
    @Query('periodDays') periodDays: number,
  ): Promise<UsersByDrawdownResponse> {
    return this.brokeretApiClient.getUsersByDrawdown(minDrawdown, periodDays);
  }

  @Get('risk/positions-at-risk')
  @ApiOperation({ summary: 'Obtener posiciones en riesgo' })
  @ApiResponse({ status: 200, description: 'Posiciones en riesgo' })
  @ApiQuery({ name: 'marginLevelThreshold', type: 'number', required: true })
  @ApiQuery({ name: 'lossThreshold', type: 'number', required: true })
  async getPositionsAtRisk(
    @Query('marginLevelThreshold') marginLevelThreshold: number,
    @Query('lossThreshold') lossThreshold: number,
  ): Promise<PositionsAtRiskResponse> {
    return this.brokeretApiClient.listPositionsAtRisk(
      marginLevelThreshold,
      lossThreshold,
    );
  }

  @Get('risk/closed-within-risk')
  @ApiOperation({ summary: 'Obtener posiciones cerradas dentro del riesgo' })
  @ApiResponse({
    status: 200,
    description: 'Posiciones cerradas dentro del riesgo',
  })
  @ApiQuery({ name: 'start_time', type: 'string', required: false })
  @ApiQuery({ name: 'end_time', type: 'string', required: false })
  @ApiQuery({ name: 'demo', type: 'boolean', required: false })
  async getClosedWithinRisk(
    @Query('start_time') start_time?: string,
    @Query('end_time') end_time?: string,
    @Query('demo') demo?: boolean,
  ): Promise<ClosedWithinRiskResponse> {
    return this.brokeretApiClient.listAllClosedWithinRisk({
      start_time: start_time,
      end_time: end_time,
      demo: demo || false,
    });
  }

  // === Gestión de Usuarios ===

  @Get('users/all')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de todos los usuarios' })
  async listAllUsers(): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.listAllUsers({} as BalanceAccountDto);
  }

  @Post('users/trading/enable/:login')
  @ApiOperation({ summary: 'Habilitar trading para un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Trading habilitado para el usuario',
  })
  async enableTrading(
    @Param('login') login: string,
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.enableTrading(Number(login));
  }

  @Post('users/trading/disable/:login')
  @ApiOperation({ summary: 'Deshabilitar trading para un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Trading deshabilitado para el usuario',
  })
  async disableTrading(
    @Param('login') login: string,
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.disableTrading(Number(login));
  }

  // === Endpoint Raw ===

  // @Post('raw/:method/:path')
  // @ApiOperation({ summary: 'Realizar petición raw a la API' })
  // @ApiResponse({ status: 200, description: 'Respuesta de la API raw' })
  // @ApiBody({ type: Object, description: 'Datos para la petición raw' })
  // async rawRequest(
  //   @Param('method') method: string,
  //   @Param('path') path: string,
  //   @Body() data?: any,
  // ): Promise<any> {
  //   return this.brokeretApiClient.raw(method, path, data);
  // }
}
