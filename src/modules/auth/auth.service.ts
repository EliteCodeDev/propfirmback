// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { UserAccount } from '../users/entities/user-account.entity';
import { BcryptUtil } from '../../common/utils/bcrypt.util';
import { MailerService } from '../mailer/mailer.service';
import { PasswordResetService } from './password-reset.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    private readonly passwordResetService: PasswordResetService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  /** Registro sin afiliado */
  async register(dto: RegisterDto) {
    const { username, email, password, firstName, lastName, phone } = dto;
    const lowerCaseEmail = email.toLowerCase().trim();

    console.log('🔍 REGISTER DEBUG - Starting registration process');
    console.log('📧 Email received:', email);
    console.log('📧 Email normalized:', lowerCaseEmail);
    console.log('👤 Username:', username);
    console.log('🔑 Password received:', `"${password}"`);
    console.log('🔑 Password length:', password?.length);
    console.log('🔑 Password type:', typeof password);

    // 1) Evitar duplicados
    const exists = await this.userRepo.findOne({
      where: [{ email: lowerCaseEmail }, { username }],
    });
    if (exists) {
      console.log('❌ REGISTER FAILED - User already exists');
      console.log('❌ Existing user email:', exists.email);
      console.log('❌ Existing user username:', exists.username);
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // 2) Hash de la contraseña
    console.log('🔐 Starting password hashing...');
    const passwordHash = await BcryptUtil.hash(password);
    console.log('🔐 Password hashed successfully');
    console.log('🔐 Hash length:', passwordHash?.length);
    console.log('🔐 Hash preview:', passwordHash?.substring(0, 20) + '...');

    // 3) Generar token de confirmación
    const confirmationToken = this.jwtService.sign(
      { email: lowerCaseEmail },
      {
        secret: this.configService.get<string>('JWT_EMAIL_CONFIRM_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EMAIL_CONFIRM_EXPIRES'),
      },
    );

    // 4) Crear y guardar usuario
    console.log('💾 Creating user in database...');
    const user = this.userRepo.create({
      username,
      email: lowerCaseEmail,
      passwordHash,
      firstName,
      lastName,
      phone,
      confirmationToken,
    });
    
    console.log('💾 User entity created, saving...');
    const saved = await this.userRepo.save(user);
    console.log('✅ User saved with ID:', saved.userID);
    console.log('💾 Saved user email:', saved.email);
    console.log('💾 Saved hash length:', saved.passwordHash?.length);
    console.log('💾 Saved hash preview:', saved.passwordHash?.substring(0, 20) + '...');

    // 5) Enviar email de confirmación
    const baseUrl = this.configService.get<string>('BACKEND_URL');
    const confirmationLink = `${baseUrl}/api/auth/confirm-email?token=${confirmationToken}`;

    await this.mailerService.sendMail({
      to: saved.email,
      subject: 'Confirm your email address',
      template: 'confirm-email',
      context: {
        name: saved.firstName,
        link: confirmationLink,
      },
    });

    console.log('✅ REGISTER SUCCESS - User registered and email sent');

    // 6) Generar tokens y devolver
    return {
      message:
        'User registered successfully. Please check your email to confirm your account.',
      user: this.excludePassword(saved),
      ...this.generateTokens(saved),
    };
  }

  /** Login */
  async login(dto: LoginDto) {
    const { email, password } = dto;
    const lowerCaseEmail = email.toLowerCase().trim();

    console.log('🔍 LOGIN DEBUG - Starting login process');
    console.log('📧 Email received:', `"${email}"`);
    console.log('📧 Email normalized:', `"${lowerCaseEmail}"`);
    console.log('🔑 Password received:', `"${password}"`);
    console.log('🔑 Password length:', password?.length);
    console.log('🔑 Password type:', typeof password);

    const user = await this.userRepo.findOne({
      where: { email: lowerCaseEmail },
      relations: ['userRoles', 'userRoles.role'],
    });

    console.log('👤 User found:', !!user);
    if (user) {
      console.log('👤 User ID:', user.userID);
      console.log('👤 User email:', `"${user.email}"`);
      console.log('👤 User username:', `"${user.username}"`);
      console.log('👤 User isBlocked:', user.isBlocked);
      console.log('👤 User isConfirmed:', user.isConfirmed);
      console.log('👤 User isVerified:', user.isVerified);
      console.log('🔑 PasswordHash exists:', !!user.passwordHash);
      console.log('🔑 PasswordHash length:', user.passwordHash?.length);
      console.log('🔑 PasswordHash preview:', user.passwordHash?.substring(0, 20) + '...');
      console.log('🔑 PasswordHash full:', `"${user.passwordHash}"`);
    } else {
      console.log('❌ No user found with email:', `"${lowerCaseEmail}"`);
    }

    if (!user) {
      console.log('❌ LOGIN FAILED - User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Debug password comparison
    console.log('🔍 Starting password comparison');
    console.log('🔑 Input password:', `"${password}"`);
    console.log('🔑 Input password type:', typeof password);
    console.log('🔑 Stored hash type:', typeof user.passwordHash);
    console.log('🔑 Stored hash:', `"${user.passwordHash}"`);
    
    let passwordMatch = false;
    try {
      passwordMatch = await BcryptUtil.compare(password, user.passwordHash);
      console.log('🔑 Password match result:', passwordMatch);
    } catch (error) {
      console.error('❌ Error during password comparison:', error);
      console.log('❌ LOGIN FAILED - Error comparing passwords');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!passwordMatch) {
      console.log('❌ LOGIN FAILED - Password does not match');
      console.log('❌ Attempted password:', `"${password}"`);
      console.log('❌ Against hash:', `"${user.passwordHash}"`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      console.log('❌ LOGIN FAILED - User is blocked');
      throw new UnauthorizedException('Account is blocked');
    }

    if (!user.isConfirmed) {
      console.log('❌ LOGIN FAILED - User email not confirmed');
      console.log('❌ User confirmation status:', user.isConfirmed);
      throw new UnauthorizedException(
        'Please confirm your email before logging in',
      );
    }

    console.log('✅ LOGIN SUCCESS - All validations passed');
    
    return {
      user: this.excludePassword(user),
      ...this.generateTokens(user),
    };
  }

  /** Para Passport LocalStrategy */
  async validateUser(email: string, password: string): Promise<any> {
    const lowerCaseEmail = email.toLowerCase().trim();
    console.log('🔍 VALIDATE USER - Starting validation');
    console.log('📧 Email:', `"${lowerCaseEmail}"`);
    console.log('🔑 Password:', `"${password}"`);

    const user = await this.userRepo.findOne({
      where: { email: lowerCaseEmail },
    });

    console.log('👤 User found in validation:', !!user);
    
    if (user && (await BcryptUtil.compare(password, user.passwordHash))) {
      console.log('✅ VALIDATE USER - Success');
      return this.excludePassword(user);
    }
    
    console.log('❌ VALIDATE USER - Failed');
    return null;
  }

  /** Refresh token */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepo.findOne({
        where: { userID: payload.sub },
        relations: ['userRoles', 'userRoles.role'],
      });
      if (!user) throw new UnauthorizedException('User not found');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /** Solicitar reset de contraseña */
  async requestPasswordReset(dto: ResetPasswordDto) {
    const lowerCaseEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOne({
      where: { email: lowerCaseEmail },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { token } = await this.passwordResetService.createToken(user);

    const resetLink = `${this.configService.get<string>(
      'FRONTEND_URL',
    )}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'reset-password',
      context: {
        name: user.firstName,
        link: resetLink,
      },
    });

    return { message: 'Password reset email sent' };
  }

  /** Confirmar reset de contraseña */
  async confirmPasswordReset(dto: ConfirmResetDto) {
    const { token, password } = dto;

    const resetToken = await this.passwordResetService.findToken(token);
    if (!resetToken || new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userRepo.findOne({
      where: { userID: resetToken.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await BcryptUtil.hash(password);
    await this.userRepo.update(user.userID, { passwordHash });

    await this.passwordResetService.deleteToken(token);

    return { message: 'Password has been reset successfully' };
  }

  /** Confirmar email */
  async confirmEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_EMAIL_CONFIRM_SECRET'),
      });
      if (!payload.email) {
        throw new UnauthorizedException('Invalid token');
      }

      const lowerCaseEmail = payload.email.toLowerCase().trim();
      const user = await this.userRepo.findOne({
        where: { email: lowerCaseEmail },
      });

      if (!user || user.confirmationToken !== token) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      await this.userRepo.update(user.userID, {
        isConfirmed: true,
        confirmationToken: null,
      });

      return { message: 'Email confirmed successfully' };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /** Helpers privados */
  private generateTokens(user: UserAccount) {
    const payload = { email: user.email, sub: user.userID };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.refreshSecret') ||
        this.configService.get<string>('jwt.secret'),
      expiresIn:
        this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    });

    return { accessToken, refreshToken };
  }

  private excludePassword(user: UserAccount) {
    const { passwordHash, confirmationToken, ...rest } = user;
    return rest;
  }
}