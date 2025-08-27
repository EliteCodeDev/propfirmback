import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Position DTOs
export class PositionCloseDto {
  @IsString() OrderId: string;
  @IsString() TimeOpen: string;
  @IsString() Type: string;
  @IsNumber() Volume: number;
  @IsString() Symbol: string;
  @IsNumber() OpenPrice: number;
  @IsNumber() SL: number;
  @IsNumber() TP: number;
  @IsString() TimeClose: string;
  @IsNumber() ClosePrice: number;
  @IsNumber() Commission: number;
  @IsNumber() Rate: number;
  @IsNumber() Swap: number;
  @IsNumber() Profit: number;
  @IsString() @IsOptional() Commentary: string;
}

export class PositionOpenDto {
  @IsString() OrderId: string;
  @IsString() Symbol: string;
  @IsString() TimeOpen: string;
  @IsString() Type: string;
  @IsNumber() Volume: number;
  @IsNumber() OpenPrice: number;
  @IsNumber() SL: number;
  @IsNumber() TP: number;
  @IsOptional() @IsString() TimeClose?: string;
  @IsNumber() ClosePrice: number;
  @IsNumber() Swap: number;
  @IsNumber() Profit: number;
  @IsString() @IsOptional() Commentary: string;
}

// Resume DTOs
export class ResumeClosePositionDto {
  @IsNumber() Profit_Lose: number;
  @IsNumber() Credit: number;
  @IsNumber() Deposit: number;
  @IsNumber() Withdrawal: number;
  @IsNumber() Profit: number;
  @IsNumber() Swap: number;
  @IsNumber() Rate: number;
  @IsNumber() Commission: number;
  @IsNumber() Balance: number;
}

export class ResumeOpenPositionDto {
  @IsNumber() Balance: number;
  @IsString() Commentary: string;
  @IsNumber() Equity: number;
  @IsNumber() Margin: number;
  @IsNumber() FreeMargin: number;
  @IsNumber() Level: number;
  @IsNumber() Profit: number;
}

// Account Status DTOs
class AccountUniqueStatusOpenDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionOpenDto)
  positions?: PositionOpenDto[] = [];

  @IsOptional()
  @ValidateNested()
  @Type(() => ResumeOpenPositionDto)
  resume?: ResumeOpenPositionDto;
}

class AccountUniqueStatusCloseDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionCloseDto)
  positions?: PositionCloseDto[] = [];

  @IsOptional()
  @ValidateNested()
  @Type(() => ResumeClosePositionDto)
  resume?: ResumeClosePositionDto;
}

class DataAccountCloseOpenDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountUniqueStatusCloseDto)
  close?: AccountUniqueStatusCloseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccountUniqueStatusOpenDto)
  open?: AccountUniqueStatusOpenDto;
}

// Main Account Data DTO
export class AccountDataDto {
  @ValidateNested()
  @Type(() => DataAccountCloseOpenDto)
  data: DataAccountCloseOpenDto;

  @IsNumber()
  status: number;

  @IsString()
  message: string;
}