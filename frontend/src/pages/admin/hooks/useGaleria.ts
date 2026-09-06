import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { FotoGaleria } from "../types";

// Estado y operaciones del tab "galeria": el formulario de publicacion de
// fotos y el borrado. Vive fuera de Admin.tsx para que el panel no concentre
// logica de todos los tabs en un solo archivo.
export function useGaleria(opts: {
  galeria: FotoGaleria[];
  subirImagen: (archivo: File, setter: (url: string) => void) => Promise<string>;
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const { galeria, subirImagen, cargarDatos, setError } = opts;

  const [tituloGaleria, setTituloGaleria] = useState("");
  const [descripcionGaleria, setDescripcionGaleria] = useState("");
  const [imagenGaleria, setImagenGaleria] = useState("");
  const [galeriaError, setGaleriaError] = useState("");
  const [galeriaExito, setGaleriaExito] = useState("");

  const publicarFotoGaleria = async (e: React.FormEvent) => {
    e.preventDefault();
    setGaleriaError("");
    setGaleriaExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/galeria`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({
          titulo: tituloGaleria,
          imagen: imagenGaleria,
          descripcion: descripcionGaleria,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar la foto");
      }
      setTituloGaleria("");
      setDescripcionGaleria("");
      setImagenGaleria("");
      setGaleriaExito("✅ Foto publicada en la galería de la página de inicio.");
      cargarDatos();
    } catch (err) {
      setGaleriaError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const borrarFotoGaleria = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/galeria/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar la foto");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return {
    galeria,
    tituloGaleria,
    setTituloGaleria,
    descripcionGaleria,
    setDescripcionGaleria,
    imagenGaleria,
    setImagenGaleria,
    galeriaError,
    galeriaExito,
    publicarFotoGaleria,
    borrarFotoGaleria,
    subirImagen,
  };
}