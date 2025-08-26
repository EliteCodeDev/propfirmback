import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { brokeretApiConfig } from 'src/config';
import { CreateUserDto } from '../dto/create-user.dto';
import { BalanceAccountDto } from '../dto/balance.dto';

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

  // === Endpoints detectados en el flujo n8n (Brokeret) ===

  // POST position/list/open
  listOpenPositions(param: number) {
    return this.request('get', `positions/user/${param}`);
  }

  // POST position/list/closed
  listClosedPositions(param: number) {
    return this.request('post', `positions/close/${param}`);
  }

  // POST order/list/user
  listUserOrders(body: OrdersListBody) {
    return this.request('post', 'order/list/user', { data: body });
  }

  // POST stats/user
  statsUser(login: string | number) {
    return this.request<BrokeretUserResponse>('post', 'stats/user', {
      data: { login },
    });
  }

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
