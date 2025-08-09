import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class AccountIngestDto {
  @ApiProperty({ description: 'Account login / identifier' })
  @IsString()
  login: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userID?: string;

  @ApiProperty({ required: false, example: 1000 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ required: false, example: 1000 })
  @IsOptional()
  @IsNumber()
  equity?: number;

  @ApiProperty({ required: false, type: () => Object })
  @IsOptional()
  @IsObject()
  metaStats?: Record<string, any>;

  @ApiProperty({ required: false, type: () => Object })
  @IsOptional()
  @IsObject()
  validation?: Record<string, any>;

  @ApiProperty({ required: false, type: () => Object })
  @IsOptional()
  openPositions?: any;

  @ApiProperty({ required: false, type: () => Object })
  @IsOptional()
  closedPositions?: any;
}

export class AccountIngestPartialDto extends PartialType(AccountIngestDto) {}

export class AccountResponseDto extends AccountIngestDto {
  @ApiProperty({ type: String })
  lastUpdate: Date;
}
