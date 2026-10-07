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

// Cache en memoria: los settings cambian muy raro (solo cuando el admin
// los modifica), asi que no vale la pena consultar la DB en cada reserva.
// Se invalida cada 60 segundos o cuando se llama invalidarSettings().
let _cache = null;
let _cacheTs = 0;
const TTL_MS = 60_000;

export function invalidarSettings() {
  _cache = null;
}

export async function leerSettings() {
  if (_cache && Date.now() - _cacheTs < TTL_MS) return _cache;
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

  _cache = {
    hora_limite_reserva: filas.hora_limite_reserva || null,
    cupos_sede: cupos,
  };
  _cacheTs = Date.now();
  return _cache;
}
