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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Auth('super_admin')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: Permission,
  })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  create(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @Auth('admin', 'super_admin')
  @ApiOperation({ summary: 'Get all permissions with pagination' })
  @ApiPaginatedResponse(Permission)
  findAll(@Query() query: BaseQueryDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @Auth('admin', 'super_admin')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Permission found',
    type: Permission,
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Permission> {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Auth('super_admin')
  @ApiOperation({ summary: 'Update permission' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    type: Permission,
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Auth('super_admin')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete permission assigned to roles',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.permissionsService.remove(id);
  }
}
