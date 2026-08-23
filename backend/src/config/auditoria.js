// Registro de auditoria de las acciones del panel.
// La funcion registrarAuditoria() guarda en la tabla auditoria quien
// hizo que y cuando. Se llama desde las rutas que cambian datos
// (beneficiarios, sedes, usuarios, avisos, menu, sobrantes, turnos,
// configuracion). Fallar al auditar nunca debe romper la accion
// principal, por eso el try/catch silencioso.

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
    // si la tabla auditoria no existe, no pasa nada
  }
}

// Atajo para las rutas: ya tiene el usuario y rol de req (los pone el
// middleware requiereRol) y solo hay que pasar la accion y el detalle.
export function auditar(req, accion, detalle) {
  return registrarAuditoria({
    usuario: req.usuario?.sub || null,
    rol: req.usuario?.rol || null,
    accion,
    detalle,
  });
}
