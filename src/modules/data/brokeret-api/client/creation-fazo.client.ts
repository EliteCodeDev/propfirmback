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
import { DepositDto } from '../dto/deposit.dto';
import { string } from 'joi';

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
  ) { }

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
        userName: this.cfg.userCreationApi,
        password: this.cfg.passCreationApi,
      };

      this.logger.log(
        'Autenticando con Brokeret usando credenciales del .env:',
        {
          userName: authData.userName,
          creationApiUrl: this.cfg.creationApiUrl,
        },
      );

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
      const config: AxiosRequestConfig = {
        method,
        url: this.buildFazoUrl(path),
        headers: {
          ...this.buildFazoHeaders(true),
          'Content-Type': 'application/json',
        },
        responseType: 'json',
      };

      // 🚫 Solo agrega body si no es GET
      if (method !== 'get' && data !== undefined) {
        config.data = typeof data === 'object' ? JSON.stringify(data) : data;
      }

      const response = await firstValueFrom(this.http.request<T>(config));
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401 && retryOnUnauthorized) {
        this.logger.warn('Token expirado/no autorizado, renovando...');
        await this.getToken();
        return this.requestWithAuth<T>(method, path, data, false);
      }

      this.logger.error('[FAZO ERROR]', {
        url: this.buildFazoUrl(path),
        method,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        sentData: data,
        receivedData: error?.response?.data,
      });

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
  private isManagerConnected = false;

  async connectToManager(): Promise<any> {
    if (this.isManagerConnected) {
      this.logger.debug('Manager ya conectado, omitiendo reconexión.');
      return;
    }

    const managerData = {
      mngId: 2013,
      pwd: 'N_UmMbG3',
      srvIp: '185.56.137.162:443', // sin :443
    };

    await this.ensureValidToken();

    try {
      const response = await firstValueFrom(
        this.http.post(
          this.buildFazoUrl('Home/login'),
          managerData,
          { headers: this.buildFazoHeaders(true) },
        ),
      );

      this.logger.log('Conectado correctamente al Manager:', response.data);
      this.isManagerConnected = true; // ✅ marcar como conectado
      return response.data;
    } catch (error: any) {
      this.isManagerConnected = false;
      this.logger.error('Error conectando al Manager:', error?.response?.data || error.message);
      throw error;
    }
  }



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
      await this.ensureValidToken(); // obtiene token si no lo hay
      await this.connectToManager(); // se conecta al Manager MT5

      // 🔹 Crear la cuenta primero
      const response = await this.requestWithAuth<CreateAccountResponse>(
        'post',
        'Home/createAccount',
        accountData,
      );

      this.logger.log('Account creation response:', response);

      // 🔹 Si se creó correctamente, hacer el depósito inicial
      if (response?.user?.accountid) {
        const depositData: DepositDto = {
          loginid: response.user.accountid,
          amount: accountData.balance,
          txnType: 0,
          description: 'Depósito inicial',
          comment: 'Saldo inicial asignado automáticamente',
        };

        this.logger.log('Realizando depósito inicial con balanceOP:', depositData);

        const depositResponse = await this.makeDeposit(depositData);
        this.logger.log('Deposit response:', depositResponse);
      } else {
        this.logger.warn('No se encontró accountid en la respuesta de creación de cuenta.');
      }

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

  async makeDeposit(depositData: DepositDto): Promise<{
    message: string;
    result: string;
  }> {
    await this.ensureValidToken();
    await this.connectToManager(); // 🔹 asegúrate de reconectar siempre
    this.logger.log('Ejecutando depósito en Fazo:', depositData);
    return this.requestWithAuth('post', 'Home/balanceOP', depositData);
  }

  // === Nuevos endpoints de la API Fazo ===

  /**
   * Obtiene la posición de un usuario por su loginId
   */
  async getPosition(loginId: number): Promise<any> {
    await this.ensureValidToken();

    // 🔁 fuerza reconexión al manager en cada request
    this.isManagerConnected = false;
    await this.connectToManager();

    try {
      const response = await this.requestWithAuth('get', `Home/getPosition/${loginId}`);
      return response;
    } catch (error: any) {
      // ⚠️ Si la sesión expira, reintenta una vez
      if (error?.response?.status === 401) {
        this.logger.warn('Sesión del Manager expirada, reintentando...');
        this.isManagerConnected = false;
        await this.connectToManager();
        return this.requestWithAuth('get', `Home/getPosition/${loginId}`);
      }

      this.logger.error('Error al obtener posiciones FAZO:', error?.response?.data || error.message);
      throw error;
    }
  }


  /**
 * Obtiene el historial completo de operaciones (tradehistory) desde FAZO.
 * ⚙️ No requiere parámetros: solo token y conexión activa al Manager.
 */
  /**
 * Obtiene el historial completo de operaciones (tradehistory) desde FAZO.
 * Requiere loginId, startDate y endDate en el body.
 */
  async getTradeHistory(tradeHistoryData: {
    loginId: number;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    await this.ensureValidToken();

    // 🔁 Fuerza reconexión al manager antes de cada llamada
    this.isManagerConnected = false;
    await this.connectToManager();

    try {
      this.logger.debug(
        `Solicitando historial de operaciones (Home/tradehistory) con body=${JSON.stringify(tradeHistoryData)}`
      );

      const response = await this.requestWithAuth(
        'post',
        'Home/tradehistory',
        tradeHistoryData
      );

      // ⚠️ Si FAZO devuelve mensaje interno de desconexión, reconectar y reintentar
      if (response?.result?.toLowerCase?.().includes('manager disconnectioned')) {
        this.logger.warn('⚠️ Manager desconectado durante tradehistory, reconectando...');
        this.isManagerConnected = false;
        await this.connectToManager();
        return this.requestWithAuth('post', 'Home/tradehistory', tradeHistoryData);
      }

      this.logger.debug('Historial obtenido correctamente:', response);
      return response;
    } catch (error: any) {
      // ⚠️ Si expira el token o manager, reintenta una vez
      if (error?.response?.status === 401) {
        this.logger.warn('Sesión expirada en tradehistory, reintentando...');
        this.isManagerConnected = false;
        await this.connectToManager();
        return this.requestWithAuth('post', 'Home/tradehistory', tradeHistoryData);
      }

      // ⚠️ Si el error viene en el cuerpo
      if (error?.response?.data?.result?.toLowerCase?.().includes('manager disconnectioned')) {
        this.logger.warn('Manager desconectado (detectado en error.response.data), reintentando...');
        this.isManagerConnected = false;
        await this.connectToManager();
        return this.requestWithAuth('post', 'Home/tradehistory', tradeHistoryData);
      }

      this.logger.error('Error al obtener tradehistory FAZO:', error?.response?.data || error.message);
      throw error;
    }
  }


  /**
 * ✅ Obtiene la información de todas las cuentas conectadas al servidor FAZO (balance, equity, etc.)
 * Método oficial: GET /Home/getAllAccountInfos
 * Requiere token válido + conexión activa al Manager.
 */
  async getAllAccountInfos(): Promise<any[]> {
    await this.ensureValidToken();

    // 🔁 Si el manager no está conectado, conéctalo
    if (!this.isManagerConnected) {
      this.logger.debug('Manager desconectado. Conectando antes de getAllAccountInfos...');
      await this.connectToManager();
    }

    try {
      this.logger.debug('📡 Solicitando información de todas las cuentas (GET /Home/getAllAccountInfos)...');
      const response = await this.requestWithAuth('get', 'Home/getAllAccountInfos');

      // 🧩 Normalizar la respuesta: FAZO devuelve un array plano o un objeto con data/result
      const data = Array.isArray(response)
        ? response
        : response?.data ?? response?.result ?? [];

      if (!Array.isArray(data)) {
        this.logger.warn('⚠️ Respuesta inesperada de getAllAccountInfos:', response);
        return [];
      }

      this.logger.debug(`✅ getAllAccountInfos: ${data.length} cuentas recibidas.`);
      this.isManagerConnected = true;
      return data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        this.logger.warn('⚠️ Token o sesión del manager expirada en getAllAccountInfos, reintentando...');
        await this.getToken();
        this.isManagerConnected = false;
        await this.connectToManager();
        return this.getAllAccountInfos();
      }

      if (error?.response?.data?.result?.toLowerCase?.().includes('manager disconnectioned')) {
        this.logger.warn('⚠️ Manager desconectado en getAllAccountInfos, reintentando...');
        this.isManagerConnected = false;
        await this.connectToManager();
        return this.getAllAccountInfos();
      }

      this.logger.error('❌ Error al obtener todas las cuentas desde FAZO:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error.message,
      });
      throw error;
    }
  }


  /**
   * Obtiene la información de un usuario por su loginId
   */
  async getUserInfo(loginId: number): Promise<any> {
    return this.requestWithAuth('get', `Home/getUserInfo/${loginId}`);
  }

  /**
   * Habilita o deshabilita el trading para un usuario
   */
  async tradeDisable(tradePermissionData: {
    loginId: number;
    flag: boolean;
  }): Promise<any> {
    return this.requestWithAuth('post', 'Home/tradeDisable', tradePermissionData);
  }

  /**
   * Obtiene las órdenes pendientes de un usuario por su loginId
   */
  async getPendingOrder(loginId: number): Promise<any> {
    return this.requestWithAuth('get', `Home/getPendingOrder/${loginId}`);
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
