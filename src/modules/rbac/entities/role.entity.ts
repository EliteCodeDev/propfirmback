import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UserAccount } from 'src/modules/users/entities/user-account.entity';

@Entity('Role')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  roleID: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description?: string; // opcional porque la columna es nullable

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  // Un rol puede tener muchos usuarios
  @OneToMany(() => UserAccount, (user) => user.role)
  users: UserAccount[];
}
