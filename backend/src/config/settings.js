// Lee la configuracion del sistema (tabla settings) y la devuelve
// lista para usar. Si la tabla no existe o esta vacia, devuelve los
// valores por defecto para que la app nunca se caiga.
//
// Devuelve:
//   {
//     hora_limite_reserva: "08:00" | null,
//     cupos_sede: { "Sede A": 50, "Sede B": 40 }
//   }

import { getSupabase } from "./supabase.js";

export async function leerSettings() {
  const { data, error } = await getSupabase()
    .from("settings")
    .select("clave, valor");

  if (error) {
    return { hora_limite_reserva: null, cupos_sede: {} };
  }

  const filas = {};
  for (const fila of data || []) filas[fila.clave] = fila.valor;

  let cupos = {};
  try {
    cupos = JSON.parse(filas.cupos_sede || "{}") || {};
  } catch {
    cupos = {};
  }

  return {
    hora_limite_reserva: filas.hora_limite_reserva || null,
    cupos_sede: cupos,
  };
}
