import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BufferApiService } from './buffer-api.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConnectionStatusDto } from './dto/connection-status.dto';
import { AccountDataDto } from './dto/account-data.dto';
import { GenericApiKeyGuard } from 'src/common/guards/generic-api-key.guard';
import { ApiKeyService } from 'src/common/decorators/api-key-service.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@ApiTags('Buffer-API')
@Controller('/buffer')
// @UseGuards(GenericApiKeyGuard)
// @ApiKeyService('buffer')
export class BufferController {
  constructor(private readonly bufferApiService: BufferApiService) {}

  @Get('/accounts')
  @ApiOperation({ summary: 'List all accounts in buffer' })
  @ApiResponse({ status: 200, description: 'List of all accounts in buffer' })
  async listAccounts() {
    return this.bufferApiService.listAccounts();
  }

  @Get('/accounts/:accountId')
  @ApiOperation({ summary: 'Get a specific account from buffer' })
  @ApiResponse({
    status: 200,
    description: 'Account data retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(@Param('accountId') accountId: string) {
    return this.bufferApiService.getAccount(accountId);
  }

  @Get('/stats')
  @ApiOperation({ summary: 'Get buffer statistics' })
  @ApiResponse({
    status: 200,
    description: 'Buffer statistics retrieved successfully',
  })
  async getBufferStats() {
    return this.bufferApiService.getStats();
  }

  @Delete('/accounts/:accountId')
  @ApiOperation({ summary: 'Delete a specific account from buffer' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deleteAccount(@Param('accountId') accountId: string) {
    return this.bufferApiService.deleteAccount(accountId);
  }

  @Post('/accounts/:accountId')
  @ApiOperation({ summary: 'Ingest / update account data in buffer' })
  @ApiResponse({
    status: 200,
    description: 'Account data processed successfully',
  })
  async ingestAccountData(
    @Param('accountId') accountId: string,
    @Body() data: any,
  ) {
    // El BufferApiService ahora es genérico y requiere datos ya transformados
    // Este endpoint debería ser usado por servicios específicos que ya transformaron los datos
    const accountData = {
      login: accountId,
      ...data,
    };
    return this.bufferApiService.ingestAccount(accountData);
  }

  @Post('/connection-status')
  @ApiOperation({ summary: 'Receive connection status data' })
  @ApiResponse({
    status: 200,
    description: 'Connection status processed successfully',
  })
  async getConnectionStatus(@Body() data: ConnectionStatusDto) {
    // El manejo de connection status ahora es responsabilidad de cada proveedor específico
    // Este endpoint genérico solo registra la recepción
    return {
      message: 'Connection status received by generic buffer controller',
      status: 200,
      timestamp: new Date().toISOString(),
      data: data,
    };
  }
}
