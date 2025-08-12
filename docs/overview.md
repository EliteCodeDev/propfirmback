# Visión General de la API

La API PropFirm está construida con NestJS + TypeORM + PostgreSQL. Usa JWT para autenticación y un modelo de Roles y Permisos.

## Arquitectura
- NestJS Modular
- Autenticación JWT (access + refresh)
- RBAC simplificado (1:N Role -> Users) + tabla pivote RolePermission
- Envío de emails (MailerModule)
- Semilla opcional de roles/permisos y promoción del primer usuario a `super_admin`

## Flujo de Autenticación (Resumen)
1. Registro: POST /api/auth/register
2. Login: POST /api/auth/login (retorna tokens)
3. Acceso a endpoints protegidos: Authorization: Bearer <access_token>
4. Refresh token: POST /api/auth/refresh

## Roles / Permisos
- Roles base: super_admin, admin, user
- Permiso wildcard: `*` asignado a super_admin
- Guard de roles y guard de permisos (decoradores @Auth y @Permissions)

## Flags de entorno clave
| Variable | Propósito |
|----------|-----------|
| FIRST_USER_SUPERADMIN | Si true y no hay usuarios, primer registro => super_admin |
| SEED_ON_BOOT | Si true, crea roles/permisos base al arrancar |
| DB_DROP_SCHEMA | Si true, borra todo el schema al arrancar (solo local/test) |
| DB_SYNCHRONIZE | Controla synchronize de TypeORM (solo dev) |

## Estándares
- Prefijo global: /api
- Documentación Swagger: /api/docs
- Validación global con ValidationPipe (whitelist, forbidNonWhitelisted)
- Interceptor de respuesta para envoltorio estándar { success, message, data }

## Próximos Documentos
- modules/auth.md (detallado ya creado)
- modules/challenges.md
- modules/users.md
- modules/roles-permissions.md
