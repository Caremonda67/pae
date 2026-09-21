import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Juego } from "../../juegos/types";

interface UseJuegosParams {
  autenticado: boolean;
  pestana: string;
}

export function useJuegos({ autenticado, pestana }: UseJuegosParams) {
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("pendiente");
  const [juegoPrevisualizando, setJuegoPrevisualizando] = useState<Juego | null>(null);
  const [actualizacionesPendientes, setActualizacionesPendientes] = useState<Juego[]>([]);

  const cargarJuegosAdmin = useCallback(async () => {
    if (!autenticado || pestana !== "juegos") return;
    setCargando(true);
    setError("");
    try {
      const resp = await fetch(`${API_URL}/api/juegos/admin/todos`, {
        headers: cabeceras(false),
      });
      if (!resp.ok) throw new Error("No se pudieron cargar los juegos");
      const data = await resp.json();
      setJuegos(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener la lista de juegos");
    } finally {
      setCargando(false);
    }
  }, [autenticado, pestana]);

  const cargarActualizaciones = useCallback(async () => {
    if (!autenticado || pestana !== "juegos") return;
    try {
      const resp = await fetch(`${API_URL}/api/juegos/admin/actualizaciones`, {
        headers: cabeceras(false),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      setActualizacionesPendientes(Array.isArray(data) ? data : []);
    } catch {
      // silencioso
    }
  }, [autenticado, pestana]);

  useEffect(() => {
    cargarJuegosAdmin();
    cargarActualizaciones();
  }, [cargarJuegosAdmin, cargarActualizaciones]);

  const revisarActualizacion = async (id: number, decision: "aprobar" | "rechazar", motivo?: string) => {
    setError("");
    setExito("");
    try {
      const resp = await fetch(`${API_URL}/api/juegos/${id}/revisar-actualizacion`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ decision, motivo: decision === "rechazar" ? motivo : undefined }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.error || "No se pudo procesar la actualización");
      }
      const actualizado = await resp.json();
      setActualizacionesPendientes((prev) => prev.filter((j) => j.id !== id));
      setJuegos((prev) => prev.map((j) => (j.id === id ? actualizado : j)));
      setExito(
        decision === "aprobar"
          ? `Actualización v${actualizado.version || "?"} de "${actualizado.titulo}" aprobada y publicada.`
          : `Actualización de "${actualizado.titulo}" rechazada.`
      );
    } catch (err: any) {
      setError(err.message || "Error al procesar la actualización");
    }
  };

  const cambiarEstado = async (id: number, nuevoEstado: "aprobado" | "rechazado", motivo?: string) => {
    setError("");
    setExito("");
    try {
      const resp = await fetch(`${API_URL}/api/juegos/${id}/estado`, {
        method: "PATCH",
        headers: cabeceras(),
        body: JSON.stringify({ estado: nuevoEstado, motivo_rechazo: motivo }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.error || "No se pudo actualizar el estado del juego");
      }
      const actualizado = await resp.json();
      setJuegos((prev) => prev.map((j) => (j.id === id ? actualizado : j)));
      setExito(`Juego "${actualizado.titulo}" ${nuevoEstado === "aprobado" ? "aprobado y publicado" : "rechazado"}.`);
      if (juegoPrevisualizando?.id === id) {
        setJuegoPrevisualizando(null);
      }
    } catch (err: any) {
      setError(err.message || "Error al actualizar estado");
    }
  };

  const eliminarJuego = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este juego por completo?")) return;
    setError("");
    setExito("");
    try {
      const resp = await fetch(`${API_URL}/api/juegos/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!resp.ok) throw new Error("No se pudo eliminar el juego");
      setJuegos((prev) => prev.filter((j) => j.id !== id));
      setExito("Juego eliminado de la base de datos.");
    } catch (err: any) {
      setError(err.message || "Error al eliminar juego");
    }
  };

  const juegosFiltrados = juegos.filter((j) => {
    if (filtroEstado === "todos") return true;
    return j.estado === filtroEstado;
  });

  const pendientesCount = juegos.filter((j) => j.estado === "pendiente").length;

  return {
    juegos: juegosFiltrados,
    cargando,
    error,
    exito,
    filtroEstado,
    setFiltroEstado,
    pendientesCount,
    actualizacionesPendientes,
    revisarActualizacion,
    juegoPrevisualizando,
    setJuegoPrevisualizando,
    cambiarEstado,
    eliminarJuego,
    recargar: cargarJuegosAdmin,
  };
}
