# Guía de implementación de módulos/feature (Backend – NestJS)

Alcance: esta guía aplica a nuevos módulos en propfirmback (NestJS + TypeORM).

1) Estructura del módulo
- Ubicación: src/modules/<feature>/ con controller.ts, service.ts, module.ts, entities/, dto/.
- Module: importa TypeOrmModule.forFeature([...entidades]) y exporta el servicio si lo usarán otros módulos.

2) Entidades (TypeORM)
- Define entidades en entities/. Usa nombres de columnas explícitos si difieren del dominio. Declara relaciones (ManyToOne/OneToMany) con cascade sólo cuando sea necesario.

3) DTOs y validación
- Crea dto/create-*.dto.ts, update-*.dto.ts y <feature>-query.dto.ts cuando aplique.
- Usa class-validator/class-transformer; define enums explícitos y valores válidos del dominio.
- Ejemplo: UpdateWithdrawalStatusDto debe aceptar 'pending' | 'approved' | 'paid' | 'rejected'. Si status === 'rejected', exige rejectionDetail. Permite observation opcional.

4) Controller
- Sigue REST: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id. Para transiciones específicas: PATCH /:id/status.
- Paginación: recibe @Query() <Feature>QueryDto con page, limit y filtros opcionales. Devuelve { data, meta } con totalItems y totalPages.
- Autorización: aplica guards/decorators necesarios (roles, admin) según el caso.

5) Service
- Inyecta repositorios con @InjectRepository.
- findAll: aplica filtros (ej. status, email) con where/relations adecuados y paginación. Devuelve [items, total] y transforma al shape { data, meta } en el controller.
- update: valida existencia, asigna campos permitidos (Object.assign) y guarda.
- Transiciones de estado: valida reglas de negocio (p.ej., require rejectionDetail al rechazar; side-effects al aprobar).

6) Errores y logs
- Usa BadRequestException para validaciones, NotFoundException para recursos inexistentes, ForbiddenException para permisos.
- No expongas detalles sensibles en mensajes de error. Loguea en el servidor con contexto.

7) Consistencia con frontend
- Mantén nombres de campos y enums estables. Documenta cambios en /docs/ y comunica a frontend.
- Si cambias contratos (query, payload), actualiza DTOs y anota estados válidos.

8) Definition of Done (DoD)
- Módulo registrado (module.ts) y rutas expuestas (controller.ts) con validación y guards apropiados.
- DTOs completos (create/update/query) con reglas de validación y enums.
- Service implementado con filtros, paginación y reglas de negocio.
- Respuestas consistentes ({ data, meta } en listados) y manejo de errores correcto.
- Probado manualmente (flujos clave, validaciones, permisos) y con datos de ejemplo/seed si corresponde.

9) Linting, formateo y gating de build
- Estándar: usa ESLint y Prettier del repo. No agregues configs paralelas; extiende las existentes (.eslintrc.js y .prettierrc).
- Gating del build por lint: 
  - Recomendado en CI: ejecuta `npm ci && npm run lint && npm run build`. Si `lint` falla, el pipeline se detiene.
  - Opcional local: añade en package.json `"prebuild": "npm run lint"` para que el build falle si hay errores de lint.
  - Forzar fallo con warnings: en el script `lint` usa `--max-warnings=0` para que también los warnings bloqueen.
  - Ejemplo de scripts:
    - "lint": "eslint \"src/**/*.{ts,tsx}\" --max-warnings=0"
    - "format": "prettier --write ."
    - "prebuild": "npm run lint"
- Alcance de lint: limita a src/ y excluye paths innecesarios con .eslintignore (por ejemplo, dist/, scripts/ si procede).
- Arreglo rápido: usa `npm run lint -- --fix` para autofix donde sea seguro; revisa manualmente reglas no autofixables.
- TypeScript estricto (sugerido): activa `noUnusedLocals` y `noUnusedParameters` en tsconfig para mejorar calidad (adáptalo si rompe código legado).

Actualiza DoD
- Agrega a Definition of Done: "lint sin errores (y sin warnings, si `--max-warnings=0`)" y "el build debe estar protegido por el paso de lint en CI (o prebuild local)".


## Scripts de orquestación de seeds

Además del script general de orquestación, existe un script mínimo para reiniciar la base de datos y crear el primer usuario sin ejecutar todos los seeders.

- scripts/orchestrate-seed.ps1
  - Orquesta el reseteo de BD, seedings base y carga de datos de ejemplo completos.

- scripts/orchestrate-seed-firstuser.ps1
  - Flujo mínimo: reinicia BD sin seeds, habilita SEED_ON_BOOT y FIRST_USER_SUPERADMIN, crea el primer usuario (mismo usuario/credenciales definidos en el seeder original) y deja el .env final en:
    - DB_DROP_SCHEMA=false
    - DB_SYNCHRONIZE=true
    - SEED_ON_BOOT=false
    - FIRST_USER_SUPERADMIN=false
  - Uso (PowerShell):
    - powershell -NoProfile -ExecutionPolicy Bypass -File c:\ELITE\prop\propfirmback\scripts\orchestrate-seed-firstuser.ps1

Notas
- Ambos scripts actualizan .env automáticamente y usan los npm scripts de seeding definidos en package.json.
- El script mínimo no ejecuta los seeders masivos (usuarios de ejemplo, templates, challenges, cuentas de broker); sólo prepara la BD y garantiza el primer usuario.