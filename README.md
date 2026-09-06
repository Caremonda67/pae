# PAE - Programa de Alimentación Escolar

Aplicación web full stack para instituciones educativas que busca reducir el desperdicio de alimentos: los estudiantes reservan su minuta, la cocina ve los totales por fecha y prepara solo la cantidad exacta.

**Proyecto final de la Ruta Avanzada** (Frontend + Backend + IA).

---

## Despliegue

| Componente | URL |
|---|---|
| Sitio web (frontend) | https://pae-frontend.onrender.com/ |
| API (backend) | https://pae-app-y0f2.onrender.com |
| Repositorio | https://github.com/Caremonda67/pae |

---

## Funcionalidades

### Estudiantes

- Reserva de minuta con documento y PIN (autocompleta nombre, sede y turno); valida fecha y horario, sin reservas sábados/domingos.
- Menú semanal por jornada y sede, con fotos opcionales, platos agrupados por día y la comida del día destacada en la home.
- Galería del programa con descripción por foto, buscador y lightbox.
- Contacto tipo chat con el admin: ida y vuelta, con fotos, estado leído y respuesta.
- PWA instalable: botón nativo en Android y guía paso a paso en iOS.

### Admin

- Login por roles: admin, coordinador, cocina y profesor.
- Panel con pestañas: menú, galería, beneficiarios, sedes, instituciones, usuarios, mensajes, asistencia, reportes, incidentes, turnos, auditoría, notificaciones y configuración.
- Buscador en cada pestaña y manejo claro de errores (sesión expirada, endpoint que falló).
- Usuarios: asignar clave visible y renovar el PIN de los beneficiarios.
- Mensajes de contacto con marcado de leído y respuesta.

### Coordinador

- Panel con acceso a beneficiarios, turnos de cocina y reportes; permisos por sede.

### Cocina

- Panel compacto con totales por fecha y sede, y el menú del día.
- Registro manual de sobrantes (porciones y kilos por sede y jornada), con edición y borrado.
- Reporte de desperdicio por fecha y sede.

### Profesor

- Asistencia de su grupo (sede + turno + grado): marca los estudiantes reservados del día.
- Reporte de incidentes/alergias con foto adjunta; edita y borra los propios.

### Reportes y estadísticas

- Filtros por semana, mes o rango de fechas.
- Exportación a Excel (con portada y tablas formateadas) y CSV.
- Tendencia de demanda y sobrantes a 5 días (gráfico de pronóstico).

### Generales

- Chatbot IA (Gemini) que responde con el menú y las sedes reales.
- Noticias/avisos y sedes dinámicas.
- Accesibilidad (ARIA, focus visible, skip link) y CI en pull requests.

---

## Roles de acceso

| Rol | Acceso |
|---|---|
| Estudiante | Reservar con documento y PIN, ver menú, galería y contactar |
| Admin | Todo el panel: menú, galería, beneficiarios, sedes, usuarios, mensajes y reportes |
| Coordinador | Panel de coordinador: filtro de sedes y sobrantes, ruta de colaboradores, permisos sobre beneficiarios y turnos; gestiona métricas avanzadas y reportes detallados por jornada y sede
| Cocina | Panel de cocina: totales del día, sobrantes y reportes |
| Profesor | Asistencia de su grupo e incidentes/alergias |

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express |
| Base de datos | Supabase (PostgreSQL en la nube) |
| IA | Google Gemini (API) |
| Correo | Resend (emails transaccionales) |
| Control de versiones | Git + GitHub |
| Despliegue | Frontend en Render · Backend en Render |

---

## Estructura del proyecto

```
/
├── frontend/               # React + Vite + TypeScript
│   └── src/
│       ├── components/     # Sidebar, Chatbot, Lightbox, InstalarApp, FiltroReportes, Buscador
│       └── pages/          # Home, Menu, Reserva, Admin (17 pestañas por rol), Galeria, Reportes, Contacto, Noticias
├── backend/                # Node.js + Express
│   └── src/
│       ├── config/         # Conexión a Supabase, auth, email, rate limit, almacenamiento
│       └── routes/         # reservas, menus, sedes, sobrantes, asistencia, incidentes, contacto, chat, galeria, estadisticas, login, usuarios, etc.
├── backend/setup.sql       # Tablas, políticas RLS y datos de ejemplo
├── .github/workflows/      # CI en PRs (ci.yml) + despliegue automático a Render (deploy.yml)
└── render.yaml             # Configuración declarativa: backend + frontend estático en Render
```

---

## Cómo correrlo en local

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # completa SUPABASE_URL, SUPABASE_ANON_KEY y GEMINI_API_KEY
npm run dev            # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

---

## Base de datos (Supabase)

El script completo de tablas, políticas de acceso (RLS) y datos de ejemplo está en `backend/setup.sql`. Se ejecuta en Supabase → SQL Editor → New query → Run. Es seguro correrlo varias veces.

La tabla de mensajes del chat de contacto está en `backend/sql/chat_mensajes.sql`.

## Chatbot IA

El bot usa la API de Google Gemini. La clave vive en `backend/.env` (`GEMINI_API_KEY`) y el backend es el único que la usa; nunca llega al navegador.

## Clave del panel de administrador

Por defecto: `pae2026`

## Equipo

Proyecto final de la Ruta Avanzada, hecho por Luis y Mariana.

| Usuario GitHub | Correo |
|---|---|
| `Caremonda67` | `3167373525luis@gmail.com` |
| `marianasalinasmss-stack` | `marianasalinasmss@gmail.com` |

### Identidad de Git

Cada uno usa su cuenta en la PC donde programa:

```bash
# Luis
git config user.name "Caremonda67"
git config user.email "3167373525luis@gmail.com"

# Mariana
git config user.name "marianasalinasmss-stack"
git config user.email "marianasalinasmss@gmail.com"