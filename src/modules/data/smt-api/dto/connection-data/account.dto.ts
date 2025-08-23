import { IsBoolean, IsOptional, IsString, IsNumber, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class AccountDto {
    @IsString() id: string
    @IsString() login: string
    @IsString() password: string
    @IsString() @IsOptional() ip?: string
    @IsString() @IsOptional() utl?: string
    @IsBoolean() estado: boolean
}

export class DataProcessDto {
    @ApiProperty({
        description: 'Account associated with the process',
        example: 'id123',
        required: true
    })
    @Type(() => AccountDto)
    @ValidateNested()
    account!: AccountDto;

    @ApiProperty({
        description: 'Process status',
        example: 200
    })
    @IsNumber()
    @IsOptional()
    status?: number;

    @ApiProperty({
        description: 'Process error if exists',
        required: false,
        example: null
    })
    @IsOptional()
    error?: any;
}