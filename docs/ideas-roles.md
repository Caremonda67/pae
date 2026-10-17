# Ideas por rol (PAE)

Documento vivo para anotar espacios y funciones nuevas por rol.
Marcar con [x] lo que ya este hecho, [ ] lo que falta, y usar la
seccion de abajo para decisiones pendientes.

## Cocina (hoy: panel de cocina + menu)

- [x] Reporte de sobrantes manual: el personal con rol `cocina` registra
      cuántas porciones y el peso (kg) que sobraron por jornada y sede en
      el panel de cocina (tabla `sobrantes`, rutas `/api/sobrantes`).
- [x] Los sobrantes se ven en la pestaña "Reportes" (solo admin y cocina),
      agrupados por fecha y sede con el total de porciones y kilos por día.
      Desde ahí se pueden editar las jornadas o borrar la fila completa
      (botones Editar/Borrar; `DELETE /api/sobrantes?fecha&sede`). También
      se incluyen en el Excel exportado como sección propia.
- [x] Panel compacto de cocina: cuantas minutas preparar por jornada y
      por sede + menu del dia, con selector de fecha. Reemplazo el panel
      viejo (reporte de desperdicio, plan 7 dias, lista con asistencia).

## Profesor (hoy: asistencia, incidentes, beneficiarios + avisos)

- [x] Asistencia de su grupo: cada profesor tiene un grupo asignado
      (sede + turno + grado, lo configura el admin al crear/editar la
      cuenta). En la pestana "Asistencia" ve solo los reservados de su
      grupo para la fecha elegida (ordenados por grado y nombre), los
      marca como asistieron con un clic, tiene "Marcar todos" y un
      contador de asistidos. Rutas `/api/asistencia` (solo rol profesor;
      las marcas se guardan en `reservas.asistio`). Requiere correr la
      migracion de columnas sede/turno/grado en `usuarios` (setup.sql).
- [x] Incidentes / alergias: el profesor reporta un incidente o alergia de
      un estudiante de su grupo con foto adjunta opcional (elige al
      estudiante de una lista; rutas `/api/incidentes`). Puede editar o
      borrar SUS reportes (botones Editar/Borrar con formulario inline).
      El reporte llega al coordinador (y al admin), que lo ve en su pestaña
      "Incidentes" con filtros por estado, rango de fechas y búsqueda por
      estudiante, lo marca como resuelto o lo reabre, y también puede
      borrarlo. Tabla nueva `incidentes` (setup.sql).
- [x] Ver el menu de la semana de su sede (pagina publica de Menu; falta
      verlo dentro del panel del profesor).

## Coordinador (hoy: avisos, galeria, instituciones, colaboradores,
notificaciones, mensajes)

- [x] Tablero del dia: pestaña "Tablero del día" para coordinador (y
      admin). Muestra las reservas de la fecha (por defecto hoy, con
      selector de fecha), la ocupación por sede y turno, cuántas
      asistieron, cuántas quedan sin marcar (o ausentes si la fecha ya
      pasó) y la lista de los reservados con su nombre, sede, turno y
      grado. Ruta `/api/reservas/tablero?fecha=...` (rol admin o
      coordinador).
- [x] Aprobacion de avisos: flujo borrador -> publicado (verificado en
      produccion).
- [x] Planificacion semanal del menu con flujo borrador -> publicado
      (semanas 1-4 completas, 10 platos cada una).
- [x] Asignar el rol de cocina por dia (turnos de cocina).
- [x] El coordinador puede meter nuevos beneficiarios igual que el admin. 

## Estudiante (hoy: reservar + mis reservas)

- [ ] Historial con estado: reservada / servida / ausente (con los datos
      de asistencia).
- [x] Limite de anulacion: la hora limite configurable
      (`hora_limite_reserva`) cierra reservar/cancelar del dia.
- [x] Ver el menu de la semana (pagina publica); falta el del mes.
- [x] Recordatorio por notificacion: avisar "manana reserva tu almuerzo"
      (implementado y verificado en produccion).
- [x] Inasistencias: el estudiante ve en Reserva.tsx sus faltas como
      llamado de atencion por no asistencia.

## Admin (hoy: todo + usuarios)

- [x] Auditoria de acciones: tabla con quien hizo que y cuando.
- [x] Exportar datos (Excel con portada + CSV) para reportes a la entidad.
- [x] Configuracion del sistema: hora limite de reserva, cupos por sede
      (tabla de settings, restaurado a "08:00" tras la simulacion).
- [x] Reportes tecnicos movidos al panel (pestana "Reportes" solo para
      admin y cocina): desperdicio con desgloses, sobrantes por fecha y
      sede (con edicion/borrado), tabla diaria y exportar CSV, con datos
      protegidos por sesion. La pagina publica Reportes quedo simplificada
      (solo resumen y grafico). El endpoint /api/reservas/diario ahora
      requiere rol.

## Prioridades tentativas

1. Tablero del dia (coordinador).
2. Historial con estado + limite de reserva (estudiante).

## Decisiones pendientes

- [ ] El menu del mes / planificacion es prioridad o secundario.

## Ideas de inspiracion (sondeo de sistemas similares, NO implementadas)

Sondeo de paginas/apps de comedores escolares y universitarios para tomar
funciones que valgan la pena. Siete se implementaron durante 2026 (ver
tabla); quedan pendientes el selector territorial y el radar de transparencia.

Referentes: PAEstar al dia / Alimentos para Aprender (menus PAE por
departamento/municipio/IE/sede/fecha + radar de control), Control PAE
Valledupar, UNSE (Argentina), UNFV/UNDAC (Peru), BUAP (Mexico, con reserva
"periodica"), UGR Granada / US Sevilla (menus alternativos: celiaco,
vegetariano, vegano; menu para llevar), SchoolCafe / FD MealPlanner (EE.UU.:
favoritos, build-your-tray, alergenos, rating de platos), OrderIT/OrderandTell
(UMass: alergias por ingrediente que llegan a la cocina), Fusion Online (UK:
grab & go empaquetado por nombre), MealPe (India: pre-order + analiticas),
MealManage/HotLunch/SnapPay (USDA: hora de corte editable, alertas de alergias).

| Idea | Fuente | Estado en la app | Esfuerzo |
|---|---|---|---|
| Favoritos + aviso "hoy toca tu favorito" | SchoolCafe | [x] Implementado: corazón en Menu (sesión de estudiante, privacidad por token) + aviso en Reserva.tsx | Media |
| Perfil de alergias/preferencias que alerte a cocina | OrderIT, Kafoodle, UGR | [x] Implementado: `PUT /api/beneficiarios/mi-perfil`, alta/edición por admin, alertas en panel de cocina | Media |
| Menus alternativos (celiaco, vegetariano) y para llevar | UGR | [x] Implementado: `menus.variante` + badge/filtro en Menu y admin | Media |
| Reserva repetitiva/semanal de una sola vez | BUAP | [x] Implementado: checkbox semanal en Reserva (lun-vie de la semana próxima, código por día) | Media |
| Grab & Go: hoja/QR por reserva para empacar por nombre | Fusion Online, EasyPickup | [x] Implementado: `para_llevar` + `codigo` + QR en ticket, lista de entregas en panel cocina | Baja-media |
| Etiquetas "popular/favorito/recomendado" en menu publico | MealPe | [x] Implementado: badges Popular/Recomendado calculados por backend | Baja |
| Pronostico de demanda vs. sobrantes reales (grafico de tendencia) | MealManage, Kafoodle | [x] Implementado: `GET /api/reservas/tendencia` + barras en pestaña Reportes | Baja-media |
| Selector territorial depto->municipio->IE->sede->fecha | UApA/PAEstar al dia | [ ] Pendiente: hay sedes; falta la jerarquia (enchufa con futuro multi-tenant) | Media |
| Panel publico de transparencia estilo "Radar PAE" | UApA, Control PAE | [ ] Pendiente: ya hay auditoria y reportes; presentarlo como control social | Baja |

Fuera de foco (NO copiar): pagos/cashless (programa gratuito), POS,
inventario/recetas (software de cocina industrial).

Tres ideas fuertes para la sustentacion:
1. Favoritos + aviso (muy demostrable en vivo).
2. Conectar alergias del estudiante -> menu seguro -> alerta a cocina
   (aprovecha el modulo de incidentes ya existente).
3. Selector territorial estilo PAEstar al dia para exhibir la jerarquia
   institucion->sede.
