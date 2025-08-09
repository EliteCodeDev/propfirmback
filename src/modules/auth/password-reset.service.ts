import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UserAccount } from '../users/entities/user-account.entity';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
    private readonly configService: ConfigService,
  ) {}

  async createToken(user: UserAccount): Promise<PasswordResetToken> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() +
        parseInt(this.configService.get<string>('JWT_EMAIL_CONFIRM_EXPIRES')),
    );

    const resetToken = this.tokenRepository.create({
      token,
      userId: user.userID,
      expiresAt,
    });

    return this.tokenRepository.save(resetToken);
  }

  async findToken(token: string): Promise<PasswordResetToken> {
    return this.tokenRepository.findOne({ where: { token } });
  }

  async deleteToken(token: string): Promise<void> {
    await this.tokenRepository.delete({ token });
  }
}
