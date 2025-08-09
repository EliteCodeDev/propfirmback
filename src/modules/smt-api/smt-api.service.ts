import { Injectable } from '@nestjs/common';

@Injectable()
export class SmtApiService {
  async handleIngestionAccount(data: any) {
    // logica para guardar la data en el buffer
  }
  async loginToAccount(accountId: string, credentials: any) {
    // logica para iniciar sesion en la cuenta en la api
  }
  async loginToAccounts(accountIds: string[], credentials: any) {
    // logica para iniciar sesion en varias cuentas en la api
  }
}
