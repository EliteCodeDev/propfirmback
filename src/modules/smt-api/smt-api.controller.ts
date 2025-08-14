import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { SmtApiService } from './smt-api.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AccountIngestPartialDto,
  AccountResponseDto,
} from './dto/account-ingest.dto';
import { AccountIngestPayloadDto } from './dto/account-ingest.dto';
import { ConnectionStatusDto } from './dto/connection-status.dto';
import { HybridAuth } from 'src/common/decorators/hybrid-auth.decorator';
import { AccountDataDto } from './dto/account-data/data.dto';
import { Public } from 'src/common/decorators/public.decorator';

// @HybridAuth()
@Public()
@ApiTags('SMT-API')
@Controller('/smt-api')
export class SmtApiController {
  constructor(private readonly smtApiService: SmtApiService) {}

  @Get('/accounts')
  @ApiOperation({ summary: 'List all accounts in buffer' })
  @ApiResponse({
    status: 200,
    description: 'Accounts list returned',
    type: [AccountResponseDto],
  })
  async listAccounts() {
    return this.smtApiService.listAccounts();
  }

  @Get('/accounts/:accountId')
  @ApiOperation({ summary: 'Get a specific account from buffer' })
  @ApiResponse({
    status: 200,
    description: 'Account found',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('accountId') accountId: string) {
    return this.smtApiService.getAccount(accountId);
  }

  
  @Post('/accounts/:accountId')
  @ApiOperation({ summary: 'Ingest / update account data in buffer' })
  async ingestAccountData(
    @Param('accountId') accountId: string,
    @Body() data: AccountDataDto,
  ) {
    return this.smtApiService.saveDataAccountService(accountId, data);
  }


  @Post('/connection-status')
  @ApiOperation({ summary: 'Receive connection status data' })
  @ApiResponse({
    status: 200,
    description: 'Connection status processed successfully',
  })
  async getConnectionStatus(@Body() data: any) {
    return await this.smtApiService.connectionStatusService(data);
  }
}
