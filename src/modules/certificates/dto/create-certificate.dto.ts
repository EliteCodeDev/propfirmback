import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty()
  @IsUUID()
  userID: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  monto?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qrLink?: string;

  @ApiProperty()
  @IsUUID()
  challengeID: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  certificateDate?: string;
}
