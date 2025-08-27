import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { brokeretApiConfig } from 'src/config';
import { CreateUserDto } from '../dto/create-user.dto';

import { ListClosedPositionsDto } from '../dto/list-closed-positions.dto';
import {
  OpenPositionsResponse,
  ClosedPositionsResponse,
  ClosedWithinRiskResponse,
  BrokeretUserResponse,
  CriticalUsersByMarginResponse,
  UsersByDrawdownResponse,
  PositionsAtRiskResponse,
  StatsPropResponse,
  ProfitabilityAnalyticsResponse,
  UserDetailsResponse,
} from '../types/response.type';

@Injectable()
export class BrokeretApiClient {
  private readonly logger = new Logger(BrokeretApiClient.name);
  constructor(
    private readonly http: HttpService,
    @Inject(brokeretApiConfig.KEY)
    private readonly cfg: ConfigType<typeof brokeretApiConfig>,
  ) {}

  private buildUrl(path: string): string {
    if (!this.cfg.url) {
      this.logger.error(
        'BROKERET_API_URL is not configured in environment variables',
      );
      throw new Error(
        'BROKERET_API_URL is not configured. Please check your environment variables.',
      );
    }

    const base = this.cfg.url.replace(/\/+$/, '');
    const clean = path.replace(/^\/+/, '');
    // Don't add /v1/ if the base URL already ends with /v1
    const fullUrl = base.endsWith('/v1')
      ? `${base}/${clean}`
      : `${base}/v1/${clean}`;

    this.logger.debug(`Building URL: ${fullUrl}`);
    return fullUrl;
  }

  private buildHeaders(extra?: Record<string, string>) {
    const headerName = 'X-API-Key';
    return {
      'Content-Type': 'application/json',
      ...(this.cfg.apiKey ? { [headerName]: `${this.cfg.apiKey}` } : {}),
      ...extra,
    };
  }

  private async request<T = any>(
    method: AxiosRequestConfig['method'],
    path: string,
    options: {
      data?: any;
      params?: any;
      headers?: Record<string, string>;
      silent?: boolean;
    } = {},
  ): Promise<T> {
    const url = this.buildUrl(path);
    try {
      const res = await firstValueFrom(
        this.http.request<T>({
          method,
          url,
          data: options.data,
          params: options.params,
          headers: this.buildHeaders(options.headers),
        }),
      );
      return res.data as any;
    } catch (err: any) {
      if (!options.silent) {
        this.logger.error(
          `HTTP ${method?.toUpperCase()} ${url} fallo: ${err?.response?.status} ${JSON.stringify(err?.response?.data || err.message)}`,
        );
      }
      throw err;
    }
  }

  // === POSITIONS AND ORDERS===

  // POST position/list/open
  listOpenPositions(param: number | string): Promise<OpenPositionsResponse> {
    return this.request<OpenPositionsResponse>(
      'get',
      `positions/user/${param}`,
    );
  }

  // GET deals/user/{login}
  async listClosedPositions(
    dto: ListClosedPositionsDto,
  ): Promise<any> {
    const { login, offset, start_time, end_time } = dto;
    
    // Agregar un día más a la fecha de fin
    let adjustedEndTime = end_time;
    if (end_time) {
      const endDate = new Date(end_time);
      endDate.setDate(endDate.getDate() + 1);
      adjustedEndTime = endDate.toISOString().split('T')[0];
    }
    
    const params: any = { start_time, end_time: adjustedEndTime };
    if (offset !== undefined) params.offset = Number(offset);
    
    const response = await this.request<ClosedPositionsResponse>('get', `deals/user/${login}`, {
      params,
    });

    // Filtrar y procesar las posiciones cerradas
    if (response?.data?.deals) {
      const filteredDeals = response.data.deals
        .filter(deal => deal.action_name !== 'BALANCE') // Filtrar operaciones de balance
        .reduce((groups, deal) => {
          const key = deal.position_id;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(deal);
          return groups;
        }, {} as Record<number, any[]>);

      // Procesar solo los grupos que tienen exactamente 2 operaciones (entrada y salida)
      const processedPositions = Object.values(filteredDeals)
        .filter(group => group.length === 2)
        .map(group => {
          // Ordenar por fecha para identificar entrada y salida
          const sortedGroup = group.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          const entryDeal = sortedGroup[0];
          const exitDeal = sortedGroup[1];
          
          // Calcular duración en segundos
          const entryTime = new Date(entryDeal.time);
          const exitTime = new Date(exitDeal.time);
          const durationSeconds = Math.floor((exitTime.getTime() - entryTime.getTime()) / 1000);
          
          return {
            position_id: entryDeal.position_id,
            login: entryDeal.login,
            symbol: entryDeal.symbol,
            action: entryDeal.action_name,
            volume: entryDeal.volume,
            price_open: entryDeal.price,
            price_close: exitDeal.price,
            time_open: entryDeal.time,
            time_close: exitDeal.time,
            duration_seconds: durationSeconds,
            profit: exitDeal.profit, // Solo el deal de cierre tiene profit
            commission: exitDeal.commission,
            swap: exitDeal.swap,
            net_profit: exitDeal.profit + exitDeal.commission + exitDeal.swap,
            comment: entryDeal.comment,
            group: entryDeal.group,
            email: entryDeal.email
          };
        })
        .filter(position => position.profit !== 0); // Solo devolver posiciones con profit distinto de 0

      return {
        ...response,
        data: {
          ...response.data,
          deals: processedPositions
        }
      };
    }

    return response;
  }

  // GET deals/closed-within-period
  listAllClosedWithinRisk({
    start_date,
    end_date,
    demo,
  }: {
    start_date: string;
    end_date: string;
    demo: boolean;
  }): Promise<ClosedWithinRiskResponse> {
    // Agregar un día más a la fecha de fin
    let adjustedEndDate = end_date;
    if (end_date) {
      const endDateObj = new Date(end_date);
      endDateObj.setDate(endDateObj.getDate() + 1);
      adjustedEndDate = endDateObj.toISOString().split('T')[0];
    }
    
    return this.request<ClosedWithinRiskResponse>(
      'get',
      `deals/closed-within-period`,
      {
        params: { start_date, end_date: adjustedEndDate, demo },
      },
    );
  }

  // POST order/list/user
  listUserOrders(param: number | string): Promise<any> {
    return this.request('get', `orders/user/${param}`);
  }

  // === RISK MANAGEMENT ===

  // GET risk/margin/critical-users
  getCriticalUsersByMargin(
    marginLevelThreshold: number,
  ): Promise<CriticalUsersByMarginResponse> {
    return this.request<CriticalUsersByMarginResponse>(
      'get',
      'risk/margin/critical-users',
      {
        params: {
          margin_level_threshold: marginLevelThreshold,
        },
      },
    );
  }

  // GET risk/drawdown/users
  getUsersByDrawdown(
    minDrawdown: number,
    periodDays: number,
  ): Promise<UsersByDrawdownResponse> {
    return this.request<UsersByDrawdownResponse>('get', 'risk/drawdown/users', {
      params: {
        min_drawdown: minDrawdown,
        period_days: periodDays,
      },
    });
  }

  // POST user/get

  // new estructure:
  // curl -X 'GET' \
  // 'http://mt5api.brokeret.com:9000/api/v1/users/90009096752' \
  // -H 'accept: application/json' \
  // -H 'Authorization: Bearer h325lqhefer54g454veb5s4ong567htuy5'

  // GET users/{login} (nueva estructura)
  /**
   * Obtiene detalles de usuario usando la nueva estructura GET.
   * GET users/{login}
   */
  getUserDetails(login: string | number): Promise<UserDetailsResponse> {
    return this.request<UserDetailsResponse>('get', `users/${login}`);
  }

  // === FINANCIAL OPERATIONS ===
  // POST /financial/deposit
  makeDeposit(body: {
    login: number;
    amount: number;
    comment?: string;
    payment_method: string;
  }): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>('post', 'financial/deposit', {
      data: body,
    });
  }

  // POST /financial/withdrawal
  makeWithdrawal(body: {
    login: number;
    amount: number;
    comment?: string;
    payment_method: string;
  }): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>('post', 'financial/withdrawal', {
      data: body,
    });
  }

  // POST /financial/credit
  manageCredit(body: {
    login: number;
    amount: number;
    comment?: string;
  }): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>('post', 'financial/credit', {
      data: body,
    });
  }

  // POST /financial/internal-transfer
  internalTransfer(body: {
    from_login: number;
    to_login: number;
    amount: number;
    comment?: string;
  }): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>(
      'post',
      'financial/internal-transfer',
      { data: body },
    );
  }

  // POST /financial/commission-adjustment
  adjustCommission(body: {
    login: number;
    amount: number;
    comment?: string;
  }): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>(
      'post',
      'financial/commission-adjustment',
      { data: body },
    );
  }

  // GET all users
  listAllUsers(body?: { login?: string; amount?: number }): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>('get', 'users/all', {
      data: body,
    });
  }

  // POST enable / disable trading
  enableTrading(param: number): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>(
      'post',
      `users/trading/enable/${param}`,
      {
        data: param,
      },
    );
  }
  disableTrading(param: number): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>(
      'post',
      `users/trading/disable/${param}`,
      {
        data: param,
      },
    );
  }

  // POST positions at risk
  /**
   * Obtiene posiciones en riesgo.
   * GET positions/at-risk?margin_level_threshold=..&loss_threshold=..
   */
  listPositionsAtRisk(
    marginLevelThreshold: number,
    lossThreshold: number,
  ): Promise<PositionsAtRiskResponse> {
    return this.request<PositionsAtRiskResponse>('get', 'positions/at-risk', {
      params: {
        margin_level_threshold: marginLevelThreshold,
        loss_threshold: lossThreshold,
      },
    });
  }

  // GET trading/analytics/profitability
  /**
   * Obtiene análisis de rentabilidad para un usuario específico.
   * GET trading/analytics/profitability?login=...&days=...
   */
  getProfitabilityAnalytics(
    login: string | number,
    days: number,
    symbol?: string,
    group?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ProfitabilityAnalyticsResponse> {
    const params: any = { login, days };
    if (symbol) params.symbol = symbol;
    if (group) params.group = group;
    
    // Si se proporciona endDate, agregar un día más
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      params.end_date = endDateObj.toISOString().split('T')[0];
    }
    if (startDate) params.start_date = startDate;

    return this.request<ProfitabilityAnalyticsResponse>(
      'get',
      'trading/analytics/profitability',
      { params },
    );
  }

  // Método genérico por si aparecen endpoints nuevos
  raw<T = any>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: any,
    params?: any,
  ) {
    return this.request<T>(method, path, { data, params });
  }
}
