import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('RolePermission')
export class RolePermission {
  @PrimaryColumn('uuid')
  roleID: string;

  @PrimaryColumn('uuid')
  permissionID: string;

  @CreateDateColumn()
  grantedAt: Date;

  // Relations
  @ManyToOne(() => Role, role => role.rolePermissions)
  @JoinColumn({ name: 'roleID' })
  role: Role;

  @ManyToOne(() => Permission, permission => permission.rolePermissions)
  @JoinColumn({ name: 'permissionID' })
  permission: Permission;
}