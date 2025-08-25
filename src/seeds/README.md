# PropFirm Database Seeds

Este directorio contiene archivos de seed para poblar la base de datos con datos realistas para desarrollo y testing.

## 📋 Archivos de Seed Disponibles

### 🏃‍♂️ Ejecución Rápida

```bash
# Ejecutar todos los seeds en orden correcto
npm run seed:all

# O manualmente:
npx ts-node src/seeds/seed-all-data.ts
```

### 📁 Archivos Individuales

#### 1. **seed-users-realistic.ts**
- **Propósito**: Crea usuarios con datos realistas
- **Genera**: 50+ usuarios con perfiles completos
- **Incluye**: 
  - Usuarios verificados y no verificados
  - Diferentes roles (trader, admin, etc.)
  - Direcciones completas
  - Datos de contacto realistas
  - Estados variados (activo, bloqueado, etc.)

```bash
npx ts-node src/seeds/seed-users-realistic.ts
```

#### 2. **seed-affiliates.ts**
- **Propósito**: Crea sistema de afiliados con jerarquías
- **Genera**: Red de afiliados multinivel
- **Incluye**:
  - Afiliado principal
  - Sub-afiliados con diferentes niveles
  - Códigos de referencia únicos
  - Comisiones variadas
  - Estados activos/inactivos

```bash
npx ts-node src/seeds/seed-affiliates.ts
```

#### 3. **seed-broker-accounts-realistic.ts**
- **Propósito**: Crea cuentas de broker para trading
- **Genera**: 100+ cuentas de broker
- **Incluye**:
  - Diferentes servidores (MT4, MT5)
  - Plataformas variadas
  - Balances iniciales realistas
  - Credenciales de acceso
  - Estados de uso

```bash
npx ts-node src/seeds/seed-broker-accounts-realistic.ts
```

#### 4. **seed-challenge-templates-comprehensive.ts**
- **Propósito**: Crea templates completos para challenges
- **Genera**: Sistema completo de templates
- **Incluye**:
  - Categorías (Two-Step, One-Step, Instant Funding)
  - Planes de trading (Standard, Aggressive, Conservative)
  - Balances ($5K a $400K)
  - Stages (Phase 1, Phase 2, Funded)
  - Reglas de trading (profit targets, drawdown, etc.)
  - Relaciones y parámetros completos

```bash
npx ts-node src/seeds/seed-challenge-templates-comprehensive.ts
```

#### 5. **seed-challenges-realistic.ts**
- **Propósito**: Crea challenges basados en templates
- **Genera**: Challenges en diferentes estados
- **Incluye**:
  - Challenges activos, completados, fallidos
  - Diferentes fases de progreso
  - Balances dinámicos
  - Fechas realistas
  - Relaciones con usuarios y templates

```bash
npx ts-node src/seeds/seed-challenges-realistic.ts
```

#### 6. **seed-orders.ts**
- **Propósito**: Crea órdenes de compra de challenges
- **Genera**: Historial de compras realista
- **Incluye**:
  - Productos típicos de prop firms
  - Estados variados (completado, pendiente, fallido)
  - Precios con descuentos ocasionales
  - IDs de WooCommerce
  - Fechas de compra realistas

```bash
npx ts-node src/seeds/seed-orders.ts
```

#### 7. **seed-certificates.ts**
- **Propósito**: Crea certificados para challenges aprobados
- **Genera**: Certificados de diferentes tipos
- **Incluye**:
  - Certificados de Phase 1, Phase 2, Real Account
  - Certificados de retiro
  - QR codes únicos
  - Montos certificados
  - Fechas de emisión

```bash
npx ts-node src/seeds/seed-certificates.ts
```

#### 8. **seed-withdrawals.ts**
- **Propósito**: Crea solicitudes de retiro
- **Genera**: Historial de retiros realista
- **Incluye**:
  - Estados variados (pagado, pendiente, rechazado)
  - Diferentes tipos de wallet (crypto, banco, PayPal)
  - Montos realistas
  - Observaciones y razones de rechazo
  - Fechas de solicitud

```bash
npx ts-node src/seeds/seed-withdrawals.ts
```

#### 9. **seed-verifications.ts**
- **Propósito**: Crea verificaciones KYC
- **Genera**: Proceso de verificación completo
- **Incluye**:
  - Estados variados (aprobado, pendiente, rechazado)
  - Diferentes tipos de documento (DNI, Pasaporte, etc.)
  - Archivos de media asociados
  - Razones de rechazo realistas
  - Fechas de procesamiento

```bash
npx ts-node src/seeds/seed-verifications.ts
```

#### 10. **seed-all-data.ts**
- **Propósito**: Ejecuta todos los seeds en orden correcto
- **Funcionalidad**: Master script que maneja dependencias
- **Incluye**:
  - Ejecución secuencial
  - Manejo de errores
  - Reporte de progreso
  - Resumen final

## 🔄 Orden de Ejecución

Los seeds deben ejecutarse en este orden debido a las dependencias:

1. **seed-users-realistic.ts** - Base de usuarios
2. **seed-affiliates.ts** - Sistema de afiliados
3. **seed-broker-accounts-realistic.ts** - Cuentas de broker
4. **seed-challenge-templates-comprehensive.ts** - Templates de challenges
5. **seed-challenges-realistic.ts** - Challenges basados en templates
6. **seed-orders.ts** - Órdenes de compra
7. **seed-certificates.ts** - Certificados para challenges
8. **seed-withdrawals.ts** - Solicitudes de retiro
9. **seed-verifications.ts** - Verificaciones KYC

## 🛠️ Configuración

### Prerrequisitos

```bash
# Instalar dependencias
npm install

# Asegurar que la base de datos esté configurada
npm run migration:run
```

### Variables de Entorno

Asegúrate de tener configuradas las variables de entorno necesarias:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=propfirm_db
```

## 📊 Datos Generados

Después de ejecutar todos los seeds, tendrás:

- **~50 usuarios** con perfiles completos
- **~20 afiliados** en estructura jerárquica
- **~100 cuentas de broker** listas para uso
- **Sistema completo de templates** con 3 tipos principales
- **~75 challenges** en diferentes estados
- **~60 órdenes** con historial de compras
- **~25 certificados** para challenges aprobados
- **~40 retiros** en diferentes estados
- **~30 verificaciones** KYC procesadas

## 🧪 Testing

### Limpiar Base de Datos

```bash
# Limpiar y recrear esquema
npm run schema:drop
npm run migration:run

# Ejecutar seeds nuevamente
npm run seed:all
```

### Verificar Datos

```sql
-- Verificar conteos
SELECT 'users' as table_name, COUNT(*) as count FROM "UserAccount"
UNION ALL
SELECT 'challenges', COUNT(*) FROM "Challenge"
UNION ALL
SELECT 'orders', COUNT(*) FROM "CustomerOrder"
UNION ALL
SELECT 'withdrawals', COUNT(*) FROM "Withdrawal";
```

## 🚨 Notas Importantes

1. **Solo para desarrollo**: Estos seeds están diseñados para entornos de desarrollo y testing
2. **Datos ficticios**: Todos los datos son generados con Faker.js y no representan información real
3. **Limpieza**: Los seeds verifican existencia antes de crear para evitar duplicados
4. **Dependencias**: Respeta el orden de ejecución para evitar errores de foreign key
5. **Performance**: La ejecución completa puede tomar varios minutos

## 🔧 Personalización

### Modificar Cantidades

Puedes ajustar las cantidades editando las constantes en cada archivo:

```typescript
// En seed-users-realistic.ts
const NUM_USERS = 50; // Cambiar según necesidad

// En seed-challenges-realistic.ts
const NUM_CHALLENGES = 75; // Ajustar cantidad
```

### Agregar Nuevos Datos

Para agregar nuevos tipos de datos:

1. Crea un nuevo archivo `seed-nuevo-modulo.ts`
2. Sigue el patrón de los archivos existentes
3. Agrega el archivo a `SEED_FILES` en `seed-all-data.ts`
4. Actualiza este README

## 📝 Scripts NPM Recomendados

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "seed:all": "ts-node src/seeds/seed-all-data.ts",
    "seed:users": "ts-node src/seeds/seed-users-realistic.ts",
    "seed:challenges": "ts-node src/seeds/seed-challenges-realistic.ts",
    "seed:templates": "ts-node src/seeds/seed-challenge-templates-comprehensive.ts",
    "db:reset": "npm run schema:drop && npm run migration:run && npm run seed:all"
  }
}
```

## 🤝 Contribución

Para contribuir con nuevos seeds:

1. Sigue el patrón de naming: `seed-[modulo]-[tipo].ts`
2. Incluye función `bootstrap()` principal
3. Usa `console.log` para feedback de progreso
4. Maneja errores apropiadamente
5. Documenta en este README

---

**¡Happy Seeding! 🌱**