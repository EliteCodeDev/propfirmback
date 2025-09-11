import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BrokerAccountsService } from './broker-accounts.service';
import { CreateBrokerAccountDto } from './dto/create-broker-account.dto';
import { UpdateBrokerAccountDto } from './dto/update-broker-account.dto';
import { FindAllBrokerAccountsDto } from './dto/find-all-broker-accounts.dto';
import { GenerateBrokerAccountDto } from './dto/generate-broker-account.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Broker Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broker-accounts')
export class BrokerAccountsController {
  constructor(private readonly brokerAccountsService: BrokerAccountsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new broker account' })
  create(@Body() createBrokerAccountDto: CreateBrokerAccountDto) {
    return this.brokerAccountsService.create(createBrokerAccountDto);
  }
  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Generate a new broker account with challenge' })
  @ApiResponse({
    status: 201,
    description: 'Broker account and challenge generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Broker account generated successfully',
        },
        data: {
          type: 'object',
          properties: {
            challengeID: { type: 'string', example: 'uuid-challenge-id' },
            login: { type: 'string', example: 'user123' },
            server: { type: 'string', example: 'MT5Server' },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'User or relation not found' })
  @ApiResponse({ status: 409, description: 'Login already exists' })
  generate(@Body() generateBrokerAccountDto: GenerateBrokerAccountDto) {
    return this.brokerAccountsService.generate(generateBrokerAccountDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all broker accounts with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated broker accounts with optional filters',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/BrokerAccount' },
        },
        total: { type: 'number', description: 'Total number of accounts' },
        page: { type: 'number', description: 'Current page number' },
        limit: { type: 'number', description: 'Items per page' },
        totalPages: { type: 'number', description: 'Total number of pages' },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'isUsed',
    required: false,
    description: 'Filter by usage status',
    enum: ['true', 'false'],
  })
  @ApiQuery({
    name: 'login',
    required: false,
    description: 'Search by login (partial match)',
    example: 'MT5_123',
  })
  findAll(@Query() query: FindAllBrokerAccountsDto) {
    return this.brokerAccountsService.findAll(query);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available broker accounts' })
  findAvailable() {
    return this.brokerAccountsService.findAvailable();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get broker account by ID' })
  findOne(@Param('id') id: string) {
    return this.brokerAccountsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update broker account' })
  update(
    @Param('id') id: string,
    @Body() updateBrokerAccountDto: UpdateBrokerAccountDto,
  ) {
    return this.brokerAccountsService.update(id, updateBrokerAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete broker account' })
  remove(@Param('id') id: string) {
    return this.brokerAccountsService.remove(id);
  }
}
