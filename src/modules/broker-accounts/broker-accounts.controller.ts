import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrokerAccountsService } from './broker-accounts.service';
import { CreateBrokerAccountDto } from './dto/create-broker-account.dto';
import { UpdateBrokerAccountDto } from './dto/update-broker-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Broker Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('broker-accounts')
export class BrokerAccountsController {
  constructor(private readonly brokerAccountsService: BrokerAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new broker account' })
  create(@Body() createBrokerAccountDto: CreateBrokerAccountDto) {
    return this.brokerAccountsService.create(createBrokerAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all broker accounts' })
  findAll(@Query() query: any) {
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
  update(@Param('id') id: string, @Body() updateBrokerAccountDto: UpdateBrokerAccountDto) {
    return this.brokerAccountsService.update(id, updateBrokerAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete broker account' })
  remove(@Param('id') id: string) {
    return this.brokerAccountsService.remove(id);
  }
}