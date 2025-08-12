import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from '../auth/entities/password-reset.entity';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private passwordResetRepo: Repository<PasswordReset>,
  ) {}

  async create(email: string, token: string): Promise<PasswordReset> {
    const passwordReset = this.passwordResetRepo.create({ email, token });
    return this.passwordResetRepo.save(passwordReset);
  }

  async findOneByToken(token: string): Promise<PasswordReset | null> {
    return this.passwordResetRepo.findOne({ where: { token } });
  }

  async remove(id: string): Promise<void> {
    await this.passwordResetRepo.delete(id);
  }
}
