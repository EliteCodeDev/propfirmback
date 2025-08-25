import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateBusinessRequirementDto {

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    metadata?: object; // JSON

    @ApiProperty()
    @IsString()
    type: string;
}
