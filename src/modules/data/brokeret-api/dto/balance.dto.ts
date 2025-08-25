import { IsNumber, IsNotEmpty, IsString, IsEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BalanceAccountDto {

    @ApiProperty({
        description: 'Login number for the user',
        example: 0,
        required: false
    })
    @IsNumber()
    @IsNotEmpty()
    login: number;

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
    @IsEmpty()
    comment: string;

    @ApiProperty({
        description: 'Operation type balance',
        example: 'balance',
        required: false
    })
    @IsEmpty()
    @IsString()
    operation: string;

}