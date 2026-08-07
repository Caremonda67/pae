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

## Profesor (hoy: beneficiarios + avisos)

- [x] Asistencia de su grupo: cada profesor tiene un grupo asignado
      (sede + turno + grado, lo configura el admin al crear/editar la
      cuenta). En la pestana "Asistencia" ve solo los reservados de su
      grupo para la fecha elegida (ordenados por grado y nombre), los
      marca como asistieron con un clic, tiene "Marcar todos" y un
      contador de asistidos. Rutas `/api/asistencia` (solo rol profesor;
      las marcas se guardan en `reservas.asistio`). Requiere correr la
      migracion de columnas sede/turno/grado en `usuarios` (setup.sql).
- [ ] Incidentes / alergias: reportar un incidente o alergia de un
      estudiante, llega al coordinador (hay tabla `notificaciones`).
- [ ] Ver el menu de la semana de su sede (la data ya existe).

## Coordinador (hoy: avisos, galeria, instituciones, colaboradores,
notificaciones, mensajes)

- [ ] Tablero del dia: reservas de hoy, ocupacion por sede/turno, ausentes.
- [ ] Aprobacion de avisos: flujo borrador -> publicado (requiere campo
      `estado` en avisos).
- [ ] Planificacion semanal del menu con flujo borrador -> publicado.
- [ ] Asignar el rol de cocina por dia (turnos).
  [ ] que ellos tambien ellos puedan meter nuevos beneficiarios asi como hace el admin 

## Estudiante (hoy: reservar + mis reservas)

- [ ] Historial con estado: reservada / servida / ausente (con los datos
      de asistencia).
- [ ] Limite de anulacion: cerrar reservas/ediciones a una hora (mas o menos a las 8)
- [ ] Ver el menu de la semana / del mes.
- [ ] Recordatorio por notificacion: avisar "manana reserva tu almuerzo".
  [ ] en caso dado que un estudiante no vaya crear un espacio de notificacion para llamar la atencion por la no asistencia

## Admin (hoy: todo + usuarios)

- [ ] Auditoria de acciones: tabla con quien hizo que y cuando.
- [ ] Exportar datos (CSV/JSON) para reportes a la entidad.
- [ ] Configuracion del sistema: hora limite de reserva, cupos por sede
      (tabla de settings).
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
