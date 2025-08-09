import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Role } from '../../rbac/entities/role.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryColumn('uuid')
  userID: string;

  @PrimaryColumn('uuid')
  roleID: string;

  @CreateDateColumn()
  assignedAt: Date;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userID' })
  user: UserAccount;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'roleID' })
  role: Role;
}
