import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { MenuItem, PanelCocina, Sede, Sobrante } from "../types";
import { TURNOS_SOBRANTES } from "../types";

// Estado y operaciones del tab "panel de cocina": el panel de reservas del
// dia, el menu del dia y el reporte de sobrantes por sede/turno. Vive fuera
// de Admin.tsx para que el panel no concentre logica de todos los tabs en
// un solo archivo. La lista de sedes la puebla cargarDatos.
export function usePanelCocina(opts: {
  autenticado: boolean;
  rol: string;
  sedes: Sede[];
  setError: (v: string) => void;
}) {
  const { autenticado, rol, sedes, setError } = opts;

  const [fechaPanel, setFechaPanel] = useState(() => hoyLocal());
  const [panelDia, setPanelDia] = useState<PanelCocina | null>(null);
  const [menuDia, setMenuDia] = useState<MenuItem[]>([]);
  const [panelCargando, setPanelCargando] = useState(false);

  const [sobrantesCargando, setSobrantesCargando] = useState(false);
  const [sobrantesGuardando, setSobrantesGuardando] = useState(false);
  const [sobrantesBorrador, setSobrantesBorrador] = useState<
    Record<string, { porciones: string; peso_kg: string }>
  >({});
  const [sobranteError, setSobranteError] = useState("");
  const [sobranteExito, setSobranteExito] = useState("");

  const cargarPanel = async (fecha: string) => {
    setPanelCargando(true);
    try {
      const [respPanel, respMenu] = await Promise.all([
        fetch(`${API_URL}/api/reservas/panel?fecha=${fecha}`, {
          headers: cabeceras(false),
        }),
        fetch(`${API_URL}/api/menus/hoy?fecha=${fecha}`,
        ),
      ]);
      if (!respPanel.ok) throw new Error("No se pudo cargar el panel");
      setPanelDia(await respPanel.json());
      const menuDatos = (await respMenu.json()) as { platos?: MenuItem[] };
      setMenuDia(menuDatos.platos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setPanelCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarPanel(fechaPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaPanel]);

  const cargarSobrantes = async (fecha: string) => {
    setSobrantesCargando(true);
    setSobranteError("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/sobrantes?fecha=${fecha}`,
        { headers: cabeceras(false) }
      );
      if (!respuesta.ok) throw new Error("No se pudieron cargar los sobrantes");
      const datos = (await respuesta.json()) as Sobrante[];
      const borrador: Record<string, { porciones: string; peso_kg: string }> = {};
      for (const s of datos) {
        borrador[`${s.sede}||${s.turno}`] = {
          porciones: s.porciones !== null ? String(s.porciones) : "",
          peso_kg: s.peso_kg !== null ? String(s.peso_kg) : "",
        };
      }
      setSobrantesBorrador(borrador);
    } catch (err) {
      setSobranteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSobrantesCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarSobrantes(fechaPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaPanel]);

  const cambiarSobrante = (
    sede: string,
    turno: string,
    campo: "porciones" | "peso_kg",
    valor: string
  ) => {
    setSobrantesBorrador((prev) => {
      const actual = prev[`${sede}||${turno}`] || { porciones: "", peso_kg: "" };
      return { ...prev, [`${sede}||${turno}`]: { ...actual, [campo]: valor } };
    });
  };

  const guardarSobrantes = async () => {
    setSobranteError("");
    setSobranteExito("");
    const filas: { sede: string; turno: string; porciones: string; peso_kg: string }[] = [];
    for (const sede of sedes) {
      for (const turno of TURNOS_SOBRANTES) {
        const datos = sobrantesBorrador[`${sede.nombre}||${turno}`];
        if (datos && (datos.porciones.trim() || datos.peso_kg.trim())) {
          filas.push({ sede: sede.nombre, turno, ...datos });
        }
      }
    }

    if (filas.length === 0) {
      setSobranteError("Escribe al menos una porción o peso para guardar.");
      return;
    }

    setSobrantesGuardando(true);
    try {
      await Promise.all(
        filas.map((fila) =>
          fetch(`${API_URL}/api/sobrantes`, {
            method: "POST",
            headers: cabeceras(true),
            body: JSON.stringify({
              fecha: fechaPanel,
              sede: fila.sede,
              turno: fila.turno,
              porciones: fila.porciones.trim() || null,
              peso_kg: fila.peso_kg.trim() || null,
            }),
          })
        )
      );
      setSobranteExito("Sobrantes guardados correctamente.");
    } catch (err) {
      setSobranteError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSobrantesGuardando(false);
    }
  };

  return {
    fechaPanel,
    setFechaPanel,
    panelDia,
    panelCargando,
    menuDia,
    sedes,
    sobrantesCargando,
    sobrantesGuardando,
    sobrantesBorrador,
    sobranteError,
    sobranteExito,
    cambiarSobrante,
    guardarSobrantes,
  };
}

function hoyLocal(): string {
  const f = new Date();
  const m = String(f.getMonth() + 1).padStart(2, "0");
  const d = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${m}-${d}`;
}