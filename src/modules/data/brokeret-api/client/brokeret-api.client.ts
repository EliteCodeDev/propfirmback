import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { brokeretApiConfig } from 'src/config';
import { CreateUserDto } from '../dto/create-user.dto';
import { BalanceAccountDto } from '../dto/balance.dto';
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
  ) { }

  private buildUrl(path: string): string {
    if (!this.cfg.url) {
      this.logger.error('BROKERET_API_URL is not configured in environment variables');
      throw new Error('BROKERET_API_URL is not configured. Please check your environment variables.');
    }
    
    const base = this.cfg.url.replace(/\/+$/, '');
    const clean = path.replace(/^\/+/, '');
    // Don't add /v1/ if the base URL already ends with /v1
    const fullUrl = base.endsWith('/v1') ? `${base}/${clean}` : `${base}/v1/${clean}`;
    
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
  listClosedPositions(
    dto: ListClosedPositionsDto,
  ): Promise<ClosedPositionsResponse> {
    const { login, offset, start_time, end_time } = dto;
    const params: any = { start_time, end_time };
    if (offset !== undefined) params.offset = offset;
    return this.request<ClosedPositionsResponse>('get', `deals/user/${login}`, {
      params,
    });
  }

  // GET deals/closed-within-period
  listAllClosedWithinRisk({
    start_time,
    end_time,
    demo,
  }: {
    start_time: string;
    end_time: string;
    demo: boolean;
  }): Promise<ClosedWithinRiskResponse> {
    return this.request<ClosedWithinRiskResponse>(
      'get',
      `deals/closed-within-period`,
      {
        params: { start_time, end_time, demo },
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

  // === Nuevos endpoints del flujo n8n ===

  // POST account/balance-operation
  balanceOperation(body: BalanceAccountDto): Promise<BrokeretUserResponse> {
    return this.request<BrokeretUserResponse>(
      'post',
      'account/balance-operation',
      {
        data: body,
      },
    );
  }
 //operaciones con balances
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

  // POST get all user
  listAllUsers(body: BalanceAccountDto): Promise<BrokeretUserResponse> {
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
  ): Promise<ProfitabilityAnalyticsResponse> {
    const params: any = { login, days };
    if (symbol) params.symbol = symbol;
    if (group) params.group = group;

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
