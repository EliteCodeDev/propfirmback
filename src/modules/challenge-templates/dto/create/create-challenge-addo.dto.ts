
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID  } from "class-validator";

export class CreateChallegeAddonDto {

    @IsString()
    @IsUUID('4', { message: 'Addon ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Relation ID is required' })
    addonID: string

    @IsString()
    @IsUUID('4', { message: 'Addon ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Relation ID is required' })
    challengeID: string

    @IsNumber()
    @IsNotEmpty({ message: 'Price is required' })
    price: number;

    @IsBoolean()
    @IsOptional()
    isActive: boolean;

    @IsBoolean()
    @IsOptional()
    hasDiscount: boolean;

    @IsNumber()
    @IsOptional()
    discount: number;

    @IsNumber()
    @IsOptional()
    wooID: number;
}