import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Notificacion } from "../types";

// Lista de notificaciones del tab "notificaciones". Se carga cuando se abre
// la pestaña (antes vivía dentro de cargarDatos y se traía en cada login),
// para no pedir datos que el admin no va a ver.
export function useNotificaciones(opts: { autenticado: boolean; pestana: string }) {
  const { autenticado, pestana } = opts;

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    if (!autenticado || pestana !== "notificaciones") return;
    let activo = true;
    fetch(`${API_URL}/api/notificaciones`, { headers: cabeceras(false) })
      .then((r) => (r.ok ? r.json() : []))
      .then((datos) => {
        if (activo) setNotificaciones(datos || []);
      })
      .catch(() => {
        if (activo) setNotificaciones([]);
      });
    return () => {
      activo = false;
    };
  }, [autenticado, pestana]);

  return { notificaciones };
}