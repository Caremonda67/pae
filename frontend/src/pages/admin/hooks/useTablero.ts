import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { TableroDia } from "../types";

// Estado y operaciones del tab "tablero del dia": el tablero de reservas de
// la fecha elegida. Vive fuera de Admin.tsx para que el panel no concentre
// logica de todos los tabs en un solo archivo.
export function useTablero(opts: {
  autenticado: boolean;
  rol: string;
  setError: (v: string) => void;
}) {
  const { autenticado, rol, setError } = opts;

  const [fechaTablero, setFechaTablero] = useState(() => hoyLocal());
  const [tablero, setTablero] = useState<TableroDia | null>(null);
  const [tableroCargando, setTableroCargando] = useState(false);

  const cargarTablero = async (fecha: string) => {
    setTableroCargando(true);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/tablero?fecha=${fecha}`,
        { headers: cabeceras(false) }
      );
      if (!respuesta.ok) throw new Error("No se pudo cargar el tablero del día");
      setTablero((await respuesta.json()) as TableroDia);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setTableroCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "coordinador")) {
      cargarTablero(fechaTablero);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaTablero]);

  return {
    fechaTablero,
    setFechaTablero,
    tablero,
    tableroCargando,
  };
}

function hoyLocal(): string {
  const f = new Date();
  const m = String(f.getMonth() + 1).padStart(2, "0");
  const d = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${m}-${d}`;
}