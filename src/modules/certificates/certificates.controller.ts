import {
  Controller,
  Get,
  Post,
  Body,
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
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new certificate' })
  create(@Body() createCertificateDto: CreateCertificateDto) {
    return this.certificatesService.create(createCertificateDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all certificates' })
  findAll(@Query() query: any) {
    return this.certificatesService.findAll(query);
  }

  @Get('my-certificates')
  @ApiOperation({ summary: 'Get current user certificates' })
  findMyCertificates(@Request() req, @Query() query: any) {
    return this.certificatesService.findByUserId(req.user.userID, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get certificate by ID' })
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete certificate' })
  remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }
}
