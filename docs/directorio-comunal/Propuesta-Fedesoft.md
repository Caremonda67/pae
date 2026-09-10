# Directorio Digital Comunal — Propuesta Técnica

**Preparado para:** Reunión con asesor Fedesoft
**Categoría:** Inclusión y Bienestar
**Fecha:** Agosto 2026

---

## 1. Resumen Ejecutivo

### ¿Qué es?

Plataforma web que funciona como **directorio digital de oficios, servicios y emprendimientos** del barrio. Cada persona del barrio puede crear un perfil gratuito, publicar lo que ofrece (carpintería, costura, comida casera, clases de inglés, etc.) y ser encontrada por sus vecinos.

### ¿Para quién?

- **Ofertantes:** Personas del barrio que tienen un oficio, servicio o pequeño emprendimiento (formal o informal)
- **Demandantes:** Vecinos que buscan servicios locales de confianza
- **Organizaciones comunitarias:** Que quieren visibilizar y apoyar emprendedores locales

### ¿Por qué es valioso?

| Problema | Solución |
|----------|----------|
| La gente no sabe qué ofrecen sus vecinos | Directorio centralizado y buscable |
| Los emprendedores informales no tienen visibilidad | Perfil público con redes sociales y contacto |
| No hay forma de filtrar por zona/barrio | Búsqueda por comuna, barrio y oficio |
| Difícil generar confianza | Sistema de reseñas y verificación |

### Diferenciadores

- **100% local:** Enfocado en comunas/barrios, no es un marketplace genérico
- **Inclusivo:** No requiere Cédula RUT o tarjeta — se puede registrar con teléfono
- **Gratis para emprendedores:** Sin comisiones ni costos de publicación
- **Seguro:** Contacto indirecto (no se publica dirección exacta), sistema de reportes
- **Escalable:** Puede replicarse en cualquier comuna del país

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│                                                  │
│  React 19 + TypeScript + Vite                   │
│  ├── Páginas públicas (directorio, busqueda)     │
│  ├── Páginas de usuario (perfil, mis servicios)  │
│  ├── Panel administrativo (moderación)           │
│  └── Leaflet + OpenStreetMap (mapa interactivo)  │
│                                                  │
└──────────────────────┬──────────────────────────┘
                       │ API REST (HTTPS)
                       ▼
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│                                                  │
│  Node.js + Express                               │
│  ├── Autenticación (Supabase Auth)               │
│  ├── CRUD de servicios/oficios                   │
│  ├── Búsqueda y filtros                          │
│  ├── Sistema de reseñas                          │
│  ├── Moderación de contenido                     │
│  ├── Notificaciones (email push)                 │
│  └── Upload de imágenes (Supabase Storage)       │
│                                                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                SUPABASE (BaaS)                   │
│                                                  │
│  ├── PostgreSQL (base de datos relacional)       │
│  ├── Auth (email, teléfono, Google)              │
│  ├── Storage (imágenes de perfil y servicios)    │
│  ├── Realtime (notificaciones en vivo)           │
│  └── RLS (Row Level Security por usuario)        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 19 + TypeScript + Vite | Rendimiento, tipado, ya conocido |
| Estilos | Tailwind CSS | Desarrollo rápido, responsive |
| Mapas | Leaflet + OpenStreetMap | Gratuito, sin API key, OpenSource |
| Backend | Node.js + Express | Simple, flexible, gran ecosistema |
| Base de datos | PostgreSQL (via Supabase) | Robusto, escalable, relacional |
| Auth | Supabase Auth | Incluido, social logins,手机号 |
| Imágenes | Supabase Storage | 1GB gratis, CDN incluido |
| Deploy frontend | Vercel | Free tier, CI/CD automático |
| Deploy backend | Render | Free tier, auto-deploy desde GitHub |

### 2.3 ¿Por qué Supabase?

Supabase reemplaza Firebase con ventajas:
- **PostgreSQL real:** No es NoSQL — puede hacer joins, agregaciones, reportes
- **RLS (Row Level Security):** Seguridad a nivel de fila, sin código adicional
- **Auth incluido:** Registro con email, teléfono, Google, Facebook
- **Storage:** Para imágenes de perfil y fotos de servicios
- **Realtime:** Notificaciones en tiempo real (alguien dejó reseña, etc.)
- **API automática:** Genera endpoints REST desde la BD
- **Free tier generoso:** 500MB DB, 1GB storage, 50K usuarios activos/mes

---

## 3. Modelo de Base de Datos

### 3.1 Diagrama Entidad-Relación

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   usuarios   │     │     perfiles     │     │    servicios     │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)      │────<│ usuario_id (FK)  │────<│ perfil_id (FK)   │
│ email        │     │ nombre_completo  │     │ id (PK)          │
│ telefono     │     │ barrio           │     │ titulo           │
│ auth_id      │     │ comuna           │     │ descripcion      │
│ created_at   │     │ direccion_ref    │     │ categoria        │
│ rol          │     │ foto_perfil      │     │ subcategoria     │
│ activo       │     │ bio              │     │ precio_ref       │
└──────────────┘     │ lat              │     │ foto_servicio    │
                     │ lng              │     │ modalidad        │
                     │ verificado       │     │ estado           │
                     └──────────────────┘     │ created_at       │
                                              └────────┬─────────┘
                                                       │
                                              ┌────────▼─────────┐
                                              │    reseñas       │
                                              ├──────────────────┤
                                              │ id (PK)          │
                                              │ servicio_id (FK) │
                                              │ autor_id (FK)    │
                                              │ calificacion (1-5)│
                                              │ comentario       │
                                              │ created_at       │
                                              └──────────────────┘

┌──────────────┐     ┌──────────────────┐
│   categorias │     │  denuncias       │
├──────────────┤     ├──────────────────┤
│ id (PK)      │     │ id (PK)          │
│ nombre       │     │ servicio_id (FK) │
│ icono        │     │ reportado_por    │
│ orden        │     │ motivo           │
└──────────────┘     │ estado           │
                     │ created_at       │
                     └──────────────────┘
```

### 3.2 Tablas Principales

#### `usuarios`
Cuenta de autenticación. Un usuario puede ser emprendedor Y vecino al mismo tiempo.

#### `perfiles`
Información pública del emprendedor. Nombre, barrio, comuna, foto, ubicación geográfica (lat/lng).

#### `servicios`
Lo que ofrece cada persona. Cada perfil puede tener múltiples servicios. Incluye categoría, descripción, precio de referencia, modalidad (a domicilio / en sitio / virtual).

#### `reseñas`
Vecinos califican servicios que ya utilizaron. Promedio de calificación visible en el perfil del servicio.

#### `categorias`
Catálogo de oficios/servicios: Cocina, Costura, Electricidad, Plomería, Educación, Salud, Arte, Tecnología, Transporte, etc.

#### `denuncias`
Sistema de moderación. Los vecinos pueden reportar servicios sospechosos o contenido inapropiado.

### 3.3 Categorías Preliminares

| Categoría | Ejemplos |
|-----------|----------|
| Cocina y Gastronomía | Comida casaria, pastelería, asados,證 catering |
| Salud y Bienestar | Masajes, terapia, cosmetología, primeros auxilios |
| Educación | Clases de inglés, matemáticas, música, computación |
| Hogar y Construcción | Carpintería, plomería, electricidad, pintura |
| Tecnología | Reparación de celulares, diseño web, redes sociales |
| Servicios Profesionales | Contabilidad, traducción, trámites, diseño gráfico |
| Arte y Cultura | Fotografía, manualidades, serigrafía, flores |
| Transporte | Mudanzas, domicilios, acarreos |
| Cuidado y Compañía | Cuidado de niños, mascotas, personas mayores |
| Moda y Costura | Costura, arreglo de ropa, tejidos, bordado |

---

## 4. Funcionalidades por Fase

### Fase 1 — MVP (Mínimo Viable Product)

**Tiempo estimado:** 4-6 semanas (1-2 desarrolladores)

| Funcionalidad | Descripción |
|---------------|-------------|
| Registro y login | Email + contraseña, con verificación por código |
| Crear perfil | Nombre, barrio, comuna, bio, foto de perfil |
| Publicar servicio | Título, descripción, categoría, fotos, precio de referencia |
| Directorio público | Búsqueda por categoría, barrio, comuna |
| Mapa interactivo | Ver servicios cercanos en mapa (Leaflet) |
| Filtros básicos | Por categoría, zona, precio, calificación |
| Contacto seguro | Botón "Contactar" que muestra teléfono/WhatsApp sin revelar dirección |
| Reseñas básicas | Calificación 1-5 estrellas + comentario |
| Panel administrativo | Ver usuarios, moderar servicios, responder denuncias |

### Fase 2 — Crecimiento

| Funcionalidad | Descripción |
|---------------|-------------|
| Favoritos | Guardar servicios favoritos |
| Historial | Ver servicios contactados recientemente |
| Notificaciones | "Nuevo servicio de [categoría] en tu barrio" |
| Verificación | Badge de verificación para perfiles confirmados |
| Chat | Mensajería entre vecino y emprendedor |
| Compartir | Compartir servicio por WhatsApp/redes |
| Estadísticas | "Tu servicio fue visto 23 veces esta semana" |

### Fase 3 — Escalamiento

| Funcionalidad | Descripción |
|---------------|-------------|
| Multi-comuna | Expandir a varias comunas con sus propios directorios |
| Grupos comunitarios | Organizaciones pueden crear eventos y promociones |
| Marketplace simplificado | Pedidos y pagos integrados (para comida, por ejemplo) |
| App móvil | PWA o app nativa para acceso más fácil |
| API pública | Permitir a otras organizaciones acceder a datos agregados |
| Articulación con emprendedores | Conectar con programas de fomento productivo |

---

## 5. Flujos de Usuario Principales

### 5.1 Flujo: Emprendedor publica servicio

```
1. Emprendedor entra a la plataforma
2. Se registra (email + código SMS) o inicia sesión
3. Completa su perfil (nombre, barrio, foto)
4. Crea un servicio:
   - Título: "Instalación de redes eléctricas"
   - Categoría: Electricidad
   - Descripción detallada del servicio
   - Fotos del trabajo realizado
   - Precio de referencia: "$50.000 - $200.000"
   - Modalidad: "A domicilio"
5. Servicio queda visible en el directorio
```

### 5.2 Flujo: Vecino busca servicio

```
1. Vecino entra al directorio
2. Busca por categoría ("Necesito electricista")
   O explora el mapa de su barrio
3. Ve resultados con foto, nombre, calificación
4. Filtra por: zona, precio, calificación
5. Selecciona un servicio
6. Lee reseñas de otros vecinos
7. Presiona "Contactar"
8. Ve teléfono y/o WhatsApp del emprendedor
9. Contacta directamente
10. (Opcional) Deja reseña después del servicio
```

### 5.3 Flujo: Moderación

```
1. Admin recibe notificación de denuncia
2. Revisa el servicio reportado
3. Contacta al emprendedor si es necesario
4. Decide: mantener, pausar o eliminar el servicio
5. Registra decisión en auditoría
```

---

## 6. Seguridad y Privacidad

| Aspecto | Implementación |
|---------|---------------|
| Datos personales | Dirección exacta NUNCA se publica — solo barrio/comuna |
| Contacto | Se comparte solo teléfono/WhatsApp, no ubicación exacta |
| Autenticación | JWT + Supabase Auth, tokens con expiración |
| RLS | Cada usuario solo modifica sus propios datos |
| Moderación | Denuncias + revisión manual por admin |
| Imágenes | Validación de tipo y tamaño antes de subir |
| Datos sensibles | Sin收集 de datos bancarios o de identificación |

---

## 7. Escalabilidad

### Crecimiento Esperado

| Etapa | Usuarios | Servicios | Estrategia |
|-------|----------|-----------|------------|
| Lanzamiento (1 comuna) | 50-200 | 100-500 | Validar modelo, obtener feedback |
| Expansión (barrios cercanos) | 500-2,000 | 1,000-5,000 | Marketing comunitario, alianzas |
| Multi-comuna | 5,000-20,000 | 10,000-50,000 | Optimización de BD, caché |
| Ciudad completa | 50,000+ | 100,000+ | Microservicios, CDN, escalado horizontal |

### Puntos de Escalamiento Técnico

1. **Base de datos:** PostgreSQL escala bien a millones de registros con índices correctos
2. **Supabase:** Free → Pro ($25/mes) → Team → Enterprise según necesidad
3. **Frontend:** CDN + caching de estáticos en Vercel
4. **Backend:** Render escala automáticamente, o migrar a AWS/GCP si es necesario
5. **Búsqueda full-text:** PostgreSQL tiene `tsvector` nativo — no necesita Elasticsearch hasta escala masiva

---

## 8. Articulación con Programas de Fomento

La plataforma es un **punto de encuentro** que permite:

| Articulación | Cómo |
|--------------|------|
| Programas de emprendimiento | Organizaciones pueden identificar emprendedores activos |
| Ferias comunitarias | Publicar eventos y conectar emprendedores con compradores |
| Créditos productivos | Referir emprendedores verificados a entidades financieras |
| Capacitaciones | Publicar talleres de mejora de negocio |
| Compras públicas | Dependencias pueden buscar proveedores locales |
| Turismo comunitario | Directorio de servicios turísticos del barrio |

---

## 9. Equipo Necesario

### Para MVP (Fase 1)

| Rol | Cantidad | Responsabilidad |
|-----|----------|-----------------|
| Desarrollador Full-Stack | 1-2 | Frontend + Backend + BD |
| Diseñador UI/UX | 0.5 | Wireframes + diseño visual |
| Community Manager | 1 | Contenido, alianzas, difusión |

### Para Crecimiento (Fase 2+)

| Rol | Cantidad | Responsabilidad |
|-----|----------|-----------------|
| Frontend Developer | 1 | React, optimización |
| Backend Developer | 1 | API, seguridad, escalabilidad |
| QA / Testing | 0.5 | Pruebas, calidad |
| Moderador de contenido | 1-2 | Revisar denuncias, validar servicios |

---

## 10. Presupuesto Estimado (Tier Free → Primeros Meses)

| Concepto | Costo | Notas |
|----------|-------|-------|
| Dominio (.com / .co) | ~$35.000 COP/año | Registro anual |
| Supabase Free | $0 | 500MB DB, 1GB storage, 50K usuarios |
| Vercel Free | $0 | Frontend, CI/CD incluido |
| Render Free | $0 | Backend, 750 hrs/mes |
| Total arranque | ~$35.000 COP | Solo el dominio |

**Cuando crezca:**
| Concepto | Costo mensual |
|----------|---------------|
| Supabase Pro | $25 USD/mes |
| Vercel Pro | $20 USD/mes |
| Render Starter | $7 USD/mes |
| Total escalado | ~$52 USD/mes |

---

## 11. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Baja adopción inicial | Alta | Alto | Piloto en 1 barrio, embajadores comunitarios |
| Contenido fraudulento | Media | Alto | Verificación manual + sistema de denuncias |
| Datos personales expuestos | Baja | Crítico | Nunca mostrar dirección exacta, RLS estricto |
| Sobrecarga de servicios | Baja | Medio | Moderación por category, límites de publicación |
| Abandono del proyecto | Media | Alto | Equipo comprometido, métricas de éxito claras |

---

## 12. Métricas de Éxito

| Métrica | Target 3 meses | Target 12 meses |
|---------|----------------|-----------------|
| Emprendedores registrados | 50 | 500 |
| Servicios publicados | 100 | 2,000 |
| Vecinos únicos mensuales | 200 | 5,000 |
| Contactos realizados/mes | 100 | 2,000 |
| Reseñas dejadas | 30 | 1,000 |
| Comunas activas | 1 | 5+ |

---

## 13. Cronograma Preliminar

```
MES 1:     [████████] MVP — Registro, perfil, publicar servicio, directorio
MES 2:     [████████] Mapa, filtros, reseñas, panel admin
MES 3:     [████████] Piloto en 1 barrio — Recoger feedback
MES 4-6:   [████████] Fase 2 — Favoritos, notificaciones, chat
MES 7-12:  [████████] Fase 3 — Escalamiento multi-comuna
```

---

## 14. Preguntas para el Asesor Fedesoft

1. ¿Existe algún programa de fomento al emprendimiento que podamos articular desde el día 1?
2. ¿Hay alguna restricción legal sobre cómo manejamos datos de personas naturales emprendedoras?
3. ¿Fedesoft puede conectarnos con other proyectos similares que ya existan?
4. ¿Hay apoyo en infraestructura tecnológica (servidores, dominios) para proyectos de inclusión?
5. ¿Qué métricas de impacto social les interesan más para validar el proyecto?
6. ¿Pueden apoyar con diseño UX/UI o solo con asesoría técnica?

---

*Documento preparado para la reunión con asesor Fedesoft — Agosto 2026*
