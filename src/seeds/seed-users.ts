/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Role } from '../modules/rbac/entities/role.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';

async function ensureRole(ds: DataSource, name: string, description?: string) {
  const roleRepo = ds.getRepository(Role);

  let role = await roleRepo.findOne({ where: { name } });
  if (!role) {
    const payload: DeepPartial<Role> = {
      name,
      ...(description ? { description } : {}),
    };
    role = roleRepo.create(payload); // devuelve Role (no Role[])
    await roleRepo.save(role);
    console.log(`✅ Role creado: ${name}`);
  } else {
    console.log(`↺ Role ya existe: ${name}`);
  }
  return role;
}

async function ensureUser(
  ds: DataSource,
  params: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    isConfirmed?: boolean;
    isVerified?: boolean;
    isBlocked?: boolean;
    role?: Role | null;
    phone?: string;
  }
) {
  const userRepo = ds.getRepository(UserAccount);

  // Busca por email o username
  let user = await userRepo.findOne({
    where: [{ email: params.email }, { username: params.username }],
    relations: ['role'],
  });

  const passwordHash = await bcrypt.hash(params.password, 12);

  if (!user) {
    const payload: DeepPartial<UserAccount> = {
      username: params.username,
      email: params.email,
      passwordHash,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      isConfirmed: params.isConfirmed ?? true,
      isVerified: params.isVerified ?? true,
      isBlocked: params.isBlocked ?? false,
      phone: params.phone ?? null,
      role: params.role ?? null,
    };

    user = userRepo.create(payload);
    await userRepo.save(user);
    console.log(`✅ Usuario creado: ${params.email} (${params.username})`);
  } else {
    // idempotente: actualiza datos y el hash (por si cambiamos el pass del seed)
    user.firstName = params.firstName ?? user.firstName ?? null;
    user.lastName = params.lastName ?? user.lastName ?? null;
    user.isConfirmed = params.isConfirmed ?? user.isConfirmed ?? true;
    user.isVerified = params.isVerified ?? user.isVerified ?? true;
    user.isBlocked = params.isBlocked ?? user.isBlocked ?? false;
    user.phone = params.phone ?? user.phone ?? null;
    user.role = params.role ?? user.role ?? null;
    user.passwordHash = passwordHash;

    await userRepo.save(user);
    console.log(`↺ Usuario actualizado: ${params.email} (${params.username})`);
  }

  return user;
}

async function bootstrap() {
  // Crea el contexto sin servidor HTTP
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);

    // 1) Roles mínimos
    const adminRole = await ensureRole(ds, 'admin', 'Administrator');
    const userRole  = await ensureRole(ds, 'user',  'Standard user');

    // 2) Admin por defecto
    await ensureUser(ds, {
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123$',
      firstName: 'System',
      lastName: 'Admin',
      isConfirmed: true,
      isVerified: true,
      isBlocked: false,
      role: adminRole,
      phone: '+10000000000',
    });

    // 3) Usuario demo (opcional)
    await ensureUser(ds, {
      username: 'demo',
      email: 'demo@example.com',
      password: 'Demo123$',
      firstName: 'Demo',
      lastName: 'User',
      isConfirmed: true,
      isVerified: true,
      isBlocked: false,
      role: userRole,
    });

    // 4) 10 usuarios adicionales con contraseña "password"
    for (let i = 1; i <= 30; i++) {
      const id = String(i).padStart(2, '0');
      await ensureUser(ds, {
        username: `user${id}`,
        email: `user${id}@example.com`,
        password: 'password',
        firstName: 'User',
        lastName: id,
        isConfirmed: true,
        isVerified: true,
        isBlocked: false,
        role: userRole,
      });
    }

    console.log('🎉 Seed de usuarios completado.');
  } catch (err) {
    console.error('❌ Error durante el seed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
