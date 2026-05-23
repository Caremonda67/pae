// utilidades de fecha compartidas por las paginas (reservas, etc.)

// Fecha de hoy en formato YYYY-MM-DD (zona horaria local de Colombia)
export function hoyLocal() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return partes;
}

// Cuantos dias hay que sumar a una fecha YYYY-MM-DD
export function sumarDias(fecha: string, dias: number) {
  const [año, mes, dia] = fecha.split("-").map(Number);
  const f = new Date(año, mes - 1, dia);
  f.setDate(f.getDate() + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

// Formatea una fecha YYYY-MM-DD a algo legible: "sábado, 8 de agosto"
export function fechaLegible(fecha: string) {
  const [año, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(año, mes - 1, dia));
}

// Valida una fecha YYYY-MM-DD. Devuelve un mensaje de error o null si es
// correcta. Esto evita que se manden fechas imposibles (año con mas
// digitos, mes 13, dia 40, fechas del pasado o demasiado lejanas).
// Ademas no hay servicio de alimentacion los fines de semana.
export function validarFecha(fecha: string): string | null {
  // Debe tener exactamente el formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return "La fecha no tiene el formato correcto (año-mes-día).";
  }

  // Verifica que sea una fecha real: 2026-02-31 no existe
  const [año, mes, dia] = fecha.split("-").map(Number);
  const fechaObj = new Date(año, mes - 1, dia);
  if (
    fechaObj.getFullYear() !== año ||
    fechaObj.getMonth() !== mes - 1 ||
    fechaObj.getDate() !== dia
  ) {
    return "Esa fecha no existe.";
  }

  // Rango permitido: desde hoy hasta 60 dias
  const hoy = hoyLocal();
  const max = sumarDias(hoy, 60);
  if (fecha < hoy) {
    return "La fecha no puede ser anterior a hoy.";
  }
  if (fecha > max) {
    return "Solo se pueden reservar hasta 60 días antes de la fecha.";
  }

  // No hay servicio de alimentacion los fines de semana
  const diaSemana = fechaObj.getDay();
  if (diaSemana === 0 || diaSemana === 6) {
    return "Los sábados y domingos no hay servicio de alimentación. Elige un día entre lunes y viernes.";
  }

  return null;
}
