import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateExternalCredentialDto {
  @ApiProperty()
  @IsUUID()
  userID: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentId?: string;
}