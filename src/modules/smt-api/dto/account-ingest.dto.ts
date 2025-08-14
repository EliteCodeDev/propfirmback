import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject
} from 'class-validator';

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
  @IsObject()
  openPositions?: {
    open?: any[]; // TODO: tipar con OpenPosition
    ResumePositionOpen?: Record<string, any>; // resumen
  };

  @ApiProperty({ required: false, type: () => Object })
  @IsOptional()
  @IsObject()
  closedPositions?: {
    closed?: any[]; // TODO: tipar con ClosedPosition
    ResumePositionClose?: Record<string, any>;
  };
}

export class AccountIngestPartialDto extends PartialType(AccountIngestDto) {}

export class AccountResponseDto extends AccountIngestDto {
  @ApiProperty({ type: String })
  lastUpdate: Date;
}

// Payload usado en POST (login viene por path param)
export class AccountIngestPayloadDto extends PartialType(
  OmitType(AccountIngestDto, ['login'] as const),
) {}
