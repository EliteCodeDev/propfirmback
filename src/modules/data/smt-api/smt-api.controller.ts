import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SmtApiService } from './smt-api.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConnectionStatusDto } from './dto/connection-data/connection.dto';
import { AccountDataDto } from './dto/account-data/data.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { GenericApiKeyGuard } from 'src/common/guards/generic-api-key.guard';
import { ApiKeyService } from 'src/common/decorators/api-key-service.decorator';

// @HybridAuth()
@Public()
@ApiTags('SMT-API')
@Controller('/smt-api')
@UseGuards(GenericApiKeyGuard)
@ApiKeyService('smt')
export class SmtApiController {
  constructor(private readonly smtApiService: SmtApiService) {}

  @Get('/accounts')
  @ApiOperation({ summary: 'List all accounts in buffer' })
  @ApiResponse({ status: 200, description: 'List of all accounts in buffer' })
  async listAccounts() {
    return this.smtApiService.listAccounts();
  }

  @Get('/accounts/:accountId')
  @ApiOperation({ summary: 'Get a specific account from buffer' })
  @ApiResponse({
    status: 200,
    description: 'Account data retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('accountId') accountId: string) {
    return this.smtApiService.getAccount(accountId);
  }

  @Get('/buffer/stats')
  @ApiOperation({ summary: 'Get buffer statistics' })
  @ApiResponse({
    status: 200,
    description: 'Buffer statistics retrieved successfully',
  })
  async getBufferStats() {
    return this.smtApiService.getStats();
  }

  @Delete('/accounts/:accountId')
  @ApiOperation({ summary: 'Delete a specific account from buffer' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deleteAccount(@Param('accountId') accountId: string) {
    return this.smtApiService.deleteAccount(accountId);
  }

  @Post('/accounts/:accountId')
  @ApiOperation({ summary: 'Ingest / update account data in buffer' })
  @ApiResponse({
    status: 200,
    description: 'Account data processed successfully',
  })
  async ingestAccountData(
    @Param('accountId') accountId: string,
    @Body() data: AccountDataDto,
  ) {
    // Asegurar que el login coincida con el parámetro de la URL
    return this.smtApiService.ingestAccountData(data, accountId);
  }

  @Post('/connection-status')
  @ApiOperation({ summary: 'Receive connection status data' })
  @ApiResponse({
    status: 200,
    description: 'Connection status processed successfully',
  })
  async getConnectionStatus(@Body() data: ConnectionStatusDto) {
    return await this.smtApiService.connectionStatusService(data);
  }
}
