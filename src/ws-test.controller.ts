import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WSTestGateway } from './ws-test.gateway';

@ApiTags('WebSocket Data')
@Controller('ws-test')
export class WSTestController {
  constructor(private readonly wsGateway: WSTestGateway) {}

  @Get('data')
  @ApiOperation({
    summary: 'Ver datos recibidos de los WebSockets',
    description: 'Devuelve el último mensaje recibido de cada tipo de conexión (pos, account, deal).',
  })
  @ApiResponse({ status: 200, description: 'Datos actuales de las conexiones.' })
  getData() {
    return this.wsGateway.getStatus();
  }
}
