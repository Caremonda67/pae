# 🍽️ PAE - Programa de Alimentación Escolar

Aplicación web **full stack** para instituciones educativas que busca **reducir el desperdicio de alimentos**: los estudiantes reservan su minuta, la cocina ve los totales por fecha y prepara solo la cantidad exacta.

Proyecto final de la **Ruta Avanzada** (Frontend + Backend + IA).

## 🌐 Despliegue

| Componente | URL |
|---|---|
| 🌐 Sitio web (frontend) | https://caremonda67.github.io/pae/ |
| ⚙️ API (backend) | https://pae-app-y0f2.onrender.com |
| 📖 Repositorio | https://github.com/Caremonda67/pae |

## ✨ Funcionalidades

- **Home** con la marca y el propósito del programa.
- **Menú semanal** (catálogo) que se carga desde el backend.
- **Reserva de comida**: el estudiante confirma asistencia (sede, turno, fecha).
- **Panel de administrador** con login: cuántas minutas preparar por fecha, asistencia por estudiante y **reporte de desperdicio**.
- **Contacto** con formulario real que guarda mensajes en la base de datos.
- **Chatbot IA** (Gemini) que responde sobre el menú y cómo reservar.

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express |
| Base de datos | Supabase (PostgreSQL en la nube) |
| IA | Google Gemini (API) |
| Control de versiones | Git + GitHub |
| Despliegue | Frontend en GitHub Pages · Backend en Render |

## 📁 Estructura del proyecto

```
/
├── frontend/              # React + Vite + TypeScript
│   └── src/
│       ├── components/    # Sidebar, Chatbot (reutilizables)
│       └── pages/         # Home, Menu, Reserva, Contacto, Admin, etc.
├── backend/               # Node.js + Express
│   └── src/
│       ├── config/        # Conexión a Supabase
│       └── routes/        # reservas, menus, contacto, chat
├── .github/workflows/     # Despliegue automático a GitHub Pages
├── render.yaml            # Configuración del despliegue en Render
└── EQUIPO.md              # Guía de tareas del equipo
```

## 🚀 Cómo correrlo en local

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

## 🗄️ Base de datos (Supabase)

El script completo de tablas, políticas de acceso (RLS) y datos de ejemplo está en `backend/setup.sql`. Se ejecuta en Supabase → SQL Editor → New query → Run. Es seguro correrlo varias veces.

## 🤖 Chatbot IA

El bot usa la API de Google Gemini. La clave vive en `backend/.env` (`GEMINI_API_KEY`) y el backend es el único que la usa; nunca llega al navegador.

## 🔑 Clave del panel de administrador

Por defecto: `pae2026` 

## 🧑‍🤝‍🧑 Equipo

Proyecto desarrollado en pareja como proyecto final de la Ruta Avanzada.

| Integrante | Usuario GitHub | Correo |
|---|---|---|
| A | `Caremonda67` | `3167373525luis@gmail.com` |
| B | `marianasalinasmss-stack` | `marianasalinasmss@gmail.com` |

### Identidad Git por integrante

Cada integrante configura su identidad en la PC donde vaya a programar:

```bash
# En la PC del integrante A
git config user.name "Caremonda67"
git config user.email "3167373525luis@gmail.com"

# En la PC del integrante B
git config user.name "marianasalinasmss-stack"
git config user.email "marianasalinasmss@gmail.com"
```
