import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { SmtApiService } from './smt-api.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  AccountIngestPartialDto,
  AccountResponseDto,
} from './dto/account-ingest.dto';
import { AccountIngestPayloadDto } from './dto/account-ingest.dto';
import { ConnectionStatusDto } from './dto/connection-status.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
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
  @ApiResponse({
    status: 201,
    description: 'Account ingested/updated',
    type: AccountResponseDto,
  })
  @ApiBody({
    type: AccountIngestPayloadDto,
    examples: {
      basic: {
        summary: 'Minimal payload',
        value: { balance: 1000, equity: 980 },
      },
      full: {
        summary: 'Full payload',
        value: {
          userID: 'user-123',
          balance: 12000.5,
          equity: 11890.2,
          metaStats: { dailyPnL: -50, maxDrawdownPct: 3.2 },
          validation: { breaches: [], updatedAt: new Date().toISOString() },
          openPositions: {
            open: [
              { ticket: '12345', symbol: 'EURUSD', volume: 1, profit: 25.4 },
            ],
            ResumePositionOpen: { totalVolume: 1, totalProfit: 25.4 },
          },
          closedPositions: {
            closed: [
              { ticket: '54321', symbol: 'GBPUSD', volume: 1, profit: -10 },
            ],
            ResumePositionClose: { totalVolume: 1, totalProfit: -10 },
          },
        },
      },
    },
  })
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
  @ApiBody({
    type: ConnectionStatusDto,
    examples: {
      basic: {
        summary: 'Connection status example',
        value: {
          success_process: [
            {
              user: 'user123',
              status: 200,
              error: null
            }
          ],
          error_process: [
            {
              user: 'user456',
              status: 500,
              error: 'Connection failed'
            }
          ],
          status: 200,
          message: 'Success session'
        }
      }
    }
  })
  async getConnectionStatus(@Body() params: ConnectionStatusDto) {
    // TODO: Implementar lógica para procesar el estado de conexión
    return {
      message: 'Connection status received',
      data: params
    };
  }
}
