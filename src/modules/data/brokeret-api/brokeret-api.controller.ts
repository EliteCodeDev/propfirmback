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
import { BrokeretApiClient } from './client/brokeret-api.client';
import { CreationFazoClient } from './client/creation-fazo.client';
import { GenericApiKeyGuard } from 'src/common/guards/generic-api-key.guard';
import { ApiKeyService } from 'src/common/decorators/api-key-service.decorator';

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
} from './types/response.type';
import { ListClosedPositionsDto } from './dto/list-closed-positions.dto';
import { BalanceAccountDto } from './dto/balance.dto';

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

  @Get('user/:login')
  @ApiOperation({ summary: 'Obtener información de un usuario' })
  @ApiResponse({ status: 200, description: 'Información del usuario obtenida' })
  async getUser(@Param('login') login: string): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.getUserDetails(login);
  }

  // @Post('user/stats')
  // @ApiOperation({ summary: 'Obtener estadísticas de un usuario' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Estadísticas del usuario obtenidas',
  // })
  // @ApiBody({
  //   schema: { type: 'object', properties: { login: { type: 'string' } } },
  // })
  // async getUserStats(
  //   @Body() body: { login: string | number },
  // ): Promise<BrokeretUserResponse> {
  //   return this.brokeretApiClient.statsUser(body.login);
  // }

  // === Gestión de Cuentas ===

  // === FINANCIAL OPERATIONS ===

  @Post('financial/deposit')
  @ApiOperation({ summary: 'Realizar depósito en cuenta' })
  @ApiResponse({ status: 200, description: 'Depósito realizado exitosamente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        login: { type: 'number' },
        amount: { type: 'number' },
        comment: { type: 'string' },
        payment_method: { type: 'string' },
      },
      required: ['login', 'amount', 'payment_method'],
    },
    description: 'Datos del depósito',
  })
  async makeDeposit(
    @Body()
    depositData: {
      login: number;
      amount: number;
      comment?: string;
      payment_method: string;
    },
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.makeDeposit(depositData);
  }

  @Post('financial/withdrawal')
  @ApiOperation({ summary: 'Realizar retiro de cuenta' })
  @ApiResponse({ status: 200, description: 'Retiro realizado exitosamente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        login: { type: 'number' },
        amount: { type: 'number' },
        comment: { type: 'string' },
        payment_method: { type: 'string' },
      },
      required: ['login', 'amount', 'payment_method'],
    },
    description: 'Datos del retiro',
  })
  async makeWithdrawal(
    @Body()
    withdrawalData: {
      login: number;
      amount: number;
      comment?: string;
      payment_method: string;
    },
  ): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.makeWithdrawal(withdrawalData);
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
      start_date: start_time,
      end_date: end_time,
      demo: demo || false,
    });
  }

  // === Gestión de Usuarios ===

  @Get('users/all')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de todos los usuarios' })
  async listAllUsers(): Promise<BrokeretUserResponse> {
    return this.brokeretApiClient.listAllUsers({
      login: '',
      amount: 0,
    } as BalanceAccountDto);
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
