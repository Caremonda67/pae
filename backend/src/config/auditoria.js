// Traza de acciones del panel (tabla auditoria). Fallar al auditar
// nunca rompe la accion principal, por eso el try/catch silencioso.
import { getSupabase } from "./supabase.js";

export async function registrarAuditoria({ usuario, rol, accion, detalle }) {
  try {
    await getSupabase().from("auditoria").insert([
      {
        usuario: usuario || null,
        rol: rol || null,
        accion: accion || "accion",
        detalle: detalle || null,
      },
    ]);
  } catch {
    // la tabla puede no existir aun; no debe tumbar la accion
  }
}

// Atajo: usa el usuario y rol que dejo requiereRol en req.
export function auditar(req, accion, detalle) {
  return registrarAuditoria({
    usuario: req.usuario?.sub || null,
    rol: req.usuario?.rol || null,
    accion,
    detalle,
  });
}
