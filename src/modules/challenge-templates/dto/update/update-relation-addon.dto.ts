import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { CreateRelationAddonDto } from '../create';

export class UpdateRelationAddonDto extends PartialType(
  CreateRelationAddonDto,
) {}
