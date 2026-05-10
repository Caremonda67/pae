// Horarios del servicio del PAE.
//
// Para saber cuando una reserva paso de "pendiente" a "completada"
// (el turno ya termino) se compara la fecha de la reserva con la
// hora de fin de su turno. El almuerzo es un horario unico; el
// refrigerio depende del grado del estudiante.
//
// Para agregar mas grados o cambiar horarios solo hay que editar
// este archivo: cada grado es una entrada en REFRIGERIO_POR_GRADO.
// La seleccion de grados del formulario de beneficiarios se genera
// automaticamente desde esta lista, asi nunca hay errores de tipeo.

export interface HorarioTurno {
  fin: string;
}

// Horario de un grado dentro del refrigerio
export interface HorarioGrado {
  entrada: string;
  fin: string;
}

// Hora a la que termina el servicio de cada turno (formato HH:MM)
export const HORARIOS_TURNO: Record<string, HorarioTurno> = {
  Almuerzo: { fin: "11:30" },
  Refrigerio: { fin: "16:00" },
};

// Horario del refrigerio segun el grado del estudiante.
// Si un grado no aparece aqui se usa el horario general del turno.
// Nuevos grados: agregar la fila (el horario se toma del listado real).
export const REFRIGERIO_POR_GRADO: Record<string, HorarioGrado> = {
  "9-1": { entrada: "13:30", fin: "13:45" },
  "9-2": { entrada: "13:30", fin: "13:45" },
  "10-1": { entrada: "13:45", fin: "14:00" },
  "10-2": { entrada: "13:45", fin: "14:00" },
  "11-1": { entrada: "14:00", fin: "14:15" },
  "11-2": { entrada: "14:00", fin: "14:15" },
};

// Lista de grados disponibles para la seleccion del formulario
export const GRADOS: string[] = Object.keys(REFRIGERIO_POR_GRADO).sort();

// Muestra el horario de un grado en formato "13:30 - 13:45"
// Devuelve null si el grado no esta configurado
export function horarioGrado(grado: string): string | null {
  const horario = REFRIGERIO_POR_GRADO[grado];
  if (!horario) return null;
  return `${horario.entrada} - ${horario.fin}`;
}

// Devuelve la hora de fin (HH:MM) de una reserva segun su turno y grado
export function horaFinReserva(turno: string, grado?: string | null): string {
  if (turno === "Refrigerio" && grado && REFRIGERIO_POR_GRADO[grado]) {
    return REFRIGERIO_POR_GRADO[grado].fin;
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
