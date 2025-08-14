import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PositionCloseDto, PositionOpenDto } from './positions.dto';
import { ResumeClosePositionDto, ResumeOpenPositionDto } from './resume.dto';


export class AccountUniqueStatusDto {
    
    positions: PositionCloseDto[] | PositionOpenDto[];
    resume: ResumeClosePositionDto | ResumeOpenPositionDto;

    constructor() {}
}

export class AccountDataDto {
    data!: {
        close: AccountUniqueStatusDto;
        open: AccountUniqueStatusDto;
    }

    @IsNumber()
    status?: number

    @IsOptional()
    @IsString()
    message?: string

    constructor() {}
}
