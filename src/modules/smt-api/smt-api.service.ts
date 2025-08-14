import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import { DataProcessDto, ConnectionStatusDto } from './dto/connection-status.dto';
import { AccountDataDto } from './dto/account-data/data.dto';

@Injectable()
export class SmtApiService {
  private readonly logger = new Logger(SmtApiService.name);
  constructor(private readonly buffer: BufferService) {}

  // async handleIngestionAccount(data: Partial<Account> & { login: string }) {
  //   this.logger.debug(`[handleIngestionAccount] login=${data.login}`);
  //   const result = await this.buffer.upsertAccount(data.login, (prev) => {
  //     const base: Account = prev || ({} as Account);
  //     return { ...base, ...data } as Account;
  //   });
  //   this.logger.debug(
  //     `[handleIngestionAccount] stored login=${data.login} balance=${result.balance} equity=${result.equity}`,
  //   );
  //   return result;
  // }
  // }
  async handleIngestionAccount(data: any) {
    this.logger.debug(`[handleIngestionAccount] login=${data}`);
  }
  async loginToAccount(accountId: string, credentials: any) {
    // logica para iniciar sesion en la cuenta en la api
  }
  async loginToAccounts(accountIds: string[], credentials: any) {
    // logica para iniciar sesion en varias cuentas en la api
  }

  async getAccount(login: string) {
    const acc = await this.buffer.getAccount(login);
    if (!acc) {
      this.logger.debug(`[getAccount] login=${login} not-found`);
      throw new NotFoundException(`Account ${login} not found in buffer`);
    }
    this.logger.debug(`[getAccount] login=${login} found`);
    return acc;
  }

  async listAccounts() {
    const entries = await this.buffer.listEntries();
    const mapped = entries.map(([login, account]) => ({ login, ...account }));
    this.logger.debug(`[listAccounts] returned=${mapped.length}`);
    return mapped;
  }

  async connectionStatusService(data: ConnectionStatusDto) {
    console.log('ConnectionStatusDto received:', data);
    return {
      message: 'Connection status received',
      status: 200
    }
  }

  async saveDataAccountService(id: string, data: AccountDataDto) {
    console.log('AccountDataDto received:', id, data);
    return {
      message: 'Account data received',
      status: 200
    }
  }
}
