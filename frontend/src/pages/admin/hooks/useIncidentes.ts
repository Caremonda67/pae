import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Incidente } from "../types";

function hoyLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

function fechaCortaDia(fecha: string) {
  const [año, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${año}`;
}

// Estado y operaciones del tab "incidentes": la lista, el filtro, el
// formulario de reporte y la edicion. Vive fuera de Admin.tsx para que
// el panel no concentre logica de todos los tabs en un solo archivo.
export function useIncidentes(opts: {
  rol: string;
  autenticado: boolean;
  pestana: string;
  subirImagen: (archivo: File, setter: (url: string) => void) => Promise<string>;
}) {
  const { rol, autenticado, pestana, subirImagen } = opts;

  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [incidentesFiltro, setIncidentesFiltro] = useState<"todos" | "pendientes" | "resueltos">("todos");
  const [incidenteCargando, setIncidenteCargando] = useState(false);
  const [incidenteError, setIncidenteError] = useState("");
  const [incidenteExito, setIncidenteExito] = useState("");
  const [incidenteEstudiantes, setIncidenteEstudiantes] = useState<
    { documento: string; nombre: string; grado?: string }[]
  >([]);
  const [incidenteDoc, setIncidenteDoc] = useState("");
  const [incidenteTipo, setIncidenteTipo] = useState("Incidente");
  const [incidenteDescripcion, setIncidenteDescripcion] = useState("");
  const [incidenteFecha, setIncidenteFecha] = useState(() => hoyLocal());
  const [incidenteImagen, setIncidenteImagen] = useState("");
  const [incidenteEnviando, setIncidenteEnviando] = useState(false);
  const [incidenteResolviendo, setIncidenteResolviendo] = useState<number | null>(null);
  const [editandoIncidente, setEditandoIncidente] = useState<Incidente | null>(null);
  const [editIncidenteTipo, setEditIncidenteTipo] = useState("Incidente");
  const [editIncidenteDoc, setEditIncidenteDoc] = useState("");
  const [editIncidenteDescripcion, setEditIncidenteDescripcion] = useState("");
  const [editIncidenteFecha, setEditIncidenteFecha] = useState(() => hoyLocal());
  const [editIncidenteImagen, setEditIncidenteImagen] = useState("");
  const [editIncidenteEnviando, setEditIncidenteEnviando] = useState(false);
  const [incidentesDesde, setIncidentesDesde] = useState("");
  const [incidentesHasta, setIncidentesHasta] = useState("");
  const [incidentesBusqueda, setIncidentesBusqueda] = useState("");

  const cargarIncidentes = async () => {
    setIncidenteCargando(true);
    setIncidenteError("");
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes`, {
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudieron cargar los reportes");
      }
      setIncidentes(datos || []);
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIncidenteCargando(false);
    }
  };

  const cargarEstudiantesIncidente = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/estudiantes`, {
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (respuesta.ok) setIncidenteEstudiantes(datos?.estudiantes || []);
    } catch {
      setIncidenteEstudiantes([]);
    }
  };

  const reportarIncidente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidenteError("");
    setIncidenteExito("");
    if (!incidenteDoc) {
      setIncidenteError("Elige al estudiante de tu grupo.");
      return;
    }
    setIncidenteEnviando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes`, {
        method: "POST",
        headers: cabeceras(true),
        body: JSON.stringify({
          tipo: incidenteTipo,
          documento: incidenteDoc,
          descripcion: incidenteDescripcion,
          fecha: incidenteFecha,
          imagen: incidenteImagen || null,
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo registrar el reporte");
      }
      setIncidenteExito(
        `✅ ${incidenteTipo} de ${datos.estudiante} reportado. El coordinador ya puede verlo.`
      );
      setIncidentes((lista) => [datos, ...lista]);
      setIncidenteDoc("");
      setIncidenteDescripcion("");
      setIncidenteTipo("Incidente");
      setIncidenteImagen("");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIncidenteEnviando(false);
    }
  };

  const adjuntarFotoIncidente = async (
    archivo: File,
    setter: (url: string) => void,
    setSubiendo: (b: boolean) => void
  ) => {
    setSubiendo(true);
    try {
      const url = await subirImagen(archivo, setter);
      if (!url) throw new Error("No se pudo subir la foto");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error al subir la foto");
    } finally {
      setSubiendo(false);
    }
  };

  const resolverIncidente = async (id: number, resuelto: boolean) => {
    setIncidenteError("");
    setIncidenteExito("");
    setIncidenteResolviendo(id);
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/${id}`, {
        method: "PUT",
        headers: cabeceras(true),
        body: JSON.stringify({ resuelto }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo actualizar el reporte");
      }
      setIncidentes((lista) => lista.map((i) => (i.id === id ? datos : i)));
      setIncidenteExito(resuelto ? "✅ Reporte marcado como resuelto." : "Reporte reabierto.");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIncidenteResolviendo(null);
    }
  };

  const abrirEdicionIncidente = (inc: Incidente) => {
    setEditandoIncidente(inc);
    setEditIncidenteTipo(inc.tipo);
    setEditIncidenteDoc(inc.documento || "");
    setEditIncidenteDescripcion(inc.descripcion);
    setEditIncidenteFecha(inc.fecha);
    setEditIncidenteImagen(inc.imagen || "");
  };

  const guardarIncidenteEditado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoIncidente) return;
    setIncidenteError("");
    setIncidenteExito("");
    if (!editIncidenteDoc) {
      setIncidenteError("Elige al estudiante de tu grupo.");
      return;
    }
    setEditIncidenteEnviando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/${editandoIncidente.id}`, {
        method: "PUT",
        headers: cabeceras(true),
        body: JSON.stringify({
          tipo: editIncidenteTipo,
          documento: editIncidenteDoc,
          descripcion: editIncidenteDescripcion,
          fecha: editIncidenteFecha,
          imagen: editIncidenteImagen || null,
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo guardar el reporte");
      }
      setIncidentes((lista) => lista.map((i) => (i.id === editandoIncidente.id ? datos : i)));
      setEditandoIncidente(null);
      setIncidenteExito("✅ Reporte actualizado.");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEditIncidenteEnviando(false);
    }
  };

  const borrarIncidente = async (inc: Incidente) => {
    if (
      !window.confirm(
        `¿Borrar el ${inc.tipo.toLowerCase()} de ${inc.estudiante} del ${fechaCortaDia(inc.fecha)}?`
      )
    ) {
      return;
    }
    setIncidenteError("");
    setIncidenteExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/${inc.id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo borrar el reporte");
      }
      setIncidentes((lista) => lista.filter((i) => i.id !== inc.id));
      setIncidenteExito("🗑️ Reporte borrado.");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const incidentesVisibles = incidentes.filter((i) => {
    const porEstado =
      incidentesFiltro === "todos"
        ? true
        : incidentesFiltro === "pendientes"
          ? !i.resuelto
          : i.resuelto;
    const enRango =
      (!incidentesDesde || i.fecha >= incidentesDesde) &&
      (!incidentesHasta || i.fecha <= incidentesHasta);
    const coincideBusqueda =
      !incidentesBusqueda.trim() ||
      i.estudiante.toLowerCase().includes(incidentesBusqueda.trim().toLowerCase()) ||
      (i.documento || "").toLowerCase().includes(incidentesBusqueda.trim().toLowerCase());
    return porEstado && enRango && coincideBusqueda;
  });

  useEffect(() => {
    if (!autenticado || pestana !== "incidentes") return;
    cargarIncidentes();
    if (rol === "profesor") cargarEstudiantesIncidente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  return {
    incidentes,
    incidentesVisibles,
    incidenteCargando,
    incidenteError,
    incidenteExito,
    incidenteEstudiantes,
    incidenteDoc,
    setIncidenteDoc,
    incidenteTipo,
    setIncidenteTipo,
    incidenteDescripcion,
    setIncidenteDescripcion,
    incidenteFecha,
    setIncidenteFecha,
    incidenteImagen,
    setIncidenteImagen,
    incidenteEnviando,
    incidenteResolviendo,
    editandoIncidente,
    setEditandoIncidente,
    editIncidenteTipo,
    setEditIncidenteTipo,
    editIncidenteDoc,
    setEditIncidenteDoc,
    editIncidenteDescripcion,
    setEditIncidenteDescripcion,
    editIncidenteFecha,
    setEditIncidenteFecha,
    editIncidenteImagen,
    setEditIncidenteImagen,
    editIncidenteEnviando,
    incidentesFiltro,
    setIncidentesFiltro,
    incidentesDesde,
    setIncidentesDesde,
    incidentesHasta,
    setIncidentesHasta,
    incidentesBusqueda,
    setIncidentesBusqueda,
    reportarIncidente,
    adjuntarFotoIncidente,
    resolverIncidente,
    abrirEdicionIncidente,
    guardarIncidenteEditado,
    borrarIncidente,
  };
}