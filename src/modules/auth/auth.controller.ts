import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';
import { GoogleAuthDto, GoogleCallbackDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { Query } from '@nestjs/common/decorators';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TurnstileGuard } from 'src/common/security/turnstile.guard';
import { IntercomService } from 'src/common/services/intercom.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly intercomService: IntercomService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TurnstileGuard)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('/admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TurnstileGuard)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(TurnstileGuard)
  async forgotPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Get('confirm')
  async confirm(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @Public()
  @Post('reset-password/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TurnstileGuard)
  async completePasswordReset(@Body() dto: CompletePasswordResetDto) {
    return this.authService.completePasswordReset(dto);
  }

  @Public()
  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email confirmation' })
  @ApiResponse({
    status: 200,
    description: 'Confirmation email sent successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email is already confirmed' })
  @UseGuards(TurnstileGuard)
  async resendConfirmation(@Body() dto: ResendConfirmationDto) {
    return this.authService.resendConfirmationEmail(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  async profile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for the authenticated user' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const userId = req.user?.userID || req.user?.sub;
    return this.authService.changePassword(userId, dto);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Google' })
  @ApiResponse({ status: 200, description: 'User authenticated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid Google token' })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Public()
  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'User authenticated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid authorization code' })
  async googleCallback(@Body() dto: GoogleCallbackDto) {
    return this.authService.googleCallback(dto);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('intercom-hash')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Intercom user hash for secure authentication' })
  @ApiResponse({ status: 200, description: 'User hash generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getIntercomHash(@Request() req) {
    const userId = req.user?.userID || req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found');
    }
    
    const userHash = this.intercomService.generateUserHash(String(userId));
    const appId = this.intercomService.getAppId();
    
    return {
      success: true,
      data: {
        user_hash: userHash,
        app_id: appId,
      },
    };
  }
}
