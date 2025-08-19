import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GenericApiKeyGuard } from 'src/common/guards/generic-api-key.guard';
import { ApiKeyService } from 'src/common/decorators/api-key-service.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@ApiTags('N8N Webhooks')
@Controller('n8n-webhooks')
@UseGuards(GenericApiKeyGuard)
@ApiKeyService('n8n')
export class N8nController {
  constructor() {}

  @Post('user-created')
  @ApiOperation({ summary: 'Webhook for user creation from N8N' })
  @ApiResponse({
    status: 200,
    description: 'User creation webhook processed successfully',
  })
  async handleUserCreated(@Body() data: any) {
    // Lógica para manejar la creación de usuario desde N8N
    console.log('User created webhook received:', data);
    return { success: true, message: 'User creation webhook processed' };
  }

  @Post('challenge-update')
  @ApiOperation({ summary: 'Webhook for challenge updates from N8N' })
  @ApiResponse({
    status: 200,
    description: 'Challenge update webhook processed successfully',
  })
  async handleChallengeUpdate(@Body() data: any) {
    // Lógica para manejar actualizaciones de challenge desde N8N
    console.log('Challenge update webhook received:', data);
    return { success: true, message: 'Challenge update webhook processed' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for N8N webhooks' })
  @ApiResponse({ status: 200, description: 'N8N webhooks service is healthy' })
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'n8n-webhooks',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('generic/:action')
  @ApiOperation({ summary: 'Generic webhook endpoint for N8N' })
  @ApiResponse({
    status: 200,
    description: 'Generic webhook processed successfully',
  })
  async handleGenericWebhook(
    @Param('action') action: string,
    @Body() data: any,
  ) {
    // Lógica genérica para manejar webhooks desde N8N
    console.log(`Generic webhook received for action: ${action}`, data);
    return {
      success: true,
      action,
      message: 'Generic webhook processed',
      data,
    };
  }
}
