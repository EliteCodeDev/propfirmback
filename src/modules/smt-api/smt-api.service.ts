import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import { ConnectionStatusDto } from './dto/connection-data/connection.dto';
import { AccountDataDto } from './dto/account-data/data.dto';
import { AccountDataTransformPipe } from './pipes/account-data-transform.pipe';

@Injectable()
export class SmtApiService {
  private readonly logger = new Logger(SmtApiService.name);

  constructor(
    private readonly bufferService: BufferService,
    private readonly accountDataTransformPipe: AccountDataTransformPipe,
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
   * Maneja la ingesta de datos de cuenta de forma thread-safe
   */
  async handleIngestionAccount(data: Partial<Account> & { login: string }) {
    this.logger.debug(`[handleIngestionAccount] login=${data.login}`);

    const result = await this.bufferService.upsertAccount(
      data.login,
      (prev) => {
        const base: Account = prev || ({} as Account);
        return {
          ...base,
          ...data,
          lastUpdate: new Date(),
        } as Account;
      },
    );

    this.logger.debug(
      `[handleIngestionAccount] stored login=${data.login} balance=${result.balance} equity=${result.equity}`,
    );
    return result;
  }

  /**
   * Procesa datos de cuenta entrantes y los almacena en el buffer
   */
  async ingestAccountData(data: AccountDataDto, accountId: string) {
    // Usar el login del DTO si está disponible
    const login = accountId;
    const account = data;

    this.logger.debug(`[ingestAccountData] received data for login=${login}`);

    try {
      await this.saveAccountDataToBuffer(account, login);
      await this.persistAccountDataToFile(account, login);

      this.logger.debug(
        `[ingestAccountData] successfully processed login=${login}`,
      );
      return { success: true, login };
    } catch (error) {
      this.logger.error(
        `[ingestAccountData] error processing login=${login}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Guarda los datos de cuenta en el buffer de forma thread-safe
   */
  private async saveAccountDataToBuffer(data: AccountDataDto, login: string) {
    this.logger.debug(`[saveAccountDataToBuffer] login=${login}`);

    // Usar el pipe de transformación para convertir los datos
    const account = this.accountDataTransformPipe.transform(data, login);

    await this.handleIngestionAccount(account);
  }

  /**
   * Persiste los datos de cuenta en archivo
   */
  private async persistAccountDataToFile(data: AccountDataDto, login: string) {
    const filePath = path.join(
      process.cwd(),
      'data',
      'accounts',
      `${login}.json`,
    );
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Agregar el login a los datos antes de guardar
    const dataToSave = {
      login,
      timestamp: new Date().toISOString(),
      ...data,
    };

    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
    this.logger.debug(`[persistAccountDataToFile] saved to ${filePath}`);
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

  async connectionStatusService(data: ConnectionStatusDto) {
    const { success_process } = data;

    console.log('Cuentas success_process', data.success_process);

    return {
      message: 'Connection status received',
      status: 200,
    };
  }

  async saveDataAccountService(id: string, data: AccountDataDto) {
    // const { close, open } = data.data;

    // const account = this.buffer.getBuffer(id);

    // account.setOpenPositions(open.positions);
    // account.setOpenResume(open.resume);
    // account.setClosedPositions(close.positions);
    // account.setClosedResume(close.resume);

    console.log('Data account: ', JSON.stringify(data, null, 2));

    // Provisional: guardar data en src/examples/accountData.ts
    // try {
    //   const examplesDir = path.join(process.cwd(), 'src', 'examples');
    //   const filePath = path.join(examplesDir, 'accountData.ts');

    //   await fs.mkdir(examplesDir, { recursive: true });

    //   const fileHeader = `/* Auto-generated by SmtApiService.saveDataAccountService on ${new Date().toISOString()} */\n`;
    //   const payload = { id, data };
    //   const fileBody = `export default ${JSON.stringify(payload, null, 2)} as const;\n`;

    //   await fs.writeFile(filePath, fileHeader + fileBody, 'utf8');
    //   this.logger.debug(`[saveDataAccountService] Data escrita en ${filePath}`);
    // } catch (err) {
    //   const stack = err instanceof Error ? err.stack : String(err);
    //   this.logger.error(
    //     '[saveDataAccountService] Error al escribir accountData.ts',
    //     stack,
    //   );
    // }
    return {
      message: 'Account data received',
      status: 200,
    };
  }
}
