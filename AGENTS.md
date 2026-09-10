# AGENTS.md — PAE (Programa de Alimentación Escolar)

## Qué es este proyecto

Sistema web para gestionar el programa de alimentación escolar colombiano. Reduce el desperdicio de alimentos mediante reservas, control de asistencia, menús semanales, y reportes de sobrantes.

**Stack:**
- Frontend: React 19 + TypeScript + Vite (SPA en `frontend/`)
- Backend: Node.js + Express (API REST en `backend/`)
- Base de datos: Supabase (PostgreSQL)
- Deploy: Render (backend), Vercel/similar (frontend)

## Cómo correr el proyecto

```bash
# Backend (puerto 4000)
cd backend
npm install
npm run dev

# Frontend (puerto 5173)
cd frontend
npm install
npm run dev
```

**Frontend build/lint:**
```bash
cd frontend
node ".\node_modules\typescript\bin\tsc" -b    # typecheck
node ".\node_modules\vite\bin\vite.js" build   # build producción
node ".\node_modules\oxlint\bin\oxlint" src    # lint
```

**PowerShell en Windows:** No usar `npx` (bloqueado por execution policy). Usar `node ".\node_modules\<pkg>\bin\<bin>"` directamente.

## Estructura del proyecto

```
Default Project/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express, monta todas las rutas bajo /api
│   │   ├── config/
│   │   │   ├── supabase.js    # Cliente Supabase (service role key)
│   │   │   ├── auth.js        # JWT HMAC, requiereRol(), firmarToken()
│   │   │   ├── settings.js    # leerSettings() — hora límite + cupos
│   │   │   └── auditoria.js   # auditar() — registra acciones en auditoria
│   │   └── routes/            # 20+ archivos de rutas Express
│   ├── scripts/               # Datos demo re-ejecutables (ver "Datos demo")
│   │   ├── cargar-menu.cjs    # Completa semanas del menú vía API
│   │   └── sembrar-datos.cjs  # Beneficiarios, cuentas, reservas, asistencia
│   ├── setup.sql              # DDL completo + datos semilla
│   └── .env                   # Variables de entorno (NO subir a git)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Admin.tsx      # Panel admin (~570 líneas: solo estado global + render por pestaña)
│       │   ├── Reserva.tsx    # Flujo de reserva del estudiante
│       │   ├── Home.tsx       # Página pública principal
│       │   ├── Menu.tsx       # Menú público semanal
│       │   └── ...
│       ├── config/
│       │   ├── api.ts         # API_URL (VITE_API_URL o localhost:4000)
│       │   └── sesion.ts      # cabeceras(), leerSesion()
│       └── index.css          # Estilos globales
├── docs/
│   └── ideas-roles.md
├── render.yaml                # Config deploy Render
└── AGENTS.md                  # Este archivo
```

## Base de datos (Supabase)

- Proyecto: `postgres.aeortsskfobulpzcjdpu`
- URL de conexión en `backend/.env` como `DATABASE_URL`
- Service role key en `SUPABASE_SERVICE_ROLE_KEY`
- **RLS está cerrado** — el backend usa service role para todo

### Tablas principales
- `menus` — catálogo semanal (semana/dia/jornada/platillo), tiene columna `estado` ('publicado'/'borrador')
- `avisos` — avisos del programa, tiene columna `estado` ('publicado'/'borrador')
- `reservas` — reservas de estudiantes por fecha
- `beneficiarios` — estudiantes registrados (documento, nombre, sede, grado, PIN)
- `sedes` — sedes del programa
- `usuarios` — cuentas del panel (admin, coordinador, profesor, cocina, estudiante)
- `settings` — configuración: `hora_limite_reserva` (HH:MM), `cupos_sede` (JSON)
- `turnos_cocina` — turnos de personal de cocina por fecha/sede
- `auditoria` — registro de acciones del admin/coordinador
- `sobrantes` — reportes de comida sobrante
- `incidentes` — reportes de incidentes
- `instituciones` — instituciones educativas
- `notificaciones`, `contacto`, `chat`, `galeria_fotos`

### Migraciones SQL
Para aplicar cambios del `setup.sql` a Supabase, usar el runner:
```bash
# Temporal — se creó en C:\Users\luis\AppData\Local\Temp\opencode\run-setup.cjs
# Usa pg instalado en ...\pgtmp con DATABASE_URL de backend/.env
node "C:\Users\luis\AppData\Local\Temp\opencode\run-setup.cjs"
```
**NOTA:** Este runner está en `%TEMP%` — se pierde con el formateo. Si se necesita recrear, es un script que lee `setup.sql` y ejecuta cada statement con `pg`.

## Datos demo

Los scripts de `backend/scripts/` re-ejecutan los datos de demostración (idempotentes):

```bash
cd backend
node scripts/sembrar-datos.cjs   # beneficiarios + cuentas + reservas + asistencia
node scripts/cargar-menu.cjs     # completa semanas del menú vía API
```

- PIN de estudiantes y profesora Laura: `1234`. Usuarios estudiantes = su documento.
- Profesor Christian (Enrique Olaya Herrera / Almuerzo / 11-2) y prof. Laura (Sede principal / Almuerzo / 10-2).
- `sembrar-datos.cjs` usa `SUPABASE_SERVICE_ROLE_KEY` directo; `cargar-menu.cjs` usa el API y firma token con `ADMIN_SECRET` (o `ADMIN_CLAVE`).

## Autenticación y roles

El token JWT usa HMAC-SHA256 con secreto = `ADMIN_CLAVE` del `.env`.

**Payload del token:**
```json
{ "sub": "usuario", "rol": "admin", "nombre": "Nombre", "exp": 1234567890 }
```

`req.usuario` en las rutas es este payload.

**Roles:** admin, coordinador, profesor, cocina, estudiante

**Middleware:** `requiereRol("admin", "coordinador")` — ver rol en `req.usuario.rol`

## Configuración del sistema (settings)

- `hora_limite_reserva`: string "HH:MM" — antes de esta hora se permite reservar/cancelar el día actual
- `cupos_sede`: objeto `{ "Sede A": 40, "Sede B": 0 }` — 0 o vacío = sin cupo

Las keys en la DB y en el frontend son **snake_case**: `hora_limite_reserva`, `cupos_sede`.

## Convenciones del código

- **Admin.tsx** (~580 líneas) monta los 17 componentes de `frontend/src/pages/admin/`: solo tiene estado global (login + listas de `cargarDatos`) y render por pestaña. La lógica de cada pestaña vive en hooks de `frontend/src/pages/admin/hooks/` (`useMenu`, `useAsistencia`, `useReportes`, ...); cada hook recibe sus dependencias externas (`rol`, `sedes`, `menu`, `subirImagen`, `cargarDatos`, `setError`, ...) y retorna el contrato `interface Props` de su `Tab*.tsx`.
- Para leer Admin.tsx, usar `node -e` con `join(' | ')` como workaround porque la herramienta `read` corrompe archivos grandes del proyecto.
- El backend usa `import "dotenv/config"` al inicio de `server.js`.
- Las rutas usan `Router()` de Express, export default al final.
- Las imágenes se suben a Supabase Storage (bucket `imagenes`) y se guardan como URL en la DB. La subida centralizada está en `backend/src/config/almacenamiento.js` (`subirImagen`, `ErrorValidacion`).
- El frontend usa `API_URL` de `api.ts` para las peticiones.
- `cabeceras()` agrega `Authorization: Bearer <token>` y `Content-Type: application/json`.
- `cabeceras(false)` solo agrega Authorization (para GETs).

## Estado actual del desarrollo

### Completado
- Backend completo: todas las rutas funcionando, migraciones aplicadas
- Admin.tsx: refactor en 17 componentes (`frontend/src/pages/admin/`), panel con todas las pestañas (panel, sedes, instituciones, galería, menú, avisos, beneficiarios, usuarios, reportes, chat, notificaciones, asistencia, incidentes, **configuración, turnos, auditoría**)
- Estados borrador/publicado en avisos y menú
- Hora límite y cupos por sede en reservas
- Turnos de cocina
- Auditoría de acciones
- Coordinador con permisos para beneficiarios y turnos
- Menú completo: semanas 1-4 con 10 platos cada una
- Datos demo de asistencia sembrados (grupo del prof. Christian visible para hoy)
- Chat PAE Bot: historial persistido en DB (tabla `chatbot_mensajes`) por sesión de navegador
- Reserva.tsx: hora límite visible, inasistencias, recordatorio (implementado y verificado)
- Home/Menu: filtrado por estado verificado en producción (público solo ve "publicado")
- Variantes de menú (Estándar/Celíaco/Vegetariano/Vegano): badge en platos + filtro en la página Menú
- Favoritos: corazón en el Menú (solo con sesión de estudiante, privacidad por token), botón "Hoy toca tu favorito" en Reserva.tsx
- Perfil de alimento del estudiante: alergias/preferencias (editable por el estudiante vía `PUT /api/beneficiarios/mi-perfil` y por el admin en alta/edición)
- Grab & Go: reserva "para llevar" con código de entrega + QR (ticket en Reserva 2.6, códigos listados en el panel de cocina con alertas de alergias)
- Reserva semanal: checkbox que reserva lunes a viernes de la semana próxima (código por día)
- Tendencia en Reportes: pronóstico de demanda/sobrantes a 5 días (barras verde/naranja reutilizando `.grafico-*`)
  - Auditoría y Notificaciones rediseñadas en el panel (timeline por día con filtros por módulo; tarjetas con estado enviada/pendiente, helpers `etiquetaDia`/`horaCorta` en `config/fechas.ts`)
  - Auditoría integral (revisión de errores en todos los apartados): panel arreglado para rol `cocina` (solo carga lo que su rol puede ver); `GET /api/beneficiarios/buscar` ya no expone alergias/preferencias (el estudiante lee su perfil por `GET /api/beneficiarios/mi-perfil` autenticado); chatbot solo responde con menús/avisos **publicados**; favorito de plato con respuesta correcta; validación de `?semana=` y del `menuId` en valorar; `marcarTodosAsistencia` y `guardarSobrantes` ahora verifican `resp.ok` antes de decir "guardado"

### Pendiente
- Nada urgente. Ideas/mejoras futuras en `docs/ideas-roles.md`.

## Datos para pruebas

- Admin token: usuario `admin`, clave = `ADMIN_CLAVE` del `.env`
- Para generar token manualmente (el secreto lo define `backend/src/config/auth.js`: `ADMIN_SECRET` o, si no existe, `ADMIN_CLAVE`):
  ```javascript
  const crypto = require('crypto');
  const SECRETO = process.env.ADMIN_SECRET || process.env.ADMIN_CLAVE; // valor del .env
  const payload = {sub:'admin',rol:'admin',nombre:'Administrador',exp:Date.now()+12*3600*1000};
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const firma = crypto.createHmac('sha256',SECRETO).update(b64).digest('base64url');
  console.log(b64+'.'+firma);
  ```
- Backend corre en `http://localhost:4000`

## Skills de OpenCode disponibles

Las skills están en `C:\Users\luis\.config\opencode\skills\`. Se activan automáticamente según el contexto o se pueden invocar explícitamente.

### Skills de calidad de código — usar en TODO cambio de código

| Skill | Cuándo activarla en PAE |
|-------|------------------------|
| **`code-review`** | Al revisar PRs o diffs (`git diff main`); ejecuta dos sub-agentes en paralelo: Estándares vs Spec. Útil antes de cualquier commit grande. |
| **`code-simplification`** | Cuando un archivo supera 300 líneas o acumula deuda técnica. Principio Chesterton's Fence: entender antes de cambiar. |
| **`code-review-awesome`** / **`code-review-and-quality`** | Variantes alternativas de code review con perspectivas diferentes. |
| **`debugging-and-error-recovery`** | Cuando hay errores en consola, tests que fallan, o comportamiento inesperado. Protocolo STOP → PRESERVE → DIAGNOSE → FIX. |
| **`diagnosing-bugs`** | Para bugs difíciles de reproducir. |
| **`incremental-implementation`** | Al añadir features grandes: implementar en pasos pequeños y verificables. |

### Skills de frontend — usar en cambios a `frontend/`

| Skill | Cuándo activarla en PAE |
|-------|------------------------|
| **`frontend-ui-engineering`** | En todo cambio visual: componentes accesibles, WCAG 2.1 AA, sin "AI aesthetic" (gradientes genéricos, púrpura por defecto). Checklist de verificación incluida. |
| **`sota-frontend-design`** | Auditoría profunda de UI: tipografía, color, layout, motion, a11y. |
| **`sota-javascript-typescript`** | Auditoría del código TS/React: tsconfig estricto, tipos, patrones async, seguridad XSS, rendimiento de bundle. |
| **`browser-testing-with-devtools`** | Para verificar la UI en Chrome DevTools. |
| **`performance-optimization`** | Cuando Core Web Vitals (LCP/INP/CLS) sean malos o el bundle crezca. Medir antes de optimizar. |

### Skills de seguridad — revisar en TODA ruta nueva del backend

| Skill | Cuándo activarla en PAE |
|-------|------------------------|
| **`security-and-hardening`** | En cualquier ruta que maneje input del usuario, auth, o datos sensibles (PII de estudiantes). Revisar OWASP Top 10. |
| **`ecc-security-review`** | Revisión de seguridad integral del proyecto. |
| **`sota-code-security`** | Auditoría profunda: inyección, auth/JWT, crypto, XSS/CSRF, upload de archivos. Útil para las rutas de reservas y beneficiarios. |
| **`sota-databases`** | Schema, migrations, queries, índices, transacciones en Supabase/PostgreSQL. |

### Skills de arquitectura y diseño

| Skill | Cuándo activarla en PAE |
|-------|------------------------|
| **`codebase-design`** | Al diseñar nueva estructura de módulos o refactors grandes. |
| **`domain-modeling`** | Al añadir nuevas entidades al modelo de datos. |
| **`api-and-interface-design`** | Al añadir o modificar endpoints REST. REST/HTTP semántica, paginación, idempotencia. |
| **`sota-architecture`** | Para decisiones de arquitectura cross-cutting. |
| **`spec-driven-development`** / **`source-driven-development`** | Para implementar a partir de una especificación o fuente de verdad. |

### Skills de proceso y planificación

| Skill | Cuándo activarla en PAE |
|-------|------------------------|
| **`planning-and-task-breakdown`** | Al abordar features complejas: descomponer en tareas manejables. |
| **`constraint-driven-development`** | Cuando hay restricciones técnicas o de tiempo. |
| **`doubt-driven-development`** | Cuando haya incertidumbre sobre la implementación: cuestionar antes de asumir. |
| **`idea-refine`** | Para refinar una idea antes de implementarla. |
| **`grilling`** / **`interview-me`** | Para alinear en un plan a través de preguntas interactivas. |

### Skills de testing

| Skill | Cuándo activarla en PAE |
|-------|------------------------|
| **`tdd`** / **`test-driven-development`** / **`ecc-tdd-workflow`** | Al implementar nueva lógica de negocio en el backend. |
| **`ecc-e2e-testing`** | Para tests end-to-end de flujos críticos (reserva, asistencia). |
| **`sota-testing`** | Auditoría de la suite de tests: estrategia, calidad, cobertura. |

### Mega-skills (SOTA) — usar para auditorías completas

| Skill | Cuándo activarla |
|-------|-----------------|
| **`sota`** | Router maestro. Cuando el task abarca múltiples dominios: mapea a los sub-skills correctos. |
| **`sota-javascript-typescript`** | Auditoría completa del código JS/TS del backend y frontend. |
| **`sota-databases`** | Auditoría de Supabase/PostgreSQL: schema, índices, transacciones, seguridad. |
| **`sota-frontend-design`** | Auditoría completa de UI/UX/a11y. |
| **`sota-docs-workflow`** | Auditoría de documentación: READMEs, changelogs, workflow de git. |

### Otras skills notables

| Skill | Descripción |
|-------|-------------|
| **`research`** | Investigar contra fuentes primarias y guardar hallazgo como `.md`. |
| **`ecc-deep-research`** | Investigación multi-fuente profunda. |
| **`documentation-and-adrs`** | Escribir ADRs (Architecture Decision Records) y documentación técnica. |
| **`git-workflow-and-versioning`** | Convenciones de git, branching, releases. |
| **`ci-cd-and-automation`** | CI/CD y automatización (útil para Render + Vercel). |
| **`observability-and-instrumentation`** | Logging estructurado, métricas, trazabilidad. |
| **`deprecation-and-migration`** | Para migraciones de schema o de API. |
| **`context-engineering`** | Optimizar el contexto que se pasa al agente. |

### Regla de activación para PAE

```
Cambio en routes/*.js → security-and-hardening + api-and-interface-design
Cambio en frontend/src/ → frontend-ui-engineering + code-simplification (si >200 líneas)
Bug reportado → debugging-and-error-recovery
Feature nueva compleja → planning-and-task-breakdown + incremental-implementation
Code review antes de merge → code-review
Auditoría de seguridad → sota-code-security + sota-databases
Auditoría de UI → sota-frontend-design + sota-javascript-typescript
```

## Errores conocidos

- **La herramienta `read` de opencode corrompe archivos del proyecto.** Workaround: usar `node -e` para extraer contenido con `join(' | ')` o copiar el archivo a `%TEMP%` y leerlo desde ahí.
- **`npx` no funciona en PowerShell** por execution policy. Usar `node ".\node_modules\<pkg>\bin\<bin>"` directamente.
- **`Start-Job` de PowerShell muere** al terminar cada comando bash. Para procesos largos usar `Start-Process -FilePath node -ArgumentList "src/server.js" -WindowStyle Hidden`.
