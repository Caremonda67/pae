# PAE - Frontend

Aplicación web progresiva (PWA) desarrollada en React 19, TypeScript y Vite para el Programa de Alimentación Escolar (PAE).

Este repositorio contiene **solo el frontend**. El backend (API REST en Node.js + Express con Supabase) vive en un repositorio separado (`pae-backend`).

## Tecnologías

- **React 19** + **TypeScript**
- **Vite** (bundler de alta velocidad y compilación modular)
- **Vite Plugin PWA** (soporte sin conexión y manifiesto web instalable)
- **React Router** (enrutamiento SPA)
- **Oxlint** (linter ultrarrápido)
- **Vitest** (suite de tests unitarios)
- **qrcode.react** (generación de QR para entregas de ración Grab & Go)

## Requisitos

- Node.js 18 o superior
- API del backend corriendo (localmente en `http://localhost:4000` o en Render)

## Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev
```

La aplicación se ejecutará en `http://localhost:5173`.

### Compilación y Calidad de Código

```bash
# Comprobación de tipos y build de producción
npm run build

# Análisis de linter
npm run lint

# Ejecutar pruebas unitarias
npm test
```

## Variables de Entorno

Por defecto, la aplicación se comunica con el backend en `http://localhost:4000`. Para apuntar a un servidor remoto, copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Y define:
```env
VITE_API_URL=https://tu-api.onrender.com
```

## Estructura del Proyecto

```
frontend/
├── public/                # Iconos PWA, manifiesto, SVG, assets y juegos demo
├── src/
│   ├── components/        # Componentes transversales (Sidebar, Buscador, Chatbot, Lightbox, etc.)
│   ├── config/            # API URL, sesión JWT, manejo de fechas, horarios y exportación
│   ├── pages/             # Vistas de la aplicación:
│   │   ├── Home.tsx       # Portada y comida del día
│   │   ├── Menu.tsx       # Menú semanal con filtros por jornada y variante
│   │   ├── Reserva.tsx    # Portal de reserva del estudiante con validaciones
│   │   ├── Galeria.tsx    # Galería fotográfica con buscador y lightbox
│   │   ├── Contacto.tsx   # Canal de mensajería con la administración
│   │   ├── Noticias.tsx   # Avisos y comunicados oficiales
│   │   ├── Reportes.tsx   # Métricas y exportación a Excel
│   │   ├── Juegos.tsx     # Arcade de videojuegos educativos del PAE
│   │   ├── juegos/        # Módulos del Arcade (Reproductor con pantalla completa, Subir, Actualizar)
│   │   └── admin/         # Panel de gestión con 17 pestañas modulares y hooks personalizados
│   ├── App.tsx            # Enrutador principal y layout
│   └── index.css          # Estilos y tokens de diseño
└── vite.config.ts         # Configuración de Vite y PWA
```

## Funcionalidades Principales

1. **Portal Estudiante:**
   - Consulta de menú semanal con badges de alérgenos y variantes (Estándar, Vegetariano, Vegano, Celíaco).
   - Reserva de raciones con control estricto de hora límite, días hábiles y límite de cupos por sede.
   - Historial de reservas y confirmación con código de entrega y QR (Grab & Go).
   - Gestión de favoritos y perfil de preferencias/alergias alimentarias.

2. **Arcade Educativo:**
   - Catálogo de juegos educativos sobre nutrición, reciclaje y hábitos saludables.
   - Envío de juegos por parte de estudiantes (Scratch, enlaces web o archivos HTML locales).
   - Reproductor interactivo con modo de pantalla completa y selector de dispositivo (PC / Celular).

3. **Panel Administrativo (17 pestañas por rol):**
   - **Admin / Coordinador:** Menú, avisos, beneficiarios, sedes, instituciones, auditoría de acciones, turnos y moderación de videojuegos enviados por estudiantes.
   - **Profesor:** Control de asistencia diaria por grupo y registro de incidentes o alertas de salud.
   - **Cocina:** Planilla de preparación por jornada, control de raciones y registro de sobrantes.

4. **PWA Instalable:**
   - Soporte para instalación como app nativa en dispositivos móviles y de escritorio.
   - Caché de recursos para tiempos de carga inmediatos.
