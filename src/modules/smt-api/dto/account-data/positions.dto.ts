import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PositionCloseDto {
    @IsString() OrderId: string;
    @IsString() TimeOpen: string;
    @IsString() Type: string;
    @IsNumber() Volume: number;
    @IsString() Symbol: string;
    @IsNumber() OpenPrice: number;
    @IsNumber() SL: number; 
    @IsNumber() TP: number;
    @IsString() TimeClose: string; // Cierra siempre
    @IsNumber() ClosePrice: number;
    @IsNumber() Commission: number; // Corrige aquí
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
    @IsOptional() @IsString() TimeClose?: string; // OJO: opcional
    @IsNumber() ClosePrice: number;
    @IsNumber() Swap: number;
    @IsNumber() Profit: number;
    @IsString() @IsOptional() Commentary: string;
}
