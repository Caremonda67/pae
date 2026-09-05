import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Sede } from "../types";

// Estado y operaciones del tab "sedes": registro, edicion y borrado de
// sedes. Vive fuera de Admin.tsx para que el panel no concentre logica de
// todos los tabs en un solo archivo.
export function useSedes(opts: {
  sedes: Sede[];
  cargarDatos: () => Promise<void>;
}) {
  const { sedes, cargarDatos } = opts;

  const [nombreSede, setNombreSede] = useState("");
  const [editandoSede, setEditandoSede] = useState<number | null>(null);
  const [editNombreSede, setEditNombreSede] = useState("");
  const [sedeError, setSedeError] = useState("");
  const [sedeExito, setSedeExito] = useState("");

  const registrarSede = async (e: React.FormEvent) => {
    e.preventDefault();
    setSedeError("");
    setSedeExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/sedes`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ nombre: nombreSede }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo registrar la sede");
      }
      setNombreSede("");
      setSedeExito("✅ Sede registrada. Ya aparece en la reserva y en los beneficiarios.");
      cargarDatos();
    } catch (err) {
      setSedeError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const iniciarEdicionSede = (s: Sede) => {
    setEditandoSede(s.id);
    setEditNombreSede(s.nombre);
  };

  const guardarEdicionSede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoSede === null) return;
    setSedeError("");
    setSedeExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/sedes/${editandoSede}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ nombre: editNombreSede }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo actualizar la sede");
      }
      setEditandoSede(null);
      setSedeExito("✅ Sede actualizada. Los beneficiarios y reservas se actualizaron.");
      cargarDatos();
    } catch (err) {
      setSedeError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const borrarSede = async (id: number) => {
    setSedeError("");
    setSedeExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/sedes/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo borrar la sede");
      }
      cargarDatos();
    } catch (err) {
      setSedeError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return {
    sedes,
    nombreSede,
    editandoSede,
    editNombreSede,
    sedeError,
    sedeExito,
    setNombreSede,
    setEditNombreSede,
    setEditandoSede,
    registrarSede,
    iniciarEdicionSede,
    guardarEdicionSede,
    borrarSede,
  };
}