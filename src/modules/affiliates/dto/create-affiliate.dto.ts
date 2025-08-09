import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { AffiliateStatus } from '../../../common/enums/affiliate-status.enum';

export class CreateAffiliateDto {
  @ApiProperty({ example: 'REF123ABC' })
  @IsString()
  referralCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentAffiliateID?: string;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  level?: number = 1;

  @ApiProperty({ enum: AffiliateStatus, default: AffiliateStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AffiliateStatus)
  status?: AffiliateStatus = AffiliateStatus.ACTIVE;

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
