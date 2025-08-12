import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Solo administradores pueden gestionar API keys
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key successfully created' })
  @ApiResponse({ status: 409, description: 'API key name already exists' })
  create(@Body() createApiKeyDto: CreateApiKeyDto, @Request() req) {
    const createdBy = req.user?.userID || req.user?.id;
    return this.apiKeysService.create(createApiKeyDto, createdBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({ status: 200, description: 'API keys successfully retrieved' })
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiResponse({ status: 200, description: 'API key successfully retrieved' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  findOne(@Param('id') id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update API key by ID' })
  @ApiResponse({ status: 200, description: 'API key successfully updated' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiResponse({ status: 409, description: 'API key name already exists' })
  update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.apiKeysService.update(id, updateApiKeyDto);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate API key' })
  @ApiResponse({ status: 200, description: 'API key successfully regenerated' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  regenerate(@Param('id') id: string, @Request() req) {
    const regeneratedBy = req.user?.userID || req.user?.id;
    return this.apiKeysService.regenerateApiKey(id, regeneratedBy);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key by ID' })
  @ApiResponse({ status: 200, description: 'API key successfully deleted' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }
}
