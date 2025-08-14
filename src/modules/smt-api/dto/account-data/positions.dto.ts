import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PositionCloseDto {
    @IsString()
    OrderId: string;

    @IsString()
    TimeOpen: string;

    @IsString()
    Type: string;

    @IsNumber()
    Volume: number;

    @IsString()
    Symbol: string;

    @IsNumber()
    OpenPrice: number;

    @IsNumber()
    SL: number;

    @IsNumber()
    TP: number;

    @IsString()
    TimeClose: string;

    @IsNumber()
    ClosePrice: number;

    @IsNumber()
    Comission: number;

    @IsNumber()
    Rate: number;

    @IsNumber()
    Swap: number;

    @IsNumber()
    Profit: number;

    @IsString()
    @IsOptional()
    Commentary: string;

    constructor() {}
}

export class PositionOpenDto {
    @IsString()
    OrderId: string;

    @IsString()
    Symbol: string;

    @IsString()
    TimeOpen: string;

    @IsString()
    Type: string;

    @IsNumber()
    Volume: number;

    @IsNumber()
    OpenPrice: number;

    @IsNumber()
    SL: number;

    @IsNumber()
    TP: number;

    @IsNumber()
    ClosePrice: number;

    @IsNumber()
    Swap: number;

    @IsNumber()
    Profit: number;

    @IsString()
    @IsOptional()
    Commentary: string;

    constructor() {}
}

export class AccountPositionsDto {
    openPositions: PositionOpenDto[];
    closedPositions: PositionCloseDto[];
}