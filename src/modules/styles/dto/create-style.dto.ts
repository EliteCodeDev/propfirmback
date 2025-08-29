import { IsString, IsOptional, IsBoolean, IsUrl, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStyleDto {
  @ApiProperty({
    description: 'Primary color in hex format',
    example: '#FF5733',
    maxLength: 7,
  })
  @IsString()
  @Length(7, 7, { message: 'Primary color must be exactly 7 characters (including #)' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Primary color must be a valid hex color (e.g., #FF5733)' })
  primaryColor: string;

  @ApiProperty({
    description: 'Secondary color in hex format',
    example: '#33FF57',
    maxLength: 7,
  })
  @IsString()
  @Length(7, 7, { message: 'Secondary color must be exactly 7 characters (including #)' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Secondary color must be a valid hex color (e.g., #33FF57)' })
  secondaryColor: string;

  @ApiProperty({
    description: 'Tertiary color in hex format',
    example: '#3357FF',
    maxLength: 7,
  })
  @IsString()
  @Length(7, 7, { message: 'Tertiary color must be exactly 7 characters (including #)' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Tertiary color must be a valid hex color (e.g., #3357FF)' })
  tertiaryColor: string;

  @ApiPropertyOptional({
    description: 'Banner image URL or path',
    example: 'https://example.com/banner.jpg',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: 'Banner must be between 1 and 255 characters' })
  banner?: string;

  @ApiProperty({
    description: 'Company name for branding',
    example: 'PropFirm Elite',
    maxLength: 150,
  })
  @IsString()
  @Length(1, 150, { message: 'Company name must be between 1 and 150 characters' })
  companyName: string;

  @ApiPropertyOptional({
    description: 'Landing page URL',
    example: 'https://propfirmelite.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Landing URL must be a valid URL' })
  @Length(1, 255, { message: 'Landing URL must be between 1 and 255 characters' })
  landingURL?: string;

  @ApiPropertyOptional({
    description: 'Whether this style is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Style name or identifier',
    example: 'Default Theme',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Style name must be between 1 and 100 characters' })
  name?: string;
}