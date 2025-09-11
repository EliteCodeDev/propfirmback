import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEmail,
} from 'class-validator';

export class GenerateBrokerAccountDto {
  @ApiProperty({
    description: 'Login identifier for the broker account',
    example: 'user123',
  })
  @IsString()
  login: string;

  @ApiProperty({
    description: 'Email address associated with the account',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Group name for the broker account',
    example: 'demo_group',
    required: false,
  })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiProperty({
    description: 'Master password for the account',
    example: 'masterPass123',
    required: false,
  })
  @IsOptional()
  @IsString()
  masterPassword?: string;

  @ApiProperty({
    description: 'Investor password for read-only access',
    example: 'investorPass123',
    required: false,
  })
  @IsOptional()
  @IsString()
  investorPassword?: string;

  @ApiProperty({
    description: 'Initial balance for the account',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @ApiProperty({
    description: 'Relation ID associated with the account',
    example: 'rel_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  relationID?: string;

  @ApiProperty({
    description: 'Whether the account is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
