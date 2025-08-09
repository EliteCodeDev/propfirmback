import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { SmtApiService } from './smt-api.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('SMT-API')
@Controller('smt-api')
export class SmtApiController {
  constructor(private readonly smtApiService: SmtApiService) {}

  @Get('/accounts')
  @ApiOperation({ summary: 'List all accounts in buffer' })
  @ApiResponse({ status: 200, description: 'Accounts list returned' })
  async listAccounts() {
    return this.smtApiService.listAccounts();
  }

  @Get('/accounts/:accountId')
  @ApiOperation({ summary: 'Get a specific account from buffer' })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('accountId') accountId: string) {
    return this.smtApiService.getAccount(accountId);
  }

  @Post('/accounts/:accountId')
  @ApiOperation({ summary: 'Ingest / update account data in buffer' })
  @ApiResponse({ status: 201, description: 'Account ingested/updated' })
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
