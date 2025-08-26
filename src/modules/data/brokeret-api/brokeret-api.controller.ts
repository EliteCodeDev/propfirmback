import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BrokeretApiService } from './brokeret-api.service';
import {
  BrokeretApiClient,
  TradingActivityBody,
  PositionsListBody,
  OrdersListBody,
} from './client/brokeret-api.client';
import { GenericApiKeyGuard } from 'src/common/guards/generic-api-key.guard';
import { ApiKeyService } from 'src/common/decorators/api-key-service.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { BalanceAccountDto } from './dto/balance.dto';

@ApiTags('Brokeret API')
@Controller('brokeret-api')
@UseGuards(GenericApiKeyGuard)
@ApiKeyService('brokeret')
export class BrokeretApiController {
  constructor(
    private readonly brokeretApiService: BrokeretApiService,
    private readonly brokeretApiClient: BrokeretApiClient,
  ) {}

  // === Gestión de Usuarios ===

  @Post('user/create')
  @ApiOperation({ summary: 'Crear un nuevo usuario en Brokeret' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiBody({ type: Object, description: 'Datos del usuario a crear' })
  async createUser(@Body() createUserData: CreateUserDto) {
    return this.brokeretApiClient.createUser(createUserData);
  }

  @Get('user/:login')
  @ApiOperation({ summary: 'Obtener información de un usuario' })
  @ApiResponse({ status: 200, description: 'Información del usuario obtenida' })
  @ApiBody({
    schema: { type: 'object', properties: { login: { type: 'string' } } },
  })
  async getUser(@Param('login') login: number) {
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
  async getUserStats(@Body() body: { login: string | number }) {
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
  async setTradingActivity(@Body() tradingActivityData: TradingActivityBody) {
    return this.brokeretApiClient.setTradingActivity(tradingActivityData);
  }

  @Post('account/balance-operation')
  @ApiOperation({ summary: 'Realizar operación de balance (depósito/retiro)' })
  @ApiResponse({ status: 200, description: 'Operación de balance realizada' })
  @ApiBody({ type: Object, description: 'Datos de la operación de balance' })
  async balanceOperation(@Body() balanceData: BalanceAccountDto) {
    return this.brokeretApiClient.balanceOperation(balanceData);
  }

  // === Posiciones ===

  @Get('positions/open/:login')
  @ApiOperation({ summary: 'Listar posiciones abiertas' })
  @ApiResponse({ status: 200, description: 'Lista de posiciones abiertas' })
  @ApiBody({ type: Object, description: 'Filtros para posiciones abiertas' })
  async listOpenPositions(@Query() login: number) {
    return this.brokeretApiClient.listOpenPositions(login);
  }

  @Get('positions/close/:login')
  @ApiOperation({ summary: 'Listar posiciones cerradas' })
  @ApiResponse({ status: 200, description: 'Lista de posiciones cerradas' })
  @ApiBody({ type: Object, description: 'Filtros para posiciones cerradas' })
  async listClosedPositions(@Query() login: number) {
    return this.brokeretApiClient.listClosedPositions(login);
  }

  // === Órdenes ===

  @Post('orders/user')
  @ApiOperation({ summary: 'Listar órdenes de un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de órdenes del usuario' })
  @ApiBody({ type: Object, description: 'Filtros para órdenes del usuario' })
  async listUserOrders(@Body() filters: OrdersListBody) {
    return this.brokeretApiClient.listUserOrders(filters);
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
  async getRiskTotalScore(@Body() body: { login: string | number }) {
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
  async getRiskTodayScore(@Body() body: { login: string | number }) {
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
  ) {
    return this.brokeretApiClient.statsProp(body.logins, body.model);
  }

  // === Endpoint genérico para llamadas personalizadas ===

  @Post('raw/:method/:path')
  @ApiOperation({
    summary: 'Endpoint genérico para llamadas personalizadas a Brokeret API',
  })
  @ApiResponse({ status: 200, description: 'Respuesta de la API de Brokeret' })
  async rawRequest(
    @Param('method') method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    @Param('path') path: string,
    @Body() body?: any,
    @Query() params?: any,
  ) {
    return this.brokeretApiClient.raw(method, path, body, params);
  }
}
