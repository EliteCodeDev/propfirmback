import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class CreateAffiliateDto {
  @ApiProperty({ example: 'REF123ABC' })
  @IsString()
  referralCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentAffiliateId?: string;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  level?: number = 1;

  @ApiProperty({ enum: ['active', 'inactive', 'banned'], default: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'banned'])
  status?: string = 'active';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referralUrl?: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userID?: string;
}