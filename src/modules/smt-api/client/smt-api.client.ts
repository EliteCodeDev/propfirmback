import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { smtApiConfig } from 'src/config';

interface AuthResponse {
  token: string;
  expiresIn?: number;
  user?: any;
}

interface UserResponse {
  id: string;
  login: string;
  balance?: number;
  [k: string]: any;
}

@Injectable()
export class SmtApiClient {
  private readonly logger = new Logger(SmtApiClient.name);
  constructor(
    private readonly http: HttpService,
    @Inject(smtApiConfig.KEY)
    private readonly cfg: ConfigType<typeof smtApiConfig>,
  ) {}

  private buildUrl(path: string): string {
    return `${this.cfg.url?.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private buildHeaders(extra?: Record<string, string>) {
    const headerName = this.cfg.authHeader || 'Authorization';
    return {
      'Content-Type': 'application/json',
      ...(this.cfg.apiKey ? { [headerName]: `Bearer ${this.cfg.apiKey}` } : {}),
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
      return res.data;
    } catch (err: any) {
      if (!options.silent) {
        this.logger.error(
          `HTTP ${method?.toUpperCase()} ${url} fallo: ${err?.response?.status} ${JSON.stringify(err?.response?.data || err.message)}`,
        );
      }
      throw err;
    }
  }

  // ==== MT4 Auth ====
  async mt4Login(credentials: {
    login: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request('post', '/mt4/auth/login', { data: credentials });
  }

  // ==== MT5 Auth ====
  async mt5Login(credentials: {
    login: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request('post', '/mt5/auth/login', { data: credentials });
  }

  // ==== MT4 User ====
  async mt4GetUser(login: string): Promise<UserResponse> {
    return this.request('get', `/mt4/user/${login}`);
  }

  // ==== MT5 User ====
  async mt5GetUser(login: string): Promise<UserResponse> {
    return this.request('get', `/mt5/user/${login}`);
  }

  // Ejemplo para posiciones (si existe)
  async mt5GetPositions(params?: { login?: string }) {
    return this.request('get', '/mt5/user/positions', { params });
  }

  // Método genérico para endpoints no modelados aún
  async raw<T = any>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: any,
    params?: any,
  ) {
    return this.request<T>(method, path, { data, params });
  }
}
