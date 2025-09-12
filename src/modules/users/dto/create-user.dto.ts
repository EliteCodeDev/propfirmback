// src/modules/users/dto/create-user.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'e3b0c442-98fc-1c14-9af0-6da39c6fc345',
    description: 'Affiliate UUID (optional)',
  })
  @IsOptional()
  @IsUUID()
  refAfiliateID?: string;

  // This field is not received in body, only used internally
  passwordHash?: string;

  @ApiPropertyOptional({
    example: 'e3b0c442-98fc-1c14-9af0-6da39c6fc345',
    description: 'Optional Role UUID to assign on creation',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ example: 'true' })
  @IsOptional()
  isConfirmed?: boolean;
}
