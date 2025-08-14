import { IsNumber, IsString } from 'class-validator';

export class ResumeClosePositionDto {
    @IsNumber()
    Profit_Lose: number;

    @IsNumber()
    Credit: number;

    @IsNumber()
    Deposit: number;

    @IsNumber()
    Withdrawal: number;

    @IsNumber()
    Profit: number;

    @IsNumber()
    Swap: number;

    @IsNumber()
    Rate: number;

    @IsNumber()
    Commission: number;

    @IsNumber()
    Balance: number;
}

export class ResumeOpenPositionDto {
    @IsNumber()
    Balance: number;

    @IsString()
    Comentary: string;

    @IsNumber()
    Equity: number;

    @IsNumber()
    Margin: number;

    @IsNumber()
    FreeMargin: number;

    @IsNumber()
    Level: number;

    @IsNumber()
    Profit: number;
}
