// Horarios del servicio del PAE.
//
// Para saber cuando una reserva paso de "pendiente" a "completada"
// (el turno ya termino) se compara la fecha de la reserva con la
// hora de fin de su turno. El almuerzo es un horario unico; el
// refrigerio depende del grado del estudiante.
//
// Para agregar mas grados o cambiar horarios solo hay que editar
// este archivo: cada grado es una entrada en REFRIGERIO_POR_GRADO.

export interface HorarioTurno {
  fin: string;
}

// Hora a la que termina el servicio de cada turno (formato HH:MM)
export const HORARIOS_TURNO: Record<string, HorarioTurno> = {
  Almuerzo: { fin: "11:30" },
  Refrigerio: { fin: "16:00" },
};

// Hora de fin del refrigerio segun el grado del estudiante.
// Si un grado no aparece aqui se usa el horario general del turno.
// Nuevos grados: agregar la fila (el dia/horario se toma del listado real).
export const REFRIGERIO_POR_GRADO: Record<string, string> = {
  "9-1": "13:45",
  "9-2": "13:45",
  "10-1": "14:00",
  "10-2": "14:00",
  "11-1": "14:15",
  "11-2": "14:15",
};

// Devuelve la hora de fin (HH:MM) de una reserva segun su turno y grado
export function horaFinReserva(turno: string, grado?: string | null): string {
  if (turno === "Refrigerio" && grado && REFRIGERIO_POR_GRADO[grado]) {
    return REFRIGERIO_POR_GRADO[grado];
  }
  return HORARIOS_TURNO[turno]?.fin || "23:59";
}

// Convierte una fecha (YYYY-MM-DD) + hora (HH:MM) en un instante
// real comparado en la zona horaria local del navegador.
function instanteDe(fecha: string, hora: string): number {
  const [año, mes, dia] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  return new Date(año, mes - 1, dia, hh, mm).getTime();
}

// Estado de una reserva:
// - "completada": ya se marco asistencia o ya paso la hora de fin del turno
// - "pendiente": el turno todavia no termino
export function estadoReserva(reserva: {
  fecha: string;
  turno: string;
  grado?: string | null;
  asistio: boolean;
}): "completada" | "pendiente" {
  if (reserva.asistio) return "completada";
  const fin = horaFinReserva(reserva.turno, reserva.grado);
  return Date.now() >= instanteDe(reserva.fecha, fin) ? "completada" : "pendiente";
}
