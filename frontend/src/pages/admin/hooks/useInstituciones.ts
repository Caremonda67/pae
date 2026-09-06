import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Institucion } from "../types";

// Estado y operaciones del tab "instituciones": registro de instituciones
// educativas y borrado. Vive fuera de Admin.tsx para que el panel no
// concentre logica de todos los tabs en un solo archivo.
export function useInstituciones(opts: {
  instituciones: Institucion[];
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const { instituciones, cargarDatos, setError } = opts;

  const [nombreInst, setNombreInst] = useState("");
  const [instError, setInstError] = useState("");
  const [instExito, setInstExito] = useState("");

  const registrarInstitucion = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstError("");
    setInstExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/instituciones`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ nombre: nombreInst }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo registrar la institución");
      }
      setNombreInst("");
      setInstExito("✅ Institución registrada. Ya cuenta en la métrica de la página.");
      cargarDatos();
    } catch (err) {
      setInstError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const borrarInstitucion = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return {
    instituciones,
    nombreInst,
    instError,
    instExito,
    setNombreInst,
    registrarInstitucion,
    borrarInstitucion,
  };
}