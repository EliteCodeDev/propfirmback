import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UserAccount } from 'src/modules/users/entities/user-account.entity';

@Entity('Role')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  roleID: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  // Relations
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @OneToOne(() => UserAccount, (userAccount) => userAccount.role)
  user: UserAccount;
}
