
import { IsBoolean, IsNotEmpty, IsNumber, IsString, Length } from "class-validator";


export class CreateAddonsDto {

    @IsString({
        message: 'Addon name is required'
    })
    @IsNotEmpty()
    @Length(1, 100)
    name: string;

    @IsBoolean()
    isActive: boolean;

    @IsBoolean()
    hasDiscount: boolean;

    @IsNumber()
    discount: number;

    @IsNumber()
    balance: number;

}