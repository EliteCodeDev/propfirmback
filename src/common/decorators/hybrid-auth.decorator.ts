import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HybridAuthGuard } from 'src/common/guards/hybrid-auth.guard';
import { ApiKeyAuth } from 'src/common/decorators/api-key.decorator';

export function HybridAuth() {
  return applyDecorators(
    UseGuards(HybridAuthGuard),
    ApiKeyAuth(), // Marca que acepta API key
    ApiBearerAuth(), // Para JWT
    ApiSecurity('ApiKeyAuth'), // Para API key en Swagger
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Valid JWT token or API key required',
    }),
  );
}
