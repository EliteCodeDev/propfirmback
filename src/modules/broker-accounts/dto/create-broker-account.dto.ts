import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateBrokerAccountDto {
  @ApiProperty({ example: 'MT5_123456' })
  @IsString()
  login: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  server?: string;

  @ApiProperty({ example: '192.168.1.1' })
  @IsString()
  serverIp: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isUsed?: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  investorPass?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  innitialBalance?: number;
}
