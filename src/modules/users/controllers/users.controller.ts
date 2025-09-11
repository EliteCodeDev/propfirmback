// src/modules/users/users.controller.ts

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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  UpdateUserDto,
  UserQueryDto,
  CreateUserDto,
  UpdateUserProfileDto,
  GenerateUserDto,
} from '../dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersService } from '../services/users.service';
import { Public } from 'src/common/decorators/public.decorator';

//swagger
@ApiTags('Users')
@ApiBearerAuth()
//

@UseGuards(JwtAuthGuard) // 1) JWT obligatorio en TODO el controlador
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 2) Crea usuario: requiero solo JWT, no admin
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Generate a user with random password' })
  @ApiResponse({ status: 201, description: 'User generated successfully' })
  async generate(@Body() body: GenerateUserDto) {
    return this.usersService.generate(body);
  }

  // 3) Resto de endpoints protegidos por rol "admin"
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users successfully retrieved' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully retrieved' })
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userID).then((user) => {
      const addr = user.address || ({} as any);
      // Flatten address fields for convenience in the profile endpoint
      const { address, ...rest } = user as any;
      return {
        ...rest,
        country: addr.country ?? null,
        state: addr.state ?? null,
        city: addr.city ?? null,
        zipCode: addr.zipCode ?? null,
        addressLine1: addr.addressLine1 ?? null,
        addressLine2: addr.addressLine2 ?? null,
      };
    });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully retrieved' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
  async updateProfile(@Request() req, @Body() body: UpdateUserProfileDto) {
    const updated = await this.usersService.updateProfile(
      req.user.userID,
      body,
    );
    const addr = updated.address || ({} as any);
    const { address, ...rest } = updated as any;
    return {
      ...rest,
      country: addr.country ?? null,
      state: addr.state ?? null,
      city: addr.city ?? null,
      zipCode: addr.zipCode ?? null,
      addressLine1: addr.addressLine1 ?? null,
      addressLine2: addr.addressLine2 ?? null,
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
