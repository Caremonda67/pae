# Ideas por rol (PAE)

Documento vivo para anotar espacios y funciones nuevas por rol.
Marcar con [x] lo que ya este hecho, [ ] lo que falta, y usar la
seccion de abajo para decisiones pendientes.

## Cocina (hoy: panel de cocina + menu)

- [ ] Turnos de cocina: elegir quien cocina cada dia (los colaboradores
      ya tienen `rol`).
- [ ] Inventario / insumos: registrar lo que falta y avisar al coordinador.
- [ ] Reporte de sobrantes: reservados vs. los que asistieron
      (depende de marcar asistencia).
- [x] Panel compacto de cocina: cuantas minutas preparar por jornada y
      por sede + menu del dia, con selector de fecha. Reemplazo el panel
      viejo (reporte de desperdicio, plan 7 dias, lista con asistencia).
- [ ] Marcar asistencia: se quito del panel por ahora (la columna
      `asistio` sigue existiendo). Pendiente decidir como se implementa.

## Profesor (hoy: beneficiarios + avisos)

- [ ] Asistencia de su grupo: ver los reservados de su sede/turno/grado
      y marcar quien asistio buscando un orden y que ellos sepan de manera optima quienes asistieron.
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
      admin y cocina): desperdicio con desgloses, tabla diaria y exportar
      CSV, con datos protegidos por sesion. La pagina publica Reportes
      quedo simplificada (solo resumen y grafico). El endpoint
      /api/reservas/diario ahora requiere rol.

## Prioridades tentativas

1. Marcar asistencia (cocina/profesor).
2. Tablero del dia (coordinador).
3. Historial con estado + limite de reserva (estudiante).

## Decisiones pendientes

- [ ] El menu del mes / planificacion es prioridad o secundario.
