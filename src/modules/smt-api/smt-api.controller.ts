import { Controller, Post, Param, Body, Get, UseGuards } from '@nestjs/common';
import { SmtApiService } from './smt-api.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConnectionStatusDto } from './dto/connection-data/connection.dto';
import { HybridAuth } from 'src/common/decorators/hybrid-auth.decorator';
import { AccountDataDto } from './dto/account-data/data.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiKeyGuard } from "./guards/api-key.guard"

// @HybridAuth()
@Public()
@ApiTags('SMT-API')
@Controller('/smt-api')
export class SmtApiController {
  constructor(private readonly smtApiService: SmtApiService) {}

  // @Get('/accounts')
  // @ApiOperation({ summary: 'List all accounts in buffer' })
  // async listAccounts() {
  //   return this.smtApiService.listAccounts();
  // }

  // @Get('/accounts/:accountId')
  // @ApiOperation({ summary: 'Get a specific account from buffer' })
  // @ApiResponse({ status: 404, description: 'Account not found' })
  // async getAccount(@Param('accountId') accountId: string) {
  //   return this.smtApiService.getAccount(accountId);
  // }

  @Post('/accounts/:accountId')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Ingest / update account data in buffer' })
  async ingestAccountData(
    @Param('accountId') accountId: string,
    @Body() data: AccountDataDto,
  ) {
    return this.smtApiService.saveDataAccountService(accountId, data);
  }
  
  @Post('/connection-status')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Receive connection status data' })
  @ApiResponse({
    status: 200,
    description: 'Connection status processed successfully',
  })
  async getConnectionStatus(@Body() data: ConnectionStatusDto) {
    return await this.smtApiService.connectionStatusService(data);
  }
}
