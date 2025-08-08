# Arquitectura de Gestión de Datos para PropFirm

## Problema

- Gran volumen de datos de MetaTrader (posiciones, balance, equity)
- Análisis frecuentes de reglas de fondeo
- Operaciones cada pequeños intervalos
- Necesidad de preservar rendimiento y consistencia

## Solución Propuesta: Arquitectura de Buffer Inteligente

### 1. Capa de Ingesta (API Gateway + Buffer)

```
API MetaTrader → Redis Stream → Procesamiento → PostgreSQL
```

### 2. Componentes Principales

#### A. Redis como Buffer Principal

- **Redis Streams**: Para datos en tiempo real (posiciones activas, precios)
- **Redis Hash**: Para estado actual de cuentas (balance, equity, estado)
- **Redis Sorted Sets**: Para métricas históricas ordenadas por tiempo
- **Redis Lists**: Para cola de análisis pendientes

#### B. Sistema de Colas (Bull/BullMQ)

- **Cola de Ingesta**: Procesar datos crudos de la API
- **Cola de Análisis**: Validar reglas de fondeo
- **Cola de Persistencia**: Guardar resultados críticos en BD
- **Cola de Notificaciones**: Alertas de violaciones de reglas

#### C. Estrategia de Persistencia Híbrida

- **Datos en caliente**: Redis (últimas 24-48h)
- **Datos críticos**: PostgreSQL inmediato (violaciones, alerts)
- **Datos históricos**: PostgreSQL batch (cada 5-15 min)
- **Métricas agregadas**: PostgreSQL (diario/semanal)

### 3. Flujo de Datos

#### Ingesta de Datos

```typescript
API MetaTrader → Redis Stream →
├── Análisis Inmediato (crítico)
├── Buffer Temporal (no crítico)
└── Persistencia Diferida
```

#### Análisis de Reglas

```typescript
Redis Data → Validation Rules →
├── Pass → Update Redis State
├── Violation → Immediate DB + Alert
└── Risk → Enhanced Monitoring
```

### 4. Ventajas de esta Arquitectura

#### Performance

- ✅ Acceso ultra-rápido a datos activos
- ✅ Reducción de carga en PostgreSQL
- ✅ Procesamiento asíncrono de análisis

#### Escalabilidad

- ✅ Procesamiento distribuido con colas
- ✅ Horizontal scaling de workers
- ✅ Particionado de datos por timeframes

#### Confiabilidad

- ✅ Persistencia crítica inmediata
- ✅ Recuperación ante fallos
- ✅ Auditoría completa de eventos

### 5. Configuración de Retención

#### Redis TTL Strategy

```
- Posiciones activas: Sin TTL (hasta cierre)
- Balance/Equity actual: 24h TTL
- Métricas por minuto: 4h TTL
- Análisis temporal: 1h TTL
```

#### PostgreSQL Strategy

```
- Eventos críticos: Inmediato
- Snapshots de cuenta: Cada 5 min
- Agregaciones: Cada 15 min
- Historial completo: Batch nocturno
```

### 6. Monitoreo y Alertas

#### Métricas Clave

- Latencia de ingesta
- Cola de trabajos pendientes
- Uso de memoria Redis
- Violaciones de reglas detectadas

#### Health Checks

- Conectividad API → Redis
- Estado de colas
- Sincronización Redis ↔ PostgreSQL
