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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Role } from './entities/role.entity';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Auth('super_admin')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: Role,
  })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Auth('admin', 'super_admin')
  @ApiOperation({ summary: 'Get all roles with pagination' })
  @ApiPaginatedResponse(Role)
  findAll(@Query() query: BaseQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Auth('admin', 'super_admin')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role found', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Auth('super_admin')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Auth('super_admin')
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @Auth('super_admin')
  @ApiOperation({ summary: 'Assign permissions to role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
    type: Role,
  })
  assignPermissions(
    @Param('id', ParseUUIDPipe) roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<Role> {
    return this.rolesService.assignPermissions(roleId, assignPermissionsDto);
  }

  @Delete(':roleId/permissions/:permissionId')
  @Auth('super_admin')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiParam({ name: 'permissionId', description: 'Permission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Permission removed successfully',
    type: Role,
  })
  removePermission(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ): Promise<Role> {
    return this.rolesService.removePermission(roleId, permissionId);
  }

  @Post('assign')
  @Auth('admin', 'super_admin')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 409, description: 'User already has this role' })
  assignRole(@Body() assignRoleDto: AssignRoleDto): Promise<void> {
    return this.rolesService.assignRole(assignRoleDto);
  }

  @Delete('assign/:userID/:roleId')
  @Auth('admin', 'super_admin')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'userID', description: 'User UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'Role assignment not found' })
  removeRole(
    @Param('userID', ParseUUIDPipe) userID: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    return this.rolesService.removeRole(userID, roleId);
  }

  @Get('user/:userID')
  @Auth('admin', 'super_admin')
  @ApiOperation({ summary: 'Get user roles' })
  @ApiParam({ name: 'userID', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User roles retrieved successfully',
  })
  getUserRoles(@Param('userID', ParseUUIDPipe) userID: string) {
    return this.rolesService.getUserRoles(userID);
  }
}
