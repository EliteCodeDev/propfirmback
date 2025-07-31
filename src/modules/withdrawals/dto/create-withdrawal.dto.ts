import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 'TRX_wallet_address_here' })
  @IsString()
  wallet: string;

  @ApiProperty({ example: 1000.50 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  challengeID?: string;
}