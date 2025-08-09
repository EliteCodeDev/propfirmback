import { Injectable } from '@nestjs/common';
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
}
