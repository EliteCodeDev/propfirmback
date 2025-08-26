import { IsEmail, IsOptional, IsString, IsObject } from 'class-validator';

export class SendMailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}