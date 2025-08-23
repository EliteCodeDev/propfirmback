 Brokeret API Endpoints

Este documento describe los endpoints disponibles para interactuar con la API de Brokeret a través del backend de PropFirm.

## Autenticación

Todos los endpoints requieren autenticación mediante API Key en el header:
```
X-API-Key: YOUR_BROKERET_API_KEY
```

La API Key se configura mediante la variable de entorno `BROKERET_API_KEY`.

## Base URL
```
POST /brokeret-api
```

## Endpoints Disponibles

### Gestión de Usuarios

#### Crear Usuario
```http
POST /brokeret-api/user/create
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "group": "demo",
  "firstName": "John",
  "lastName": "Doe",
  "leverage": 100,
  "rights": "enabled",
  "email": "john.doe@example.com",
  "masterPassword": "password123",
  "investorPassword": "investor123"
}
```

#### Obtener Usuario
```http
POST /brokeret-api/user/get
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "login": "12345"
}
```

#### Estadísticas de Usuario
```http
POST /brokeret-api/user/stats
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "login": "12345"
}
```

### Gestión de Cuentas

#### Activar/Desactivar Trading
```http
POST /brokeret-api/account/trading-activity
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "login": "12345",
  "tradingFlag": 1
}
```
- `tradingFlag`: 0 = desactivar, 1 = activar

#### Operación de Balance
```http
POST /brokeret-api/account/balance-operation
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "login": "12345",
  "amount": 1000,
  "type": 1,
  "TransactionComments": "Depósito inicial"
}
```
- `type`: 1 = depósito, 2 = retiro

### Posiciones

#### Listar Posiciones Abiertas
```http
POST /brokeret-api/positions/open
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "Login": ["12345", "67890"]
}
```

#### Listar Posiciones Cerradas
```http
POST /brokeret-api/positions/closed
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "flag": 1,
  "Login": ["12345"],
  "FromDate": "01/01/2024",
  "ToDate": "31/01/2024",
  "fromTime": "00:00:00",
  "toTime": "23:59:59"
}
```

### Órdenes

#### Listar Órdenes de Usuario
```http
POST /brokeret-api/orders/user
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "login": "12345",
  "FromDate": "01/01/2024",
  "ToDate": "31/01/2024"
}
```

### Risk Management

#### Puntuación Total de Riesgo
```http
POST /brokeret-api/risk/total-score
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "login": "12345"
}
```

#### Puntuación de Riesgo del Día
```http
POST /brokeret-api/risk/today-score
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "login": "12345"
}
```

### Estadísticas Prop

#### Estadísticas de Prop Trading
```http
POST /brokeret-api/stats/prop
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "logins": ["12345", "67890"],
  "model": "standard"
}
```

### Endpoint Genérico

#### Llamada Personalizada
```http
POST /brokeret-api/raw/{method}/{path}
Content-Type: application/json
X-API-Key: YOUR_BROKERET_API_KEY

{
  "customData": "value"
}
```

Ejemplo:
```http
POST /brokeret-api/raw/post/custom/endpoint
```

## Variables de Entorno

Asegúrate de configurar las siguientes variables de entorno:

```env
# API Key para Brokeret
BROKERET_API_KEY=your-brokeret-api-key-here
```

## Respuestas

Todas las respuestas siguen el formato estándar de Brokeret API:

```json
{
  "success": true,
  "result": {
    // Datos específicos del endpoint
  }
}
```

En caso de error:

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## Notas Importantes

1. Todos los endpoints están protegidos por el guard de API Key genérico
2. Las fechas deben estar en formato `dd/MM/yyyy`
3. Las horas deben estar en formato `HH:mm:ss`
4. Los logins pueden ser strings o números
5. El endpoint genérico permite hacer llamadas personalizadas a cualquier endpoint de Brokeret API