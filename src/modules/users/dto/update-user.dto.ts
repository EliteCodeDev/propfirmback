import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['refAfiliateID'] as const),
) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
