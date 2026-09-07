# Decisiones técnicas del PAE

Notas para la sustentación sobre por qué el proyecto quedó armado así. No
es una lista de buenas prácticas de un tutorial, es lo que fuimos
decidiendo (y a veces corrigiendo) mientras lo construíamos.

## Stack

React + Vite + TypeScript en el frontend, Node con Express en el backend,
Supabase (Postgres) como base de datos. Elegimos React porque era lo que
mejor conocíamos del equipo, y Node en el backend para no tener que saltar
de lenguaje entre las dos partes.

TypeScript lo metimos tarde, ya con el panel de admin bastante grande, y
eso costó: pasar a tipos un archivo de miles de líneas es mucho más
trabajo que arrancar con ellos desde el día uno. Si lo volviéramos a
hacer, TypeScript entra desde el primer commit.

Vite en vez de Create React App fue casi obligado: CRA se había vuelto
lento (varios segundos por cada guardado) y el propio equipo de React dejó
de recomendarlo. Vite además trae el plugin de PWA, que usamos para que la
app quede instalable y cachee recursos — en las sedes el internet no
siempre es bueno, y que la primera carga pesada se pueda hacer con datos
o wifi de casa ayuda.

Dentro de Node comparamos Express, Fastify y Nest. Nest quedó descartado
rápido: trae inyección de dependencias y bastante andamiaje pensado para
equipos grandes, y acá el backend es simplemente un router con un archivo
por recurso. Fastify es más rápido en benchmarks, pero ya conocíamos
Express y su ecosistema de middlewares es más grande. Usamos módulos ES
(`"type": "module"`) desde el inicio para no migrar `require` después.

## Base de datos: Supabase

Postgres para las reservas (integridad referencial, transacciones para la
reserva semanal que inserta varios días de una) y para los reportes
(joins de desperdicio por sede, tendencias). Supabase nos ahorra tener que
levantar y pagar un servidor de base de datos aparte, y de paso trae
storage para las imágenes y una UI de tablas que usamos bastante mientras
probábamos consultas.

La decisión de seguridad más importante del proyecto está acá: el
frontend nunca habla directo con la base. Al principio pensamos en dejar
las políticas RLS activas y que el frontend usara la key anónima —es el
modelo que Supabase promueve—, pero eso implica validar permisos en dos
lugares (RLS + backend), y un error de política en cualquiera de los dos
es un hueco de seguridad. Terminamos cerrando el RLS por completo: el
único que toca la base es el backend, con la service role key. El esquema
vive en `backend/setup.sql` como migración, para no desincronizar
desarrollo y producción.

## Autenticación: JWT propio, sin librerías de más

Los estudiantes entran con documento + PIN (ya están en la tabla de
beneficiarios), y el panel con usuario + clave según el rol. Descartamos
Supabase Auth porque está pensado para confirmación por correo y magic
links, y acá los estudiantes no tienen correo institucional.

Las claves se guardan con scrypt + salt, comparadas con
`timingSafeEqual` para evitar ataques de tiempo. El token es un JWT
firmado con HMAC-SHA256 usando el módulo `crypto` de Node en vez de la
librería `jsonwebtoken` — el payload es simple y no vale la pena la
dependencia extra. Expira a las 12 horas.

La razón para JWT en vez de sesiones de servidor es el plan gratuito de
Render: el backend puede reiniciarse en cualquier momento, y una sesión
en memoria se perdería con cada reinicio. Redis para sesiones era otro
servidor que pagar y mantener, así que el token viaja en el header
`Authorization` y el navegador lo guarda en `localStorage`.

## Despliegue: Render

Backend y frontend corren en Render, plan gratuito, con `render.yaml`
declarando ambos servicios para que el despliegue se reproduzca solo al
importar el repo. Las variables sensibles (`SUPABASE_*`, `ADMIN_CLAVE`,
`RESEND_API_KEY`) van como variables de entorno de Render, nunca en el
repositorio. El repo conserva también un workflow de GitHub Pages de una
etapa anterior del proyecto, pero ya no es el que sirve producción.

Dos cosas que aprendimos desplegando y no leyendo documentación:

- El puerto en Render es dinámico (`process.env.PORT`), no uno fijo.
- Las rutas internas de una SPA (por ejemplo `/admin`) daban 404 al
  recargar, porque ese archivo no existe de verdad — el rewrite
  `/* → /index.html` en Render lo arregla.

## Imágenes

Las fotos (platos, avisos, galería, incidentes) van al bucket `imagenes`
de Supabase Storage y se sirven como URL pública. Se mandan como base64
dentro del JSON en vez de `multipart/form-data`, porque así el frontend
puede validar la imagen antes de mandarla y el contrato de la API se
queda simple. Límites: 8 MB por request, 5 MB por archivo, y lista blanca
de extensiones de imagen — a la subida le llegaron nombres con
extensiones raras en pruebas y con la validación quedan bloqueados. El
nombre final lo genera el servidor (fecha + número aleatorio), para que
nadie adivine rutas. Esto vivía duplicado en dos rutas del backend y lo
centralizamos en `config/almacenamiento.js`.

## Correo: Resend

Resend por API HTTP en vez de SMTP, porque el plan gratuito de Render
bloquea el puerto SMTP saliente. Si no hay `RESEND_API_KEY` configurada,
las funciones de correo devuelven `false` sin romper el flujo — el correo
es un canal secundario, el principal con las familias sigue siendo
WhatsApp.

## Chatbot: Gemini

El "PAE Bot" usa Gemini en vez de respuestas fijas por palabra clave,
porque los estudiantes preguntan lo mismo de mil formas distintas. El
prompt se arma con datos reales de la base (menú de la semana, avisos,
sedes) filtrados por estado publicado, para que no responda con
borradores ni invente información. El historial de cada conversación se
guarda en `chatbot_mensajes` por sesión de navegador.

## Seguridad: lo que fuimos encontrando

Helmet con los headers por defecto, salvo `contentSecurityPolicy`
(Vite usa scripts en línea en desarrollo) y `crossOriginResourcePolicy`
(para que el navegador cargue imágenes del storage público). CORS abierto
en desarrollo y restringido al dominio del frontend en producción. Rate
limits en dos niveles: uno global por IP y otros más estrictos en login,
formularios y chat. Todo el cálculo de horas y fechas usa `America/Bogota`
explícitamente, porque el servidor corre en UTC y la primera versión del
menú semanal amaneció con los días cruzados.

Encontramos y corregimos varios huecos de autorización durante el
proyecto, no de una sola vez:

- Las rutas de reservas (crear, listar, cancelar, recordatorio) solo
  validaban el documento en el cuerpo de la petición, no que quien pedía
  los datos fuera el mismo estudiante. Se corrigió exigiendo el token del
  estudiante y comparando contra el documento.
- Lo mismo pasaba con las valoraciones de platos: cualquiera podía votar
  con el documento de otro. Mismo arreglo.
- `GET /api/beneficiarios/buscar` es público (autocompleta el formulario
  de reserva) y devolvía la fila completa del beneficiario, incluidas
  alergias y preferencias. Ahora solo devuelve los campos necesarios para
  autocompletar; el perfil completo lo lee el estudiante autenticado por
  `/mi-perfil`.
- Un profesor podía asignar o cambiar el PIN de un estudiante, lo que en
  la práctica le permitía entrar como él. Esa acción quedó restringida a
  admin y coordinador.

## Decisiones de producto

- Grab & Go: cada reserva genera un código corto y un QR (librería
  `qrcode.react`) para que cocina entregue la minuta sin confusiones, y
  también sirve para "para llevar".
- Confirmación por WhatsApp con enlace `wa.me`, porque es el canal que
  las familias ya usan.
- Perfil de alimento (alergias y variante de menú: estándar, celíaco,
  vegetariano, vegano), que llevó a crear el endpoint `mi-perfil` y a que
  cocina vea alertas de alergias al listar los códigos de entrega del día.

## Pendiente / lo que haría distinto

- Empezar con TypeScript desde el primer commit.
- El cálculo de la semana del mes vive duplicado en el endpoint de menú y
  en el chatbot; falta centralizarlo.
- Rotar `ADMIN_CLAVE` en producción y no dejar ningún valor de ejemplo
  parecido al real en la documentación.
