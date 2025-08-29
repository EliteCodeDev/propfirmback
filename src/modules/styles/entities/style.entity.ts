import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Style')
export class Style {
  @PrimaryGeneratedColumn('uuid')
  styleID: string;

  @Column({ length: 7, nullable: false, comment: 'Primary color in hex format (e.g., #FF5733)' })
  primaryColor: string;

  @Column({ length: 7, nullable: false, comment: 'Secondary color in hex format (e.g., #33FF57)' })
  secondaryColor: string;

  @Column({ length: 7, nullable: false, comment: 'Tertiary color in hex format (e.g., #3357FF)' })
  tertiaryColor: string;

  @Column({ length: 255, nullable: true, comment: 'Banner image URL or path' })
  banner?: string;

  @Column({ length: 150, nullable: false, comment: 'Company name for branding' })
  companyName: string;

  @Column({ length: 255, nullable: true, comment: 'Landing page URL' })
  landingURL?: string;

  @Column({ type: 'boolean', default: true, comment: 'Whether this style is active' })
  isActive: boolean;

  @Column({ length: 100, nullable: true, comment: 'Style name or identifier' })
  name?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}