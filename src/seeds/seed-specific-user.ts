/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { Role } from '../modules/rbac/entities/role.entity';

async function ensureRole(ds: DataSource, name: string, description?: string) {
  const roleRepo = ds.getRepository(Role);
  let role = await roleRepo.findOne({ where: { name } });
  if (!role) {
    role = roleRepo.create({ name, description } as DeepPartial<Role>);
    await roleRepo.save(role);
    console.log(`✅ Role creado: ${name}`);
  }
  return role;
}

async function ensureUser(ds: DataSource, config: ConfigService, params: {
  email: string; username: string; password: string;
  firstName?: string; lastName?: string; role?: Role | null;
}) {
  const userRepo = ds.getRepository(UserAccount);
  const roleRepo = ds.getRepository(Role);
  let user = await userRepo.findOne({ where: [{ email: params.email }, { username: params.username }], relations: ['role'] });
  const passwordHash = await bcrypt.hash(params.password, 12);
  if (!user) {
    // Determine role according to FIRST_USER_SUPERADMIN and current users count
    const firstUserSuperadmin = config.get<boolean>('app.firstUserSuperadmin');
    const usersCount = await userRepo.count();
    let roleToAssign: Role | null = params.role ?? null;
    if (!roleToAssign) {
      if (firstUserSuperadmin && usersCount === 0) {
        roleToAssign = await roleRepo.findOne({ where: { name: 'super_admin' } })
          ?? await ensureRole(ds, 'super_admin', 'Super administrator');
      } else {
        roleToAssign = await roleRepo.findOne({ where: { name: 'user' } })
          ?? await ensureRole(ds, 'user', 'Standard user');
      }
    }
    user = userRepo.create({
      email: params.email,
      username: params.username,
      passwordHash,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      isConfirmed: true,
      isVerified: true,
      isBlocked: false,
      role: roleToAssign,
    } as DeepPartial<UserAccount>);
    await userRepo.save(user);
    console.log(`✅ Usuario creado: ${params.email}`);
  } else {
    user.passwordHash = passwordHash; // update to requested password
    user.role = params.role ?? user.role ?? null;
    await userRepo.save(user);
    console.log(`↺ Usuario actualizado: ${params.email}`);
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const ds = app.get(DataSource);
    const config = app.get(ConfigService);
    // Ensure base roles exist (idempotent)
    await ensureRole(ds, 'admin', 'administrator');
    const userRole = await ensureRole(ds, 'admin', 'Standard user');

    await ensureUser(ds, config, {
      email: 'elitecode2025dev@gmail.com',
      username: 'elitecode2025dev',
      password: 'Iv@nfer10',
      firstName: 'EliteCode',
      lastName: 'Dev',
      role: userRole,
    });
  } catch (err) {
    console.error('❌ Error seed-specific-user:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
