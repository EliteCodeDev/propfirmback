import { ApiProperty } from '@nestjs/swagger';
import { Addon } from '../../entities/addons/addon.entity';
import { ChallengeRelation } from '../../entities/challenge-relation.entity';

export class RelationAddonResponseDto {
  @ApiProperty({
    description: 'ID of the addon',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  addonID: string;

  @ApiProperty({
    description: 'ID of the challenge relation',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  relationID: string;

  @ApiProperty({
    description: 'Price of the addon for this relation',
    example: 99.99,
    nullable: true
  })
  price: number;

  @ApiProperty({
    description: 'Whether the addon is active for this relation',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the addon has a discount for this relation',
    example: false
  })
  hasDiscount: boolean;

  @ApiProperty({
    description: 'Discount amount for the addon',
    example: 10.0,
    nullable: true
  })
  discount: number;

  @ApiProperty({
    description: 'WooCommerce ID for integration',
    example: 12345,
    nullable: true
  })
  wooID: number;

  @ApiProperty({
    description: 'Related addon information',
    type: () => Addon,
    required: false
  })
  addon?: Addon;

  @ApiProperty({
    description: 'Related challenge relation information',
    type: () => ChallengeRelation,
    required: false
  })
  relation?: ChallengeRelation;
}