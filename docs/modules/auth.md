# Módulo: Autenticación (auth)

Documentación detallada del módulo de autenticación.

## Endpoints

| Método | Ruta | Público | Descripción |
|--------|------|---------|-------------|
| POST | /api/auth/register | Sí | Crea un usuario nuevo (aplica lógica primer super_admin) |
| POST | /api/auth/login | Sí | Autentica y devuelve tokens |
| POST | /api/auth/refresh | Sí | Renueva access token usando refresh token |
| POST | /api/auth/reset-password | Sí | Solicita email con link de reseteo |
| GET  | /api/auth/profile | No | Devuelve payload JWT enriquecido |

## Registro
### Reglas Especiales
- Si `FIRST_USER_SUPERADMIN=true` y es el primer usuario (`count()==0`) => rol super_admin.
- En caso contrario asigna rol "user" si existe.

### Body ejemplo
```json
{
  "username": "admin1",
  "email": "admin1@example.com",
  "password": "SecurePassword123!",
  "firstName": "Admin",
  "lastName": "One",
  "phone": "+1234567890"
}
```

### Respuesta ejemplo (éxito)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "userID": "...", "email": "admin1@example.com", "roleID": "...", "role": {"name": "super_admin"} },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

## Login
Body:
```json
{"email": "admin1@example.com", "password": "SecurePassword123!"}
```
Respuesta (fragmento):
```json
{
  "data": {
    "user": { "email": "admin1@example.com", "role": {"name":"super_admin"} },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

## Refresh Token
- Endpoint: `POST /api/auth/refresh`
- Body:
```json
{ "refreshToken": "<refresh_token>" }
```

## Perfil
- Endpoint: `GET /api/auth/profile`
- Header: `Authorization: Bearer <access_token>`
- Devuelve: `{ userID, email, username, roles[], permissions[] }`

## Permisos y Roles en JWT
- No se incluyen directamente en el token; se cargan al validar en `JwtStrategy.validate`.

## Errores comunes
| Código | Motivo | Solución |
|--------|--------|----------|
| 401 | Invalid credentials | Verificar email/password |
| 401 | Invalid refresh token | Usar refresh válido y no expirado |
| 409 | User exists | Cambiar email/username |
| 500 | SMTP ECONNREFUSED | Configurar MAIL_HOST/PORT o desactivar envío en dev |

## Flags de comportamiento
| Flag | Efecto |
|------|--------|
| FIRST_USER_SUPERADMIN | Primer usuario => super_admin |
| SEED_ON_BOOT | Sembrar roles/permisos base al arrancar |

## Buenas prácticas
- Desactivar FIRST_USER_SUPERADMIN tras crear el primer administrador.
- Mantener SEED_ON_BOOT=false tras primer seed.
- No usar DB_DROP_SCHEMA=true salvo ambiente temporal.

## Próximas mejoras sugeridas
- Toggle EMAIL_ENABLED para evitar fallos en dev.
- Endpoint de confirmación de email.
- Endpoint de cambio de contraseña autenticado.
