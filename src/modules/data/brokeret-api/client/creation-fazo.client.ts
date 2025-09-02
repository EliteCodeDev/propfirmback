import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { brokeretApiConfig } from 'src/config';
import { CreateUserDto } from '../dto/create-user.dto';
import { BalanceAccountDto } from '../dto/balance.dto';
import { AuthDto } from '../dto/auth.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { TokenResponse, CreateAccountResponse } from '../types/response.type';

export interface TradingActivityBody {
  login: string | number;
  tradingFlag: number; // 0 = disable, 1 = enable
}

@Injectable()
export class CreationFazoClient {
  private readonly logger = new Logger(CreationFazoClient.name);
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly TOKEN_DURATION_MINUTES = 15;

  constructor(
    private readonly http: HttpService,
    @Inject(brokeretApiConfig.KEY)
    private readonly cfg: ConfigType<typeof brokeretApiConfig>,
  ) {}

  private buildFazoUrl(path: string): string {
    const base = (this.cfg.creationApiUrl || '').replace(/\/+$/, '');
    const clean = path.replace(/^\/+/, '');
    this.logger.log(`Building Fazo URL: ${base}/${clean}`);
    return `${base}/${clean}`;
  }

  private buildHeaders(extra?: Record<string, string>) {
    const headerName = 'X-API-Key';
    return {
      'Content-Type': 'application/json',
      ...(this.cfg.apiKey ? { [headerName]: `${this.cfg.apiKey}` } : {}),
      ...extra,
    };
  }

  private buildFazoHeaders(includeAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private isTokenExpired(): boolean {
    if (!this.token || !this.tokenExpiry) {
      return true;
    }
    return new Date() >= this.tokenExpiry;
  }

  private async getToken(): Promise<string> {
    try {
      const authData: AuthDto = {
        userName: this.cfg.userCreationApi ,
        password: this.cfg.passCreationApi ,
      };

      this.logger.log('Autenticando con Brokeret usando credenciales del .env:', {
        userName: authData.userName,
        creationApiUrl: this.cfg.creationApiUrl,
      });

      const response = await firstValueFrom(
        this.http.post<TokenResponse>(
          this.buildFazoUrl('Home/token'),
          authData,
          { headers: this.buildFazoHeaders(false) },
        ),
      );

      this.token = response.data.token;
      this.tokenExpiry = new Date(
        Date.now() + this.TOKEN_DURATION_MINUTES * 60 * 1000,
      );

      this.logger.log('Token obtenido exitosamente');
      return this.token;
    } catch (error: any) {
      this.logger.error(
        'Error obteniendo token:',
        error?.response?.data || error.message,
      );
      throw error;
    }
  }

  private async ensureValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      this.logger.log('Token expirado o no existe, obteniendo nuevo token...');
      return await this.getToken();
    }
    return this.token!;
  }

  private async requestWithAuth<T = any>(
    method: AxiosRequestConfig['method'],
    path: string,
    data?: any,
    retryOnUnauthorized = true,
  ): Promise<T> {
    await this.ensureValidToken();

    try {
      const response = await firstValueFrom(
        this.http.request<T>({
          method,
          url: this.buildFazoUrl(path),
          data,
          headers: this.buildFazoHeaders(true),
        }),
      );
      return response.data;
    } catch (error: any) {
      // Si es 401 (Unauthorized) y podemos reintentar, obtenemos nuevo token
      if (error?.response?.status === 401 && retryOnUnauthorized) {
        this.logger.warn('Token no autorizado, obteniendo nuevo token...');
        await this.getToken();
        return this.requestWithAuth<T>(method, path, data, false); // Reintento sin más reintentos
      }

      this.logger.error(
        `HTTP ${method?.toUpperCase()} ${this.buildFazoUrl(path)} falló: ${error?.response?.status} ${JSON.stringify(error?.response?.data || error.message)}`,
      );
      throw error;
    }
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
    const url = this.buildFazoUrl(path);
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

  // === Nuevos endpoints de Fazo ===

  async authenticate(authData: AuthDto): Promise<TokenResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<TokenResponse>(
          this.buildFazoUrl('Home/token'),
          authData,
          { headers: this.buildFazoHeaders(false) },
        ),
      );

      this.token = response.data.token;
      this.tokenExpiry = new Date(
        Date.now() + this.TOKEN_DURATION_MINUTES * 60 * 1000,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error en autenticación:',
        error?.response?.data || error.message,
      );
      throw error;
    }
  }

  async createAccount(
    accountData: CreateAccountDto,
  ): Promise<CreateAccountResponse> {
    this.logger.log('Creating account with data:', {
      accountData,
      config: {
        creationApiUrl: this.cfg.creationApiUrl,
        hasApiKey: !!this.cfg.apiKey,
        userCreationApi: this.cfg.userCreationApi,
        passCreationApi: this.cfg.passCreationApi,
      },
    });
    
    try {
      const response = await this.requestWithAuth<CreateAccountResponse>(
        'post',
        'Home/createAccount',
        accountData,
      );
      this.logger.log('Account creation response:', response);
      return response;
    } catch (error: any) {
      this.logger.error('Error creating account:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
      throw error;
    }
  }

  // === Endpoints detectados en el flujo n8n (Brokeret) ===

  // === Nuevos endpoints del flujo n8n ===

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
