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
} from '@nestjs/swagger';
import { StylesService } from './styles.service';
import { CreateStyleDto, UpdateStyleDto } from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Styles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new style configuration' })
  @ApiResponse({ status: 201, description: 'Style created successfully' })
  @ApiResponse({ status: 409, description: 'Style name already exists' })
  create(@Body() createStyleDto: CreateStyleDto) {
    return this.stylesService.create(createStyleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all style configurations' })
  @ApiResponse({ status: 200, description: 'Styles retrieved successfully' })
  findAll(@Query() query: any) {
    return this.stylesService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the currently active style configuration' })
  @ApiResponse({ status: 200, description: 'Active style retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No active style found' })
  findActiveStyle() {
    return this.stylesService.findActiveStyle();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get style configuration by ID' })
  @ApiResponse({ status: 200, description: 'Style retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Style not found' })
  findOne(@Param('id') id: string) {
    return this.stylesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update style configuration' })
  @ApiResponse({ status: 200, description: 'Style updated successfully' })
  @ApiResponse({ status: 404, description: 'Style not found' })
  @ApiResponse({ status: 409, description: 'Style name already exists' })
  update(
    @Param('id') id: string,
    @Body() updateStyleDto: UpdateStyleDto,
  ) {
    return this.stylesService.update(id, updateStyleDto);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Set a style as the active configuration' })
  @ApiResponse({ status: 200, description: 'Style activated successfully' })
  @ApiResponse({ status: 404, description: 'Style not found' })
  setActiveStyle(@Param('id') id: string) {
    return this.stylesService.setActiveStyle(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete style configuration' })
  @ApiResponse({ status: 200, description: 'Style deleted successfully' })
  @ApiResponse({ status: 404, description: 'Style not found' })
  remove(@Param('id') id: string) {
    return this.stylesService.remove(id);
  }
}