# Styles Module

Este módulo maneja la configuración de estilos y branding para la aplicación PropFirm.

## Características

- **Gestión de colores**: Colores primario, secundario y terciario en formato hexadecimal
- **Banner personalizable**: URL o ruta del banner desde variables de entorno
- **Información de empresa**: Nombre de la empresa y URL de landing
- **Estados activos**: Control de qué estilo está actualmente activo
- **Nombres identificadores**: Nombres únicos para cada configuración de estilo

## Entidad Style

```typescript
{
  styleID: string;           // UUID único
  primaryColor: string;      // Color primario (#RRGGBB)
  secondaryColor: string;    // Color secundario (#RRGGBB)
  tertiaryColor: string;     // Color terciario (#RRGGBB)
  banner?: string;           // URL/ruta del banner (opcional)
  companyName: string;       // Nombre de la empresa
  landingURL?: string;       // URL de landing (opcional)
  isActive: boolean;         // Si está activo (default: true)
  name?: string;             // Nombre del estilo (opcional)
  createdAt: Date;           // Fecha de creación
  updatedAt: Date;           // Fecha de actualización
}
```

## Endpoints API

### GET /styles
Obtiene todos los estilos con paginación

### GET /styles/active
Obtiene el estilo actualmente activo

### GET /styles/:id
Obtiene un estilo específico por ID

### POST /styles
Crea un nuevo estilo (requiere rol de admin)

### PATCH /styles/:id
Actualiza un estilo existente (requiere rol de admin)

### PATCH /styles/:id/activate
Activa un estilo específico (requiere rol de admin)

### DELETE /styles/:id
Elimina un estilo (requiere rol de admin)

## Variables de Entorno

Configura estas variables en tu archivo `.env`:

```env
# Control de activación del seeder
ACTIVAR_STYLE=true

# Configuración de style por defecto
DEFAULT_BANNER_URL=https://tu-dominio.com/banner.jpg
DEFAULT_COMPANY_NAME=Tu Empresa
DEFAULT_LANDING_URL=https://tu-empresa.com
DEFAULT_PRIMARY_COLOR=#007bff
DEFAULT_SECONDARY_COLOR=#6c757d
DEFAULT_TERTIARY_COLOR=#28a745
```

### Variable ACTIVAR_STYLE

- **`ACTIVAR_STYLE=true`**: El seeder creará automáticamente un style por defecto usando las variables de entorno
- **`ACTIVAR_STYLE=false`** o no definida: El seeder no creará ningún style automáticamente

Esto te permite controlar cuándo quieres que se genere el style inicial.

## Seeder

Para crear el estilo por defecto:

```bash
npm run seed:styles
```

## Migración

La migración `CreateStyleTable` crea la tabla con todos los campos necesarios y comentarios descriptivos.

## Uso en Templates

Los templates pueden obtener la configuración de estilo activa mediante:

```typescript
// En tu servicio o controlador
const activeStyle = await this.stylesService.findActive();
```

Esto permitirá que los templates utilicen:
- `activeStyle.primaryColor` para el color primario
- `activeStyle.secondaryColor` para el color secundario
- `activeStyle.tertiaryColor` para el color terciario
- `activeStyle.banner` para la imagen del banner
- `activeStyle.companyName` para el nombre de la empresa
- `activeStyle.landingURL` para enlaces de landing