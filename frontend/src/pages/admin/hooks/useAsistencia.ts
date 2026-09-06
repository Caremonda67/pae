import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { ReservaAsistencia } from "../types";

function hoyLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

// Estado y operaciones del tab "asistencia": el grupo visible del profesor,
// la lista de reservas del día y el marcado de asistencia individual/todos.
export function useAsistencia(opts: { autenticado: boolean; pestana: string }) {
  const { autenticado, pestana } = opts;

  const [asistenciaFecha, setAsistenciaFecha] = useState(() => hoyLocal());
  const [asistenciaGrupo, setAsistenciaGrupo] = useState<{
    sede: string;
    turno: string;
    grado: string;
  } | null>(null);
  const [asistenciaReservas, setAsistenciaReservas] = useState<ReservaAsistencia[]>([]);
  const [asistenciaCargando, setAsistenciaCargando] = useState(false);
  const [asistenciaError, setAsistenciaError] = useState("");
  const [asistenciaExito, setAsistenciaExito] = useState("");

  const cargarAsistencia = async (fecha: string) => {
    setAsistenciaCargando(true);
    setAsistenciaError("");
    setAsistenciaExito("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/asistencia/grupo?fecha=${fecha}`,
        { headers: cabeceras(false) }
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo cargar la asistencia");
      }
      setAsistenciaGrupo(datos.grupo);
      setAsistenciaReservas(datos.reservas || []);
    } catch (err) {
      setAsistenciaError(err instanceof Error ? err.message : "Error desconocido");
      setAsistenciaReservas([]);
      setAsistenciaGrupo(null);
    } finally {
      setAsistenciaCargando(false);
    }
  };

  const marcarAsistencia = async (reserva: ReservaAsistencia) => {
    const nuevoEstado = !reserva.asistio;
    setAsistenciaError("");
    setAsistenciaExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/asistencia/${reserva.id}`, {
        method: "PUT",
        headers: cabeceras(true),
        body: JSON.stringify({ asistio: nuevoEstado }),
      });
      if (!respuesta.ok) throw new Error("No se pudo marcar la asistencia");
      setAsistenciaReservas((lista) =>
        lista.map((r) => (r.id === reserva.id ? { ...r, asistio: nuevoEstado } : r))
      );
    } catch (err) {
      setAsistenciaError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const marcarTodosAsistencia = async (asistio: boolean) => {
    setAsistenciaError("");
    setAsistenciaExito("");
    try {
      const pendientes = asistenciaReservas.filter((r) => r.asistio !== asistio);
      const resultados = await Promise.all(
        pendientes.map((r) =>
          fetch(`${API_URL}/api/asistencia/${r.id}`, {
            method: "PUT",
            headers: cabeceras(true),
            body: JSON.stringify({ asistio }),
          })
        )
      );
      const fallo = resultados.find((r) => !r.ok);
      if (fallo) throw new Error(`No se pudieron marcar todos (${fallo.status})`);
      setAsistenciaReservas((lista) => lista.map((r) => ({ ...r, asistio })));
      setAsistenciaExito(asistio ? "✅ Todos marcados como asistieron." : "Asistencia desmarcada.");
    } catch (err) {
      setAsistenciaError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  useEffect(() => {
    if (!autenticado || pestana !== "asistencia") return;
    if (asistenciaGrupo === null) cargarAsistencia(asistenciaFecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  return {
    asistenciaFecha,
    setAsistenciaFecha,
    asistenciaGrupo,
    asistenciaReservas,
    asistenciaCargando,
    asistenciaError,
    asistenciaExito,
    cargarAsistencia,
    marcarAsistencia,
    marcarTodosAsistencia,
  };
}