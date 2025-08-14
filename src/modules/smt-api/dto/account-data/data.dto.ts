import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PositionCloseDto, PositionOpenDto } from './positions.dto';
import { ResumeClosePositionDto, ResumeOpenPositionDto } from './resume.dto';
import { Type } from 'class-transformer';


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

export class AccountDataDto {
    @ValidateNested()
    @Type(() => DataAccountCloseOpenDto)
    data: DataAccountCloseOpenDto;

    @IsNumber()
    status: number;

    @IsString()
    message: string;
}
