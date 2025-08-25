import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, IsUUID, Min, IsArray } from 'class-validator';

export class ChallengeQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, type: [String], description: 'Array of status values to filter by' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userID?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}
