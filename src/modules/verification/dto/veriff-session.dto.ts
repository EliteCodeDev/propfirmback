import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SaveVeriffSessionDto {
  @ApiProperty({ required: true })
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ required: false, description: 'VendorData enviado a Veriff (usado por webhooks para mapear usuario)' })
  @IsOptional()
  @IsString()
  vendorData?: string;
}