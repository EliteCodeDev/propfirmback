import { Controller, Post, Param, Body } from '@nestjs/common';
import { SmtApiService } from './smt-api.service';

@Controller('smt-api')
export class SmtApiController {
  constructor(private readonly smtApiService: SmtApiService) {}
  @Post('/accounts/:accountId')
  async ingestAccountData(
    @Param('accountId') accountId: string,
    @Body() data: any,
  ) {
    return this.smtApiService.handleIngestionAccount({
      login: accountId,
      ...data,
    });
  }
}
