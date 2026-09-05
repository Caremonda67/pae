import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Aviso } from "../types";

// Estado y operaciones del tab "avisos": el formulario de publicacion y el
// cambio de estado/borrado de los avisos. Vive fuera de Admin.tsx para que
// el panel no concentre logica de todos los tabs en un solo archivo.
export function useAvisos(opts: {
  avisos: Aviso[];
  subirImagen: (archivo: File, setter: (url: string) => void) => Promise<string>;
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const { avisos, subirImagen, cargarDatos, setError } = opts;

  const [tituloAviso, setTituloAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");
  const [fechaAviso, setFechaAviso] = useState("");
  const [imagenAviso, setImagenAviso] = useState("");
  const [publicarAvisoAhora, setPublicarAvisoAhora] = useState(true);
  const [avisoError, setAvisoError] = useState("");
  const [avisoExito, setAvisoExito] = useState("");

  const publicarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoError("");
    setAvisoExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({
          titulo: tituloAviso,
          texto: textoAviso,
          fecha: fechaAviso,
          imagen: imagenAviso || null,
          estado: publicarAvisoAhora ? "publicado" : "borrador",
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo publicar el aviso");
      }
      setTituloAviso("");
      setTextoAviso("");
      setFechaAviso("");
      setImagenAviso("");
      setAvisoExito(
        publicarAvisoAhora
          ? "✅ Aviso publicado. Ya aparece en la página y el bot lo conoce."
          : "✅ Aviso guardado como borrador. Se verá cuando alguien lo publique."
      );
      cargarDatos();
    } catch (err) {
      setAvisoError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const cambiarEstadoAviso = async (id: number, estado: string) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos/${id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ estado }),
      });
      if (!respuesta.ok) throw new Error("No se pudo cambiar el estado del aviso");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const borrarAviso = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos/${id}`, {
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
    avisos,
    tituloAviso,
    setTituloAviso,
    textoAviso,
    setTextoAviso,
    fechaAviso,
    setFechaAviso,
    imagenAviso,
    setImagenAviso,
    publicarAvisoAhora,
    setPublicarAvisoAhora,
    avisoError,
    avisoExito,
    publicarAviso,
    cambiarEstadoAviso,
    borrarAviso,
    subirImagen,
  };
}