# Guía de API Keys

## Descripción

Este sistema permite autenticación mediante API keys para terceros autorizados, además del sistema JWT existente. Las API keys proporcionan una forma segura de acceder a endpoints específicos sin necesidad de autenticación de usuario.

## Características

- ✅ Autenticación híbrida (JWT + API Key)
- ✅ Gestión completa de API keys (CRUD)
- ✅ Expiración configurable
- ✅ Seguimiento de último uso
- ✅ Regeneración de keys
- ✅ Almacenamiento seguro (hash SHA-256)

## Gestión de API Keys

### Crear una nueva API Key

```bash
POST /api/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Integration Partner XYZ",
  "description": "API key para integración con sistema de terceros",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Respuesta:**
```json
{
  "id": "uuid-here",
  "name": "Integration Partner XYZ",
  "description": "API key para integración con sistema de terceros",
  "apiKey": "pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "isActive": true,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

> ⚠️ **Importante**: La API key en texto plano (`apiKey`) solo se muestra una vez. Guárdala de forma segura.

### Listar API Keys

```bash
GET /api/api-keys
Authorization: Bearer <jwt_token>
```

### Regenerar una API Key

```bash
POST /api/api-keys/{id}/regenerate
Authorization: Bearer <jwt_token>
```

### Actualizar una API Key

```bash
PATCH /api/api-keys/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "isActive": false,
  "description": "API key desactivada temporalmente"
}
```

### Eliminar una API Key

```bash
DELETE /api/api-keys/{id}
Authorization: Bearer <jwt_token>
```

## Uso de API Keys

### Método 1: Header x-api-key

```bash
GET /api/smt-api/accounts
x-api-key: pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Método 2: Authorization Header

```bash
GET /api/smt-api/accounts
Authorization: ApiKey pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## Endpoints que Soportan API Keys

Actualmente, los siguientes endpoints soportan autenticación híbrida:

- `GET /api/smt-api/accounts` - Listar cuentas
- `GET /api/smt-api/accounts/{accountId}` - Obtener cuenta específica
- `POST /api/smt-api/accounts/{accountId}` - Ingerir datos de cuenta
- `POST /api/smt-api/connection-status` - Estado de conexión

## Implementación para Desarrolladores

### Marcar un endpoint para aceptar API Keys

```typescript
import { HybridAuth } from '@/common/decorators/hybrid-auth.decorator';

@HybridAuth() // Permite tanto JWT como API key
@Controller('mi-controlador')
export class MiController {
  // endpoints...
}
```

### Solo API Key (sin JWT)

```typescript
import { ApiKeyAuth } from '@/common/decorators/api-key.decorator';
import { UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@ApiKeyAuth()
@Controller('mi-controlador')
export class MiController {
  // endpoints...
}
```

## Seguridad

### Buenas Prácticas

1. **Rotación Regular**: Regenera las API keys periódicamente
2. **Principio de Menor Privilegio**: Crea API keys específicas para cada integración
3. **Monitoreo**: Revisa regularmente el campo `lastUsedAt`
4. **Expiración**: Configura fechas de expiración apropiadas
5. **Desactivación**: Desactiva inmediatamente las keys comprometidas

### Almacenamiento

- Las API keys se almacenan como hash SHA-256 en la base de datos
- La key en texto plano nunca se guarda
- Solo se muestra la key completa una vez al crearla o regenerarla

## Variables de Entorno

No se requieren variables de entorno adicionales. El sistema usa la base de datos para gestionar las API keys.

## Migración

Ejecuta la migración para crear la tabla:

```sql
-- Ver: src/database/migrations/001-create-api-keys-table.sql
```

## Troubleshooting

### Error: "API Key is required"
- Verifica que estés enviando la API key en el header correcto
- Asegúrate de que el endpoint soporte autenticación por API key

### Error: "Invalid API Key"
- Verifica que la API key sea correcta
- Confirma que la key esté activa (`isActive: true`)
- Verifica que no haya expirado

### Error: "Valid JWT token or API key required"
- El endpoint requiere autenticación pero no se proporcionó ninguna válida
- Proporciona un JWT válido o una API key válida