import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('PasswordReset')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  email: string;

  @Column({ length: 255 })
  token: string;

  @CreateDateColumn()
  createdAt: Date;
}
