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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { VerificationStatus } from 'src/common/enums/verification-status.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { SaveVeriffSessionDto } from './dto/veriff-session.dto';

@ApiTags('Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit verification request' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5))
  create(
    @Request() req,
    @Body() createVerificationDto: CreateVerificationDto,
    @UploadedFiles() files?: any[],
  ) {
    return this.verificationService.create(
      req.user.userID,
      createVerificationDto,
      files,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all verification requests' })
  findAll(@Query() query: any) {
    return this.verificationService.findAll(query);
  }

  // ADMIN: Get verifications by user ID
  @Get('user/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get verification requests by user ID' })
  findByUser(@Param('id') id: string, @Query() query: any) {
    return this.verificationService.findByUserId(id, query);
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

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve verification' })
  approve(@Param('id') id: string) {
    return this.verificationService.update(id, { status: VerificationStatus.APPROVED });
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Reject verification' })
  reject(@Param('id') id: string, @Body() body: { rejectionReason: string }) {
    return this.verificationService.update(id, {
      status: VerificationStatus.REJECTED,
      rejectionReason: body.rejectionReason,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete verification' })
  remove(@Param('id') id: string) {
    return this.verificationService.remove(id);
  }

  // Webhooks Veriff
  @Public()
  @Post('webhooks/event')
  @ApiOperation({ summary: 'Webhook de eventos Veriff (inicio/envío de verificación)' })
  veriffEvent(@Request() req, @Body() payload: any) {
    const signature = req.headers['x-veriff-signature'] || req.headers['x-signature'];
    return this.verificationService.handleVeriffEvent(payload, signature as string | undefined);
  }

  @Public()
  @Post('webhooks/decision')
  @ApiOperation({ summary: 'Webhook de decisiones Veriff (aprobado/rechazado/reenvío)' })
  veriffDecision(@Request() req, @Body() payload: any) {
    const signature = req.headers['x-veriff-signature'] || req.headers['x-signature'];
    return this.verificationService.handleVeriffDecision(payload, signature as string | undefined);
  }
  @Post('veriff-session')
  @ApiOperation({ summary: 'Guardar sesión de Veriff (URL/ID) para continuar luego' })
  saveVeriffSession(@Request() req, @Body() dto: SaveVeriffSessionDto) {
    return this.verificationService.saveVeriffSession(req.user.userID, dto);
  }
}
