import { Injectable, NotFoundException } from '@nestjs/common';
import { BufferService } from '../../lib/buffer.service';
import { Account } from '../../common/utils/account';

@Injectable()
export class SmtApiService {
  constructor(private readonly buffer: BufferService) {}

  async handleIngestionAccount(data: Partial<Account> & { login: string }) {
    return this.buffer.upsertAccount(data.login, (prev) => {
      const base: Account = prev || ({} as Account);
      return { ...base, ...data } as Account;
    });
  }
  async loginToAccount(accountId: string, credentials: any) {
    // logica para iniciar sesion en la cuenta en la api
  }
  async loginToAccounts(accountIds: string[], credentials: any) {
    // logica para iniciar sesion en varias cuentas en la api
  }

  async getAccount(login: string) {
    const acc = await this.buffer.getAccount(login);
    if (!acc)
      throw new NotFoundException(`Account ${login} not found in buffer`);
    return acc;
  }

  async listAccounts() {
    const entries = await this.buffer.listEntries();
    return entries.map(([login, account]) => ({ login, ...account }));
  }
}
