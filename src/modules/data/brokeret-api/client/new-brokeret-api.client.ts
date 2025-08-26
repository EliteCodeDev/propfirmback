import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { brokeretApiConfig } from 'src/config';
import { CreateUserDto } from '../dto/create-user.dto';
import { BalanceAccountDto } from '../dto/balance.dto';
import { ListClosedPositionsDto } from '../dto/list-closed-positions.dto';

export interface BrokeretUserResponse {
  success?: boolean;
  result?: any;
  [k: string]: any;
}

export interface PositionsListBody {
  flag?: number; // seen as 1 in n8n
  Login: (string | number)[];
  FromDate?: string; // dd/MM/yyyy
  ToDate?: string; // dd/MM/yyyy
  fromTime?: string; // HH:mm:ss
  toTime?: string; // HH:mm:ss
}

export interface OrdersListBody {
  login: string | number;
  FromDate: string; // dd/MM/yyyy
  ToDate: string; // dd/MM/yyyy
}

export interface TradingActivityBody {
  login: string | number;
  tradingFlag: number; // 0 = disable, 1 = enable
}

@Injectable()
export class BrokeretApiClient {
  private readonly logger = new Logger(BrokeretApiClient.name);
  constructor(
    private readonly http: HttpService,
    @Inject(brokeretApiConfig.KEY)
    private readonly cfg: ConfigType<typeof brokeretApiConfig>,
  ) {}

  private buildUrl(path: string): string {
    const base = (this.cfg.url || '').replace(/\/+$/, '');
    const clean = path.replace(/^\/+/, '');
    return `${base}/v1/${clean}`;
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
  listOpenPositions(param: number) {
    return this.request('get', `positions/user/${param}`);
  }

  // GET deals/user/{login}
  listClosedPositions(dto: ListClosedPositionsDto) {
    const { login, offset, start_time, end_time } = dto;
    const params: any = { start_time, end_time };
    if (offset !== undefined) params.offset = offset;
    return this.request('get', `deals/user/${login}`, { params });
  }

  // GET deals/closed-within-period

  listAllClosedWithinRisk({ start_time, end_time }: ListClosedPositionsDto) {
    return this.request('get', `deals/closed-within-period`, {
      params: { start_time, end_time },
    });
  }

  // POST order/list/user
  listUserOrders(param: number) {
    return this.request('post', `orders/user/${param}`);
  }

  // POST stats/user
  statsUser(login: string | number) {
    return this.request<BrokeretUserResponse>('post', 'stats/user', {
      data: { login },
    });
  }

  // === RISK MANAGEMENT ===
  

  // POST Risk/total/score
  riskTotalScore(login: string | number) {
    return this.request<BrokeretUserResponse>('post', 'Risk/total/score', {
      data: { login },
    });
  }

  // POST Risk/today/score
  riskTodayScore(login: string | number) {
    return this.request<BrokeretUserResponse>('post', 'Risk/today/score', {
      data: { login },
    });
  }

  // POST stats/prop
  statsProp(logins: Array<string | number>, model?: string) {
    const payload: any = { logins };
    if (model) payload.model = model;
    return this.request('post', 'stats/prop', {
      data: payload,
    });
  }

  // POST user/get
  getUser(login: string | number) {
    return this.request('post', 'user/get', { data: { login } });
  }

  // === Nuevos endpoints del flujo n8n ===

  // POST User/Create
  createUser(body: CreateUserDto) {
    return this.request<BrokeretUserResponse>('post', 'users/create', {
      data: body,
    });
  }

  // POST User/tradingactivity
  setTradingActivity(body: TradingActivityBody) {
    return this.request<BrokeretUserResponse>('post', 'User/tradingactivity', {
      data: body,
    });
  }

  // POST useraccount/balanceOperation
  balanceOperation(body: BalanceAccountDto) {
    return this.request<BrokeretUserResponse>(
      'post',
      'users/balance/operation',
      {
        data: body,
      },
    );
  }

  // POST get all user
  listAllUsers(body: BalanceAccountDto) {
    return this.request<BrokeretUserResponse>('get', 'users/all', {
      data: body,
    });
  }

  // POST enable / disable trading
  enableTrading(param: number) {
    return this.request<BrokeretUserResponse>(
      'post',
      `users/trading/enable/${param}`,
      {
        data: param,
      },
    );
  }
  disableTrading(param: number) {
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
  listPositionsAtRisk(marginLevelThreshold: number, lossThreshold: number) {
    return this.request('get', 'positions/at-risk', {
      params: {
        margin_level_threshold: marginLevelThreshold,
        loss_threshold: lossThreshold,
      },
    });
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
