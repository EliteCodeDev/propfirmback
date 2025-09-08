import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class ChallengeQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Array of status values to filter by',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    // Accept single string (comma-separated or single) or array
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      return trimmed.includes(',')
        ? trimmed.split(',').map((v) => v.trim()).filter(Boolean)
        : [trimmed];
    }
    return value;
  })
  status?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userID?: string;

  @ApiProperty({
    required: false,
    description: 'Free-text search by user email, username, or full name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Search by broker account login (partial match)',
  })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}
