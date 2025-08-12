# Sistema de Autenticación por API Keys

## 🎯 Resumen

Se ha implementado un sistema completo de autenticación por API keys que permite a terceros autorizados acceder a endpoints específicos sin necesidad de autenticación JWT. El sistema incluye:

- ✅ **Autenticación Híbrida**: Soporta tanto JWT como API keys
- ✅ **Gestión Completa**: CRUD completo para API keys
- ✅ **Seguridad**: Almacenamiento con hash SHA-256
- ✅ **Flexibilidad**: Expiración configurable y seguimiento de uso
- ✅ **Documentación**: Swagger integrado

## 📁 Archivos Implementados

### Guards (Guardias de Autenticación)
- `src/common/guards/api-key.guard.ts` - Guard específico para API keys
- `src/common/guards/hybrid-auth.guard.ts` - Guard híbrido (JWT + API key)

### Decorators (Decoradores)
- `src/common/decorators/api-key.decorator.ts` - Decorador para marcar endpoints con API key
- `src/common/decorators/hybrid-auth.decorator.ts` - Decorador para autenticación híbrida

### Módulo API Keys
- `src/modules/api-keys/api-key.entity.ts` - Entidad de base de datos
- `src/modules/api-keys/dto/create-api-key.dto.ts` - DTO para crear API keys
- `src/modules/api-keys/dto/update-api-key.dto.ts` - DTO para actualizar API keys
- `src/modules/api-keys/api-keys.service.ts` - Lógica de negocio
- `src/modules/api-keys/api-keys.controller.ts` - Endpoints REST
- `src/modules/api-keys/api-keys.module.ts` - Configuración del módulo

### Base de Datos
- `src/database/migrations/001-create-api-keys-table.sql` - Migración SQL

### Documentación y Scripts
- `API_KEYS_GUIDE.md` - Guía completa de uso
- `scripts/test-api-keys.js` - Script de testing

### Configuración
- `src/validation.schema.ts` - Validación actualizada
- `src/app.module.ts` - Configuración global actualizada

## 🚀 Cómo Empezar

### 1. Ejecutar Migración

```sql
-- Ejecutar en tu base de datos PostgreSQL
-- Ver: src/database/migrations/001-create-api-keys-table.sql
```

### 2. Crear tu Primera API Key

```bash
# Como administrador autenticado
POST /api/api-keys
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json

{
  "name": "Mi Primera API Key",
  "description": "Para testing",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### 3. Usar la API Key

```bash
# Método 1: Header x-api-key
GET /api/smt-api/accounts
x-api-key: pk_tu_api_key_aqui

# Método 2: Authorization header
GET /api/smt-api/accounts
Authorization: ApiKey pk_tu_api_key_aqui
```

## 🔧 Endpoints Disponibles

### Gestión de API Keys (Requiere Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/api-keys` | Crear nueva API key |
| GET | `/api/api-keys` | Listar todas las API keys |
| GET | `/api/api-keys/:id` | Obtener API key específica |
| PATCH | `/api/api-keys/:id` | Actualizar API key |
| DELETE | `/api/api-keys/:id` | Eliminar API key |
| POST | `/api/api-keys/:id/regenerate` | Regenerar API key |

### Endpoints que Soportan API Keys

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/smt-api/accounts` | Listar cuentas |
| GET | `/api/smt-api/accounts/:id` | Obtener cuenta |
| POST | `/api/smt-api/accounts/:id` | Ingerir datos |
| POST | `/api/smt-api/connection-status` | Estado conexión |

## 🛡️ Seguridad

### Características de Seguridad

1. **Hash SHA-256**: Las API keys se almacenan hasheadas
2. **Expiración**: Configurable por API key
3. **Seguimiento**: Campo `lastUsedAt` para auditoría
4. **Activación/Desactivación**: Control granular
5. **Regeneración**: Permite rotar keys sin perder configuración

### Buenas Prácticas

- 🔄 **Rota las keys regularmente**
- 📅 **Configura fechas de expiración**
- 👥 **Una key por integración/cliente**
- 📊 **Monitorea el uso con `lastUsedAt`**
- 🚫 **Desactiva keys comprometidas inmediatamente**

## 🧪 Testing

### Script Automatizado

```bash
# Configurar API_KEY en el script
node scripts/test-api-keys.js
```

### Testing Manual

```bash
# Test con curl
curl -H "x-api-key: pk_tu_api_key" \
     http://localhost:3000/api/smt-api/accounts

# Test con Authorization header
curl -H "Authorization: ApiKey pk_tu_api_key" \
     http://localhost:3000/api/smt-api/accounts
```

## 🔧 Para Desarrolladores

### Marcar Endpoint para API Keys

```typescript
// Solo API key
@UseGuards(ApiKeyGuard)
@ApiKeyAuth()
@Get('endpoint')
myEndpoint() { ... }

// Híbrido (JWT o API key)
@HybridAuth()
@Get('endpoint')
myEndpoint() { ... }
```

### Estructura de la API Key

```
pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
│  └─────────────────── 56 caracteres aleatorios ──────────────────┘
└─ Prefijo "pk_" (PropFirm Key)
```

## 📊 Monitoreo

### Campos de Auditoría

- `lastUsedAt`: Última vez que se usó la key
- `createdAt`: Cuándo se creó
- `updatedAt`: Última modificación
- `createdBy`: Quién la creó
- `isActive`: Estado actual
- `expiresAt`: Fecha de expiración

### Consultas Útiles

```sql
-- Keys más usadas
SELECT name, last_used_at 
FROM api_keys 
WHERE is_active = true 
ORDER BY last_used_at DESC;

-- Keys próximas a expirar
SELECT name, expires_at 
FROM api_keys 
WHERE expires_at < NOW() + INTERVAL '30 days'
AND is_active = true;

-- Keys nunca usadas
SELECT name, created_at 
FROM api_keys 
WHERE last_used_at IS NULL
AND is_active = true;
```

## 🚨 Troubleshooting

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "API Key is required" | No se envió la key | Verificar headers |
| "Invalid API Key" | Key incorrecta/expirada | Verificar key y expiración |
| "Valid JWT token or API key required" | Ambos fallan | Verificar autenticación |

### Debug

```typescript
// En desarrollo, puedes agregar logs
console.log('API Key received:', apiKey);
console.log('Validation result:', isValid);
```

## 📈 Próximos Pasos

### Mejoras Futuras

- [ ] Rate limiting por API key
- [ ] Scopes/permisos granulares
- [ ] Métricas de uso
- [ ] Notificaciones de expiración
- [ ] IP whitelisting
- [ ] Webhook para eventos

---

**¡El sistema está listo para usar!** 🎉

Para más detalles, consulta `API_KEYS_GUIDE.md`.