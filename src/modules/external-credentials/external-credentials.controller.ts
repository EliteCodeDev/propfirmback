import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExternalCredentialsService } from './external-credentials.service';
import { CreateExternalCredentialDto } from './dto/create-external-credential.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('External Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('external-credentials')
export class ExternalCredentialsController {
  constructor(private readonly externalCredentialsService: ExternalCredentialsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create external credential' })
  create(@Body() createExternalCredentialDto: CreateExternalCredentialDto) {
    return this.externalCredentialsService.create(createExternalCredentialDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all external credentials' })
  findAll() {
    return this.externalCredentialsService.findAll();
  }

  @Get('my-credentials')
  @ApiOperation({ summary: 'Get current user external credentials' })
  findMine(@Request() req) {
    return this.externalCredentialsService.findByUserId(req.user.userID);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get external credential by user ID' })
  findOne(@Param('id') id: string) {
    return this.externalCredentialsService.findByUserId(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update external credential' })
  update(@Param('id') id: string, @Body() updateData: Partial<CreateExternalCredentialDto>) {
    return this.externalCredentialsService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete external credential' })
  remove(@Param('id') id: string) {
    return this.externalCredentialsService.remove(id);
  }
}