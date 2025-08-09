import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { DocumentType } from '../../../common/enums/verification-document-type.enum';

export class CreateVerificationDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numDocument?: string;
}
