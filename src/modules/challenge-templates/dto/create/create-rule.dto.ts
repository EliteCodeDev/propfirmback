import { IsNotEmpty, IsString, IsOptional, Length, IsEmpty } from 'class-validator';

export class RuleDto {

    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    nameRule: string;

    @IsNotEmpty()
    @IsOptional()
    @Length(1, 100)
    slugRule: string;

    @IsOptional()
    @IsString()
    @IsEmpty()
    descriptionRule: string;

}