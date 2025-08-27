import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BalanceAccountDto {

    @ApiProperty({
        description: 'Login for the user account',
        example: '12345678',
        required: false
    })
    @IsString()
    @IsNotEmpty()
    login: string;

    @ApiProperty({
        description: 'Amount to be added or subtracted from the user account',
        example: 0,
        required: false
    })
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        description: 'Optional comment or notes',
        example: 'Additional information',
        required: false
    })
    @IsString()
    @IsOptional()
    comment?: string;

    @ApiProperty({
        description: 'Operation type balance',
        example: 'deposit',
        required: false
    })
    @IsString()
    @IsOptional()
    operation?: string;

}