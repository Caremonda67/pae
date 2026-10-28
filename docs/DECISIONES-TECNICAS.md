# Decisiones técnicas del PAE

Este documento reúne, para la sustentación, el porqué de cada pieza del
sistema. No es una lista teórica de "mejores prácticas": cuenta qué probé,
qué descarté y qué aprendí en el camino, en el mismo orden en el que el
proyecto creció.

## Frontend: React + TypeScript + Vite

El frontend fue la parte que más me costó dimensionar al principio. Lo
empecé pensando que iba a ser "una página con un formulario", y termina
siendo una SPA con una página pública (Home, menú, galería, reportes,
estadísticas), el flujo de reserva del estudiante y un panel de
administración con 17 secciones.

Elegí React porque era el stack que mejor conocía del equipo, y lo mantuve
hibridando con TypeScript **después** de que el panel ya pesaba. Eso fue un
error de orden: adaptar a tipos un archivo de cuatro mil líneas duele mucho
más que empezar con ellos puestos. La lección quedó aprendida a la fuerza y
hoy el proyecto compila con `tsc -b` y pasa `oxlint` sin un solo warning.

Vite lo tomé por descarte casi: en ese momento Create React App ya venía
muy lent (cada guardado tardaba varios segundos) y el propio equipo de
React la dejó de recomendar. Vite compila al instante, trata TypeScript
como ciudadano de primera clase y trae el plugin de PWA con el que la app
quedó instalable y cachea los recursos para que se abra aunque el internet
del colegio venga lento. Ese detalle de la PWA no es cosmético: en las
sedes el ancho de banda es limitado y la primera carga pesada se puede
hacer "en casa".

## Backend: Node.js con Express

No quise cambiar de lenguaje entre frontend y backend, así que Node fue
natural. Dentro de Node comparé Express y Fastify y consideré Nest:

- **Nest** me pareció sobredimensionado para esto: trae inyección de
  dependencias, módulos y mucho andamiaje pensado para equipos grandes.
  Aquí el backend es un router Express con archivos por recurso
  (`/api/reservas`, `/api/menus`, ...), y eso es exactamente lo que el
  proyecto necesita.
- **Fastify** es más rápido, pero Express ya lo conocía y su ecosistema
  es imposible de hacer tropezar (middlewares, documentación, ejemplos).

Usé módulos ES (`"type": "module"`) de entrada en vez de CommonJS. En
retrospectiva no fue una decisión heroica, pero evité el lío de ir
migrando `require` después.

Los scripts de datos demo (`backend/scripts/`) los dejé re-ejecutables e
idempotentes. Eso tampoco fue planeado: en las pruebas me tocaba resetear
siempre lo mismo y terminé escribiendo un par de scripts que se pueden
correr las veces que sean sin romper nada. Hoy eso me salva en cada
demostración.

## Base de datos: PostgreSQL vía Supabase

La base es PostgreSQL, manejada por Supabase. Postgres lo elegí sin dudar:
SQL con integridad referencial para las reservas, joins para los reportes
(desperdicio por sede, tendencias), y transacciones para cosas como la
reserva semanal que inserta varios registros de una.

Supabase, por su lado, me resuelve tres cosas con un solo proveedor y sin
pagar servidor:

1. El motor **PostgreSQL** alojado, con backups.
2. **Supabase Storage** para las imágenes (bucket `imagenes`).
3. Una **UI de tablas** con la que el desarrollo es muchísimo más rápido
   cuando estás ensayando consultas o revisando datos sembrados.

La decisión más importante de seguridad de todo el proyecto está acá: **el
frontend no habla con la base de datos**. Tardé en llegar a eso. En un
momento pensé en tener las políticas RLS de Supabase activas y dejar que el
frontend consultara directo con la key anónima, que es el modelo que el
marketing de Supabase vende. Lo descarté por razón práctica: si validas
permisos en dos lugares (frontend + RLS), un error de política en cualquiera
es un hueco; y además el backend igual necesitaba validar quien hace cada
cosa (rol, pertenencia de la reserva). Entonces cerré el RLS por completo
y **el único que toca la base es el backend, con la service role key**, que
ignora políticas. El esquema vive en `backend/setup.sql` y se aplica como
migración, para que la base de desarrollo y la de producción no se vayan
desincronizando.

## Autenticación y roles: JWT firmado a mano

Los usuarios del sistema no entran con email y contraseña clásica: los
**estudiantes entran con documento + PIN** (que ya están en la tabla de
beneficiarios) y el panel con usuario + clave por rol (admin, coordinador,
profesor, cocina, estudiante).

Descarté **Supabase Auth** por ese motivo: él está pensado para
confirmación por email, magic links, etc. aquí los estudiantes no tienen
correo institucional y el flujo en el colegio tenía que ser "escribe el
documento, digita el PIN" y listo. Levantar la autenticación propia fue
más directo y me dejó control de los roles exactos que el programa exige.

Para las claves y el token no quise meter dependencias de más:

- Las claves van con **scrypt + salt** (y comparación `timingSafeEqual`,
  que evita el ataque de timing).
- El token es un **JWT firmado con HMAC-SHA256** usando el módulo `crypto`
  de Node, sin la librería `jsonwebtoken`. Sacar una dependencia de un
  payload tan simple fue poco trabajo y el token queda igual de
  verificable; expira a las 12 horas.

¿Por qué JWT y no sesiones? Porque la API y el frontend corren como
procesos independientes en el plan gratuito de Render: una sesión en
memoria del servidor se perdería con cada reinicio y una sesión en Redis
era **otro servidor más que pagar y operar**. El token viaja en el encabezado
`Authorization` y lo conserva el navegador en `localStorage` para que la
sesión no se caiga al recargar. Le hago control de caducidad del `exp`
antes de usarlo, para no lanzar una lluvia de 401.

## Despliegue: Render (plan gratuito) con `render.yaml`

Los dos servicios (API y frontend estático) viven en Render, su plan
gratuito para un proyecto académico es suficiente y el archivo
`render.yaml` hace que el despliegue sea declarativo: se importa el repo y
queda reproducido, sin apretar botones a mano. Las variables sensibles
(`SUPABASE_*`, `ADMIN_CLAVE`, `RESEND_API_KEY`) van como variables de
entorno, nunca en el repositorio.

Dos aprendizajes concretos de desplegar:

1. **El puerto es dinámico en Render** — la app escucha `process.env.PORT`
   en vez de un puerto fijo.
2. **Los enlaces directos de una SPA**: entrar a `/admin` daba 404 porque
   no existe ese archivo, el que lo sirve es el index. Se arregló con un
   rewrite de `/*` → `/index.html` en Render. Por eso el frontend se despliega
   como **static** y no como otro servidor: no hay nada que renderizar en el
   servidor.

Y una nota de desarrollo en Windows: PowerShell tiene la ejecución de
scripts bloqueada por política, así que `npx` no corre. Se trabaja
llamando los binarios directo (`node .\node_modules\...\bin\...`). No es
una decisión de arquitectura, pero explica por qué los comandos del
proyecto están documentados así.

## Imágenes: Supabase Storage (base64)

El panel sube fotos (platos, avisos, galería) y probé dos caminos. Al
principio la idea era un servicio de subida de terceros, pero agregar otra
cuenta, otra key y otro bucket pagado no valía la pena cuando Supabase ya
trae storage incluido. Así que las imágenes van al bucket `imagenes` de
Supabase y se sirven como URLs públicas (el navegador las carga en una
etiqueta `<img>` normal).

El envío lo hago como **base64 dentro del JSON** con límites estrictos:
máximo 8 MB en el cuerpo de la petición, máximo 5 MB por archivo y una
**lista blanca de extensiones** que rechaza rutas y caracteres raros — a
ese endpoint le pusieron un `.svg` con código arriba en las pruebas y
quedó bloqueado. Los nombres de archivo son generados por el servidor con
marca de tiempo + aleatorio, así nadie puede "adivinar" rutas ni chocar
archivos iguales.

¿Por qué base64 y no `multipart/form-data`? Porque me permitía que el
frontend comprimiera y validara la imagen antes de mandarla y porque el
`.json` mantiene todo el contrato de la API simple de probar. Sabiendo que
el límite por request existe, para imágenes de un menú escolar el tamaño
nunca fue problema.

## Correos: Resend

El aviso de reserva y los correos del formulario de contacto salen con
Resend vía su **API por HTTP**, y no con SMTP, porque el plan gratuito de
Render bloquea el puerto SMTP saliente. Fue una de esas cosas que se
descubren desplegando, no leyendo documentación.

Detalle que me pareció importante: si no hay `RESEND_API_KEY` o remitente
configurado, las funciones devuelven `false` sin romper el flujo. El
sistema no se cae porque un correo no salga; el canal primario de
comunicación con las familias es WhatsApp de todos modos.

## Chatbot: Gemini

El "PAE Bot" del chat usa **Gemini**, y no lo hice con respuestas fijas
por palabra clave porque muy pronto se queda corto: los estudiantes
preguntan lo mismo de mil maneras ("¿qué hay mañana?", "¿a qué hora me
toca?"). El bot responde con **datos reales de la base** (menú de la
semana, reservas del día, desperdicio) — el prompt se arma con fecha y
metadatos reales, así no inventa. El historial de la conversación se
persiste en la tabla `chatbot_mensajes` por sesión de navegador, para que
el estudiante pueda volver atrás en su charla.

## Seguridad transversal

Varias decisiones de seguridad están repartidas en el código y merecen
explicarse juntas:

- **Helmet** con los headers de seguridad por defecto, salvo
  `contentSecurityPolicy` (Vite usa scripts en línea en desarrollo) y
  `crossOriginResourcePolicy` (para que el navegador cargue las imágenes
  del storage público).
- **CORS** entreabierto en desarrollo local y restringido al dominio del
  frontend en producción vía `FRONTEND_URL`.
- **Rate limits** en dos niveles: uno global (200 peticiones por minuto
  por IP) y límites más estrictos en login, formularios y chat, para frenar
  fuerza bruta y spam.
- **Hora de Colombia** en todo el cálculo sensible: el servidor de Render
  corre en UTC y la primera vez la semana del menú me amaneció cruzada.
  Hoy la semana, el día y las horas límite se calculan explícitamente con
  `America/Bogota`, en el backend y en el frontend.

Y una corrección honesta de la que no me siento del todo orgulloso: en la
revisión final de la API me di cuenta de que **las rutas de reservas no
verificaban que quien pedía datos fuera el mismo estudiante**; solo
validaban el PIN del cuerpo de la petición. Blindé los cuatro endpoints de
reservas (crear, listar, cancelar y recordatorio) para que exijan el token
del estudiante y que el `sub` del token coincida con el documento, y el
frontend pasó a enviar `Authorization`. Lo probé contra la API desplegada
y el repertorio de pruebas quedó guardado.

## Decisiones de producto que se colaron en lo técnico

Algunas funcionalidades nacieron del problema real y no del stack:

- **Grab & Go**: cada reserva genera un código corto y un **QR** para que
  la cocina entregue la minuta sin confusiones, y sirve para la opción
  "para llevar". Eso decidió la librería `qrcode.react` en el frontend.
- **Confirmación por WhatsApp** con enlace `wa.me`: no inventamos un canal,
  usamos el que las familias ya tienen.
- **Perfil de alimento** (alergias y variante del menú: estándar, celíaco,
  vegetariano, vegano), que obligó a que la API tuviera `mi-perfil` y a
  que el panel de cocina avise con las alertas de alergias al listar los
  códigos de entrega.

## Lo que haría distinto

- **Empezar con TypeScript desde el día uno** y no refactorizar después.
- Revisar los **renders y el manejo de efectos** del panel, que creció
  desordenado, antes de congelarlo.
- Centralizar el cálculo de la semana del mes: hoy vive en el endpoint de
  menú y en el chatbot (iguales, pero duplicados).
- Rotar las claves y dejar el `ADMIN_CLAVE` real fuera de los ejemplos
  documentados.

Para el alcance de un programa escolar, el balance entre lo que costó
mantenerlo y lo que resuelve lo doy por bien pagado, y lo que queda
documentado arriba son las decisiones que sostienen ese balance.

_Escrito para acompañar la sustentación — agosto de 2026._