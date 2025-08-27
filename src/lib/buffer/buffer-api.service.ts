import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BufferService } from './buffer.service';
import { Account } from 'src/common/utils/account';

@Injectable()
export class BufferApiService {
  private readonly logger = new Logger(BufferApiService.name);

  constructor(
    private readonly bufferService: BufferService,
  ) {}

  /**
   * Obtiene una cuenta específica del buffer de forma thread-safe
   */
  async getAccount(login: string) {
    const account = await this.bufferService.getSnapshot(login);
    if (!account) {
      this.logger.debug(`[getAccount] login=${login} not-found`);
      throw new NotFoundException(`Account ${login} not found in buffer`);
    }
    this.logger.debug(`[getAccount] login=${login} found`);
    return { login, ...account };
  }

  /**
   * Lista todas las cuentas del buffer de forma thread-safe
   */
  async listAccounts() {
    const entries = await this.bufferService.listEntries();
    const mapped = entries.map(([login, account]) => ({ login, ...account }));
    this.logger.debug(`[listAccounts] returned=${mapped.length}`);
    return {
      total: mapped.length,
      accounts: mapped,
    };
  }

  /**
   * Obtiene estadísticas del buffer
   */
  async getStats() {
    const stats = this.bufferService.getStats();
    this.logger.debug(
      `[getBufferStats] bufferSize=${stats.bufferSize} activeLocks=${stats.mutexStats.activeLocks}`,
    );
    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ingesta una cuenta transformada al buffer de forma thread-safe
   */
  async ingestAccount(accountData: Partial<Account> & { login: string }) {
    this.logger.debug(`[ingestAccount] login=${accountData.login}`);

    const result = await this.bufferService.upsertAccount(
      accountData.login,
      (prev) => {
        const base: Account = prev || ({} as Account);
        return {
          ...base,
          ...accountData,
          lastUpdate: new Date(),
        } as Account;
      },
    );

    this.logger.debug(
      `[ingestAccount] stored login=${accountData.login} balance=${result.balance} equity=${result.equity}`,
    );
    return result;
  }



  /**
   * Elimina una cuenta del buffer de forma thread-safe
   */
  async deleteAccount(login: string) {
    const deleted = await this.bufferService.deleteAccount(login);
    if (!deleted) {
      this.logger.debug(`[deleteAccount] login=${login} not-found`);
      throw new NotFoundException(`Account ${login} not found in buffer`);
    }
    this.logger.debug(`[deleteAccount] login=${login} deleted`);
    return { success: true, login };
  }


}