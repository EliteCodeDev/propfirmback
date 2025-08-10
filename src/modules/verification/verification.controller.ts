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
import { VerificationService } from './verification.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit verification request' })
  create(@Request() req, @Body() createVerificationDto: CreateVerificationDto) {
    return this.verificationService.create(
      req.user.userID,
      createVerificationDto,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all verification requests' })
  findAll(@Query() query: any) {
    return this.verificationService.findAll(query);
  }

  @Get('my-verifications')
  @ApiOperation({ summary: 'Get current user verifications' })
  findMyVerifications(@Request() req, @Query() query: any) {
    return this.verificationService.findByUserId(req.user.userID, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get verification by ID' })
  findOne(@Param('id') id: string) {
    return this.verificationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update verification status' })
  update(
    @Param('id') id: string,
    @Body() updateVerificationDto: UpdateVerificationDto,
  ) {
    return this.verificationService.update(id, updateVerificationDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete verification' })
  remove(@Param('id') id: string) {
    return this.verificationService.remove(id);
  }
}
