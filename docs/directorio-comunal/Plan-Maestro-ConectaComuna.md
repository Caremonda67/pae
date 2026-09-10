# CONECTA COMUNA — Plan Maestro del Proyecto

**Para reunión con asesor Fedesoft — Agosto 2026**

---

# FASE 0: INVESTIGACIÓN DE CAMPO (ANTES DE PROGRAMAR)

**¿Por qué primero?** Los ganadores de 2025 validaron el problema con personas reales antes de cerrar el alcance. Sin esto, no hay proyecto.

## 0.1 Entrevistas (5-10 emprendedores)

**Requisitos del documento oficial:**
- Entre 5 y 10 entrevistas
- Al menos 3 personas con baja experiencia digital
- Al menos 1 emprendedor que haya logrado crecer o ser proveedor
- Al menos 1 negocio más establecido
- Diferentes tipos de actividades económicas

**Formato:** 7-10 minutos, 10-12 preguntas (mayormente cerradas). El estudiante hace las preguntas y registra. El emprendedor NO llena formularios.

## 0.2 Ficha de Observación

| Aspecto a observar | Sí / No / Parcial |
|--------------------|--------------------|
| ¿Tiene celular inteligente? | |
| ¿Usa WhatsApp con facilidad? | |
| ¿Tiene fotos organizadas de productos? | |
| ¿Tiene precios visibles? | |
| ¿Recibe pedidos antes de que llegue el cliente? | |
| ¿Tiene punto fijo? | |
| ¿Tiene nombre comercial? | |
| ¿Recibe apoyo de familiares u otras personas? | |

## 0.3 Tabla de Resultados (llenar después de entrevistas)

| Necesidad encontrada | Cantidad de personas | Ejemplos / Evidencias | Decisión (MVP / Después / Descartar) |
|---------------------|---------------------|----------------------|--------------------------------------|
| | | | |

## 0.4 Preguntas Sugeridas para Entrevistas

1. ¿Qué vende o qué servicio ofrece?
2. ¿Cómo se enteran los clientes de que usted existe?
3. ¿Tiene celular? ¿Lo usa para el negocio?
4. ¿Tiene fotos de sus productos o trabajos?
5. ¿Tiene precios fijos o los negocia cada vez?
6. ¿Le ha pasado que un cliente no pudo encontrarlo?
7. ¿Le gustaría tener una página o perfil en internet?
8. ¿Qué le dificultaría usar una app o página para su negocio?
9. ¿Tiene alguien que le ayude con el celular o la tecnología?
10. ¿Qué le gustaría que la gente supiera de su negocio?

---

# FASE 1: DISEÑO Y ARQUITECTURA

## 1.1 Requerimientos Funcionales (RF) — Completos

| RF | Nombre | Descripción | Actor principal |
|----|--------|-------------|-----------------|
| RF-01 | Registro del emprendimiento | Registrar información básica: nombre, descripción, tipo actividad, ubicación, horario, contacto | Emprendedor |
| RF-02 | Perfil del emprendimiento | Perfil público con fotos, productos, servicios, precios, horario, ubicación, contacto | Emprendedor |
| RF-03 | Registro de productos/servicios | Publicar productos o servicios con nombre, descripción, foto, precio, disponibilidad | Emprendedor |
| RF-04 | Actualización de productos/servicios | Modificar o retirar productos/servicios | Emprendedor/Facilitador |
| RF-05 | Gestión de disponibilidad | Indicar si un producto/servicio está disponible | Emprendedor/Facilitador |
| RF-06 | Consulta de emprendimientos | Clientes consultan emprendimientos registrados | Cliente |
| RF-07 | Consulta de productos/servicios | Clientes ven productos/servicios de cada emprendimiento | Cliente |
| RF-08 | Contacto con emprendimiento | Contactar vía WhatsApp u otro medio | Cliente |
| RF-09 | Solicitud de pedido | Iniciar solicitud de pedido desde la plataforma | Cliente |
| RF-10 | Ubicación aproximada | Mostrar ubicación aproximada (solo si el emprendedor autoriza) | Emprendedor |
| RF-11 | Venta al por mayor | Indicar si vende al por mayor, busca distribuidores | Emprendedor |
| RF-12 | Gestión asistida | Persona autorizada puede apoyar al emprendedor | Facilitador |
| RF-13 | Gestión de usuarios | Diferenciar tipos: emprendedor, cliente, facilitador, administrador | Admin |
| RF-14 | Gestión de permisos | Limitar funciones según rol | Admin |
| RF-15 | Actualización de información | Usuarios autorizados actualizan datos, productos, fotos, etc. | Emprendedor/Facilitador |
| RF-16 | Comentarios, calificación, rangos e insignias | Sistema de reseñas (1-5 estrellas + comentario), rangos por calificación, insignias por calidad | Cliente/Emprendedor |
| RF-17 | Visualización de precios | El usuario puede ver precios de productos y servicios | Cliente |
| RF-18 | Gestión de usuarios para emprendedores | Panel del emprendedor: solicitudes recibidas, estadísticas, chat con clientes | Emprendedor |

## 1.2 Requerimientos No Funcionales (RNF) — Completos

| RNF | Nombre | Descripción |
|-----|--------|-------------|
| RNF-01 | Facilidad de uso | Funciones principales comprensibles sin conocimientos técnicos |
| RNF-02 | Interfaz clara | Información organizada, botones y menús fáciles de identificar |
| RNF-03 | Lenguaje sencillo | Palabras comunes, sin términos técnicos innecesarios |
| RNF-04 | Procesos simples | Pocos pasos para tareas principales |
| RNF-05 | Adaptación a usuarios con poca experiencia digital | Pensado para personas con poco manejo tecnológico |
| RNF-06 | Compatibilidad móvil | Funcionar correctamente en celulares |
| RNF-07 | Rendimiento | Tiempos de respuesta adecuados |
| RNF-08 | Disponibilidad | Información pública accesible |
| RNF-09 | Seguridad | Protección de cuentas, acceso no autorizado |
| RNF-10 | Privacidad | Solo se publica información autorizada |
| RNF-11 | Control de permisos | Acceso según rol |
| RNF-12 | Mantenibilidad | Código organizado para correcciones y cambios |
| RNF-13 | Calidad visual | Presentación coherente en todas las pantallas |
| RNF-14 | Capacidad de crecimiento | Estructura que permita agregar emprendimientos y funciones |
| RNF-15 | Uso responsable de contenidos | Imágenes y textos con autorización/licencia |
| RNF-16 | Funcionamiento estable | Funciones principales sin errores que impidan uso |

## 1.3 Historias de Usuario

| HU | Como... | Quiero... | Para... |
|----|---------|-----------|---------|
| HU-01 | Emprendedor | Registrar la información básica de mi emprendimiento | Que otras personas puedan conocerlo |
| HU-02 | Emprendedor | Tener un perfil | Mostrar lo que ofrezco y facilitar que los clientes me contacten |
| HU-03 | Emprendedor | Publicar mis productos con fotos, precios y descripción | Que los clientes puedan conocerlos |
| HU-04 | Prestador de servicios | Publicar los servicios que ofrezco | Que las personas interesadas puedan conocerlos |
| HU-05 | Emprendedor | Actualizar la disponibilidad de mis productos o servicios | Informar a los clientes antes de que realicen una solicitud |
| HU-06 | Cliente | Consultar los emprendimientos de la comunidad | Encontrar productos o servicios que me interesen |
| HU-07 | Cliente | Consultar la información de productos o servicios | Decidir si quiero contactar al emprendimiento |
| HU-08 | Cliente | Comunicarme directamente con el emprendimiento | Hacer preguntas o solicitar un producto o servicio |
| HU-09 | Cliente | Iniciar una solicitud de pedido desde la plataforma | Facilitar la comunicación con el emprendimiento |
| HU-10 | Cliente | Conocer la ubicación aproximada de un emprendimiento | Saber dónde encontrarlo o si está cerca de mi zona |
| HU-11 | Emprendedor | Indicar si vendo al por mayor o busco distribuidores | Encontrar nuevas oportunidades comerciales |
| HU-12 | Emprendedor | Que una persona autorizada pueda ayudarme a actualizar mi información | Mantener mi perfil al día |
| HU-13 | Persona autorizada | Actualizar la información de un emprendimiento | Ayudar a mantenerla correcta |
| HU-14 | Usuario | Que mi información personal esté protegida | Utilizar la plataforma con confianza |
| HU-15 | Emprendedor | Usar las funciones principales desde mi celular sin procesos complicados | Administrar mi información con mayor facilidad |
| HU-16 | Cliente | Comentar y calificar un servicio | Ayudar a otros usuarios a elegir |
| HU-17 | Emprendedor | Tener un rango e insignias según mis calificaciones | Destacar sobre otros por la calidad de mi servicio |
| HU-18 | Emprendedor | Ver las solicitudes que recibo de compra | Gestionar mis pedidos de forma organizada |
| HU-19 | Emprendedor | Ver estadísticas de mi emprendimiento | Entender cómo me encuentran los clientes |
| HU-20 | Emprendedor | Tener un chat con los clientes | Comunicarme directamente desde la plataforma |

## 1.4 Diagrama de Actores

```
                    ┌──────────────┐
                    │      ADMIN   │
                    │  Gestiona    │
                    │  usuarios,   │
                    │  permisos,   │
                    │  contenido   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  EMPRENDEDOR │  │   CLIENTE    │  │ FACILITADOR  │
│  Crea perfil │  │  Busca y     │  │  Apoya al    │
│  Publica     │  │  contacta    │  │  emprendedor │
│  productos   │  │  emprendim.  │  │  en gestión  │
│  Gestiona    │  │  Califica    │  │  del perfil  │
│  pedidos     │  │  y comenta   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 1.5 Stack Tecnológico (Confirmado)

| Capa | Tecnología | Justificación para la rúbrica |
|------|-----------|-------------------------------|
| Frontend | React 19 + TypeScript + Vite | Framework moderno, tipado fuerte, build rápido |
| Estilos | Tailwind CSS | Utility-first, responsive, rápido de desarrollar |
| Mapas | Leaflet + OpenStreetMap | Gratuito, OpenSource, sin API key |
| Backend | Node.js + Express | Ecosistema maduro, simple, flexible |
| Base de datos | PostgreSQL (via Supabase) | Relacional, robusto, escalable |
| Auth | Supabase Auth | Incluido, social logins,手机号 |
| Imágenes | Supabase Storage | 1GB gratis, CDN incluido |
| Realtime | Supabase Realtime | Chat y notificaciones en tiempo real |
| Deploy frontend | Vercel | Free tier, CI/CD automático |
| Deploy backend | Render | Free tier, auto-deploy |
| Control versiones | Git + GitHub | Evidencia de trabajo colaborativo |

## 1.6 Modelo de Base de Datos (Actualizado)

### Diagrama Entidad-Relación

```
┌────────────────┐
│    usuarios    │
├────────────────┤
│ id (PK)        │
│ auth_id        │
│ email          │
│ telefono       │
│ rol            │  (emprendedor/cliente/facilitador/admin)
│ activo         │
│ created_at     │
└───────┬────────┘
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
┌────────────────┐            ┌────────────────┐
│    perfiles    │            │  facilitadores │
├────────────────┤            ├────────────────┤
│ id (PK)        │            │ id (PK)        │
│ usuario_id(FK) │            │ emprendedor_id │
│ nombre_completo│            │ facilitador_id │
│ nombre_comercia│            │ estado         │
│ barrio         │            │ created_at     │
│ comuna         │            └────────────────┘
│ direccion_ref  │
│ foto_perfil    │
│ bio            │
│ lat / lng      │
│ verificado     │
│ vende_por_mayor│
│ busca_distri   │
│ created_at     │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  productos     │  (productos Y servicios)
├────────────────┤
│ id (PK)        │
│ perfil_id (FK) │
│ nombre         │
│ descripcion    │
│ tipo           │  (producto/servicio)
│ categoria      │
│ precio         │
│ precio_mayor   │  (RF-11)
│ foto_url       │
│ disponible     │
│ created_at     │
└───────┬────────┘
        │
        ├──────────────────────────┐
        │                          │
        ▼                          ▼
┌────────────────┐       ┌────────────────┐
│   reseñas      │       │   denuncias    │
├────────────────┤       ├────────────────┤
│ id (PK)        │       │ id (PK)        │
│ producto_id(FK)│       │ producto_id(FK)│
│ autor_id (FK)  │       │ reportado_por  │
│ calificacion   │       │ motivo         │
│ comentario     │       │ estado         │
│ created_at     │       │ created_at     │
└────────────────┘       └────────────────┘

┌────────────────┐       ┌────────────────┐
│   rangos       │       │  insignias     │
├────────────────┤       ├────────────────┤
│ id (PK)        │       │ id (PK)        │
│ perfil_id (FK) │       │ perfil_id (FK) │
│ nivel          │       │ nombre         │
│ puntos         │       │ descripcion    │
│ calificacion   │       │ icono          │
│ promedio       │       │ criteria       │
└────────────────┘       │ created_at     │
                         └────────────────┘

┌────────────────┐       ┌────────────────┐
│  categorias    │       │  solicitudes   │
├────────────────┤       ├────────────────┤
│ id (PK)        │       │ id (PK)        │
│ nombre         │       │ producto_id(FK)│
│ icono          │       │ cliente_id(FK) │
│ orden          │       │ emprendedor_id │
└────────────────┘       │ estado         │
                         │ mensaje        │
                         │ created_at     │
                         └────────────────┘

┌────────────────┐
│    chat        │
├────────────────┤
│ id (PK)        │
│ emprendedor_id │
│ cliente_id     │
│ mensaje        │
│ emisor         │
│ leido          │
│ created_at     │
└────────────────┘
```

### Sistema de Rangos e Insignias (RF-16)

**Rangos por calificación promedio:**

| Rango | Calificación promedio | Emoji/Badge |
|-------|----------------------|-------------|
| Nuevo | Sin calificaciones | 🌱 |
| Prometedor | 1.0 - 2.9 | ⭐ |
| Confiable | 3.0 - 3.9 | ⭐⭐ |
| Destacado | 4.0 - 4.4 | ⭐⭐⭐ |
| Elite | 4.5 - 5.0 | 👑 |

**Insignias por logros:**

| Insignia | Criterio | Descripción |
|----------|----------|-------------|
| Primera venta | 1er pedido recibido | "Comenzó su camino" |
| Reseñas positivas | 10+ reseñas con 4+ estrellas | "Confianza del barrio" |
| Rápido respuesta | Responde chat en < 1h promedio | "Siempre disponible" |
| Variedad | 5+ productos/servicios publicados | "Oferta diversa" |
| Mayorista | Vende al por mayor | "Proveedor mayorista" |
| Verified | Verificado por admin | "Perfil verificado" |

## 1.7 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│                                                         │
│  React 19 + TypeScript + Vite + Tailwind CSS           │
│                                                         │
│  ├── / (Página pública)                                │
│  │   ├── Directorio de emprendimientos                 │
│  │   ├── Búsqueda y filtros                            │
│  │   └── Mapa interactivo (Leaflet)                    │
│  │                                                     │
│  ├── /emprendimiento/:id (Perfil público)              │
│  │   ├── Información del emprendimiento                │
│  │   ├── Productos/servicios con precios               │
│  │   ├── Reseñas y calificaciones                      │
│  │   ├── Botón WhatsApp                                │
│  │   └── Ubicación aproximada en mapa                  │
│  │                                                     │
│  ├── /mi-negocio (Panel emprendedor) — RF-18           │
│  │   ├── Mis productos/servicios                       │
│  │   ├── Solicitudes recibidas                         │
│  │   ├── Chat con clientes                             │
│  │   ├── Estadísticas                                  │
│  │   ├── Mi rango e insignias                          │
│  │   └── Actualizar información                        │
│  │                                                     │
│  ├── /admin (Panel administrativo)                     │
│  │   ├── Gestión de usuarios                           │
│  │   ├── Moderación de contenido                       │
│  │   ├── Gestión de categorías                         │
│  │   └── Estadísticas generales                        │
│  │                                                     │
│  └── /auth (Login/Registro)                            │
│      ├── Registro (emprendedor/cliente)                │
│      └── Login                                         │
│                                                         │
└──────────────────────┬──────────────────────────────────┘
                       │ API REST (HTTPS)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                              │
│                                                         │
│  Node.js + Express                                     │
│                                                         │
│  ├── /api/auth         — Login, registro, JWT          │
│  ├── /api/perfiles     — CRUD perfiles emprendedor     │
│  ├── /api/productos    — CRUD productos/servicios      │
│  ├── /api/categorias   — Listar categorías              │
│  ├── /api/busqueda     — Búsqueda y filtros            │
│  ├── /api/resenas      — Reseñas y calificaciones      │
│  ├── /api/rangos       — Sistema de rangos e insignias │
│  ├── /api/solicitudes  — Gestión de pedidos            │
│  ├── /api/chat         — Mensajería en tiempo real     │
│  ├── /api/estadisticas — Métricas para emprendedor     │
│  ├── /api/upload       — Upload de imágenes            │
│  ├── /api/admin        — Panel administrativo          │
│  └── /api/denuncias    — Sistema de reportes           │
│                                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE (BaaS)                         │
│                                                         │
│  ├── PostgreSQL (BD relacional)                         │
│  ├── Auth (email, teléfono, Google)                    │
│  ├── Storage (imágenes)                                │
│  ├── Realtime (chat, notificaciones)                   │
│  └── RLS (seguridad a nivel de fila)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 2: DESARROLLO MVP

## Sprint 1: Base y Autenticación (Semana 1-2)

| Tarea | RF/HU | Detalle |
|-------|-------|---------|
| Crear schema en Supabase | Todos | Todas las tablas del diagrama ER |
| Setup proyecto backend | — | Express + Supabase client + dotenv |
| Setup proyecto frontend | — | React + Vite + Tailwind + router |
| Registro de usuario | RF-13, HU-14 | Email + contraseña, selección de rol |
| Login + JWT | RF-09, RF-11 | Middleware de autenticación |
| Perfil básico | RF-01, HU-01 | Crear perfil de emprendimiento |

## Sprint 2: Productos y Directorio (Semana 3-4)

| Tarea | RF/HU | Detalle |
|-------|-------|---------|
| CRUD de productos/servicios | RF-03, RF-04, HU-03, HU-04 | Crear, leer, editar, eliminar |
| Gestión de disponibilidad | RF-05, HU-05 | Toggle disponible/no disponible |
| Página de directorio | RF-06, HU-06 | Listado público de emprendimientos |
| Perfil público del emprendimiento | RF-02, HU-02, HU-07 | Página detallada con todo |
| Visualización de precios | RF-17 | Precios visibles en productos y servicios |
| Upload de imágenes | — | Supabase Storage + preview |

## Sprint 3: Contacto, Búsqueda y Mapa (Semana 5-6)

| Tarea | RF/HU | Detalle |
|-------|-------|---------|
| Contacto por WhatsApp | RF-08, RF-09, HU-08, HU-09 | Botón que abre WhatsApp con mensaje predefinido |
| Ubicación aproximada | RF-10, HU-10 | Leaflet + OpenStreetMap, marcador |
| Búsqueda y filtros | RF-06 | Por categoría, barrio, comuna, precio |
| Venta al por mayor | RF-11, HU-11 | Badge y filtro de mayoristas |

## Sprint 4: Reseñas, Rangos y Panel Emprendedor (Semana 7-8)

| Tarea | RF/HU | Detalle |
|-------|-------|---------|
| Sistema de reseñas | RF-16, HU-16 | Calificación 1-5 + comentario |
| Sistema de rangos | RF-16, HU-17 | Cálculo automático de rango |
| Insignias | RF-16, HU-17 | Badges automáticas por logros |
| Panel del emprendedor | RF-18, HU-18, HU-19, HU-20 | Solicitudes, estadísticas, chat |
| Gestión asistida | RF-12, HU-12, HU-13 | Facilitador autorizado |
| Panel administrativo | RF-13, RF-14 | Gestión de usuarios y permisos |

---

# FASE 3: PRUEBAS Y DOCUMENTACIÓN

## 3.1 Pruebas con Usuarios

- Probar con 3-5 personas reales (emprendedores del barrio)
- Observar: ¿pueden registrarse? ¿pueden publicar un producto? ¿pueden encontrar a alguien?
- Registrar feedback y cambios realizados

## 3.2 Documentación para el Concurso

| Evidencia | Descripción |
|-----------|-------------|
| Entrevistas | Fichas llenadas, fotos de las sesiones |
| Fichas de observación | Tablas de observación de emprendedores |
| Tabla de necesidades | Resultados de las entrevistas |
| Prototipos | Wireframes o mockups |
| Diagramas | ER, flujos de usuario, arquitectura |
| Capturas de pantalla | Antes/después, pantallas principales |
| Video demo | Recorrido de 60-90 segundos |
| Código fuente | Repositorio en GitHub con commits |
| Registro de cambios | Qué se cambió después de las pruebas |
| Evidencia de impacto | Número de emprendedores registrados, reseñas, contactos |

---

# CÓMO CUBRE LA RÚBRICA

| Criterio | Puntos | Cómo lo cubrimos |
|----------|--------|------------------|
| Dominio conceptual y programación | 10 | Stack moderno (React, Node, Supabase), código organizado, arquitectura clara |
| Expresión oral | 5 | Ensayar explicación de problema → solución → demostración |
| Organización presentación/video | 5 | Video demo de 60-90 seg, presentación con estructura clara |
| Trabajo en equipo | 5 | Evidencia de roles, rotación, commits en GitHub |
| Metodología | 15 | Investigación de campo → entrevistas → tabla de necesidades → diseño → desarrollo → pruebas |
| Uso de herramientas | 15 | Git, GitHub, Supabase, Vercel, Render, VS Code, Figma (wireframes) |
| Diseño y calidad | 15 | Arquitectura limpia, Tailwind responsive, código mantenible |
| Experiencia de usuario | 10 | Interfaz simple, lenguaje sencillo, proceso de 3 pasos para tareas clave |
| Uso ético TIC | 5 | Licencias开源, imágenes con autorización, privacidad de datos |
| Solución y resultados | 15 | MVP funcional, pruebas con usuarios reales, métricas de impacto |

---

# CHECKLIST VS GANADORES 2025

- [x] ¿Nuestro problema se entiende en 20 segundos? → "Emprendedores del barrio no tienen visibilidad digital"
- [x] ¿Podemos nombrar exactamente a la comunidad beneficiaria? → Emprendedores informales del barrio
- [ ] ¿Tenemos evidencia de que el problema existe? → **PENDIENTE: Entrevistas (Fase 0)**
- [x] ¿Cuál es la función central? → Perfil público + contacto por WhatsApp
- [x] ¿Podemos demostrarla en 90 segundos? → Sí: buscar → ver perfil → contactar
- [x] ¿Qué tiene de diferente? → Enfoque 100% local, inclusivo, sin costo
- [ ] ¿Qué evidencia de impacto mostraremos? → **PENDIENTE: Después de piloto**
- [x] ¿Es viable con nuestros recursos? → Sí: todo free tier
- [x] ¿Los estudiantes pueden explicar el código? → Preparar explicación por componentes
- [ ] ¿Tenemos pruebas con usuarios y cambios derivados? → **PENDIENTE: Fase 3**

---

# PREGUNTAS PARA ENSAYAR (del análisis de ganadores)

1. ¿Cómo comprobaron que este problema es real? → Entrevistas con emprendedores
2. ¿Por qué su solución es diferente a lo que ya existe? → Enfoque local + inclusivo + gratis
3. ¿Quiénes probaron el producto y qué aprendieron? → Piloto con 3-5 emprendedores
4. ¿Qué parte del proyecto programaron ustedes? → Todo el código (React, Node, SQL)
5. ¿Qué tecnologías usaron y por qué? → React, Node, Supabase, Leaflet (justificar cada una)
6. ¿Qué funciona hoy y qué quedaría para después? → MVP vs Fase 2/3
7. ¿Cómo protegen datos y privacidad? → RLS, sin dirección exacta, JWT
8. ¿Qué evidencia tienen de impacto? → Emprendedores registrados, contactos realizados
9. ¿Cómo podría mantenerse o escalar? → Free tier, multi-comuna, articulación
10. ¿Cuál fue el problema técnico más difícil? → Sistema de rangos, chat en tiempo real

---

*Documento maestro — Conecta Comuna — Agosto 2026*
