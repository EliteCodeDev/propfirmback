import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { SmtApiService } from './smt-api.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  AccountIngestPartialDto,
  AccountResponseDto,
} from './dto/account-ingest.dto';
import { AccountIngestPayloadDto } from './dto/account-ingest.dto';
import { ConnectionStatusDto } from './dto/connection-status.dto';
import { HybridAuth } from 'src/common/decorators/hybrid-auth.decorator';

@HybridAuth() // Permite tanto JWT como API key
@ApiTags('SMT-API')
@Controller('smt-api')
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
  // @Public()
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
    @Body() data: AccountIngestPayloadDto,
  ) {
    // Normalizar para que cumpla con la interfaz interna Account
    const payload: any = { ...data };
    if (payload.openPositions) {
      payload.openPositions = {
        open: payload.openPositions.open || [],
        ResumePositionOpen:
          payload.openPositions.ResumePositionOpen || ({} as any),
      };
    }
    if (payload.closedPositions) {
      payload.closedPositions = {
        closed: payload.closedPositions.closed || [],
        ResumePositionClose:
          payload.closedPositions.ResumePositionClose || ({} as any),
      };
    }
    return this.smtApiService.handleIngestionAccount({
      login: accountId,
      ...payload,
    });
  }

  @Post('/connection-status')
  @ApiOperation({ summary: 'Receive connection status data' })
  @ApiResponse({
    status: 200,
    description: 'Connection status processed successfully',
  })

  
  async getConnectionStatus(@Body() params: ConnectionStatusDto) {
    // TODO: Implement logic to process connection status
    return {
      message: 'Connection status received',
      data: params,
    };
  }
}
