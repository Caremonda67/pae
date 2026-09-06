import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { AuditoriaEntrada } from "../types";

// Registro de auditoría del tab "auditoría" (solo admin). Se carga al abrir
// la pestaña en lugar de traerse con cargarDatos en cada login.
export function useAuditoria(opts: { autenticado: boolean; pestana: string; rol: string }) {
  const { autenticado, pestana, rol } = opts;

  const [auditoria, setAuditoria] = useState<AuditoriaEntrada[]>([]);

  useEffect(() => {
    if (!autenticado || pestana !== "auditoria" || rol !== "admin") return;
    let activo = true;
    fetch(`${API_URL}/api/auditoria?limite=150`, { headers: cabeceras(false) })
      .then((r) => (r.ok ? r.json() : []))
      .then((datos) => {
        if (activo) setAuditoria(datos || []);
      })
      .catch(() => {
        if (activo) setAuditoria([]);
      });
    return () => {
      activo = false;
    };
  }, [autenticado, pestana, rol]);

  return { auditoria };
}