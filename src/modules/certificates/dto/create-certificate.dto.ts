import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';
import { CertificateType } from 'src/common/enums/certificate-type.enum';

export class CreateCertificateDto {
  @ApiProperty()
  @IsUUID()
  userID: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  certificateDate?: string;

  @ApiProperty({ enum: CertificateType })
  type: CertificateType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qrLink?: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  challengeID?: string;
}
