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
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Affiliates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new affiliate' })
  create(@Body() createAffiliateDto: CreateAffiliateDto) {
    return this.affiliatesService.create(createAffiliateDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all affiliates' })
  findAll(@Query() query: any) {
    return this.affiliatesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get affiliate by ID' })
  findOne(@Param('id') id: string) {
    return this.affiliatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update affiliate' })
  update(
    @Param('id') id: string,
    @Body() updateAffiliateDto: UpdateAffiliateDto,
  ) {
    return this.affiliatesService.update(id, updateAffiliateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete affiliate' })
  remove(@Param('id') id: string) {
    return this.affiliatesService.remove(id);
  }
}
