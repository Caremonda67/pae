import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { MenuSemanaAdmin } from "../types";

// Estado y operaciones del tab "menu": el formulario de alta de platos y
// el cambio de estado/borrado de los platos de las semanas. Vive fuera de
// Admin.tsx para que el panel no concentre logica de todos los tabs en un
// solo archivo.
export function useMenu(opts: {
  menu: MenuSemanaAdmin[];
  subirImagen: (archivo: File, setter: (url: string) => void) => Promise<string>;
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const { menu, subirImagen, cargarDatos, setError } = opts;

  const [semanaMenu, setSemanaMenu] = useState(1);
  const [diaMenu, setDiaMenu] = useState("Lunes");
  const [jornadaMenu, setJornadaMenu] = useState("Almuerzo");
  const [varianteMenu, setVarianteMenu] = useState("Estandar");
  const [platilloMenu, setPlatilloMenu] = useState("");
  const [descripcionMenu, setDescripcionMenu] = useState("");
  const [caloriasMenu, setCaloriasMenu] = useState("");
  const [imagenMenu, setImagenMenu] = useState("");
  const [publicarMenuAhora, setPublicarMenuAhora] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [menuExito, setMenuExito] = useState("");

  const registrarMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError("");
    setMenuExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/menus`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({
          semana: semanaMenu,
          dia: diaMenu,
          jornada: jornadaMenu,
          variante: varianteMenu,
          platillo: platilloMenu,
          descripcion: descripcionMenu,
          calorias: caloriasMenu ? Number(caloriasMenu) : null,
          imagen: imagenMenu || null,
          estado: publicarMenuAhora ? "publicado" : "borrador",
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar el plato");
      }
      setPlatilloMenu("");
      setDescripcionMenu("");
      setCaloriasMenu("");
      setImagenMenu("");
      setMenuExito(
        publicarMenuAhora
          ? "✅ Plato agregado al menú y ya se ve en la web."
          : "✅ Plato guardado como borrador. Se verá cuando alguien lo publique."
      );
      cargarDatos();
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const cambiarEstadoPlato = async (id: number, estado: string) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/menus/${id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ estado }),
      });
      if (!respuesta.ok) throw new Error("No se pudo cambiar el estado del plato");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const borrarPlato = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/menus/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar el plato");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return {
    menu,
    semanaMenu,
    setSemanaMenu,
    diaMenu,
    setDiaMenu,
    jornadaMenu,
    setJornadaMenu,
    varianteMenu,
    setVarianteMenu,
    platilloMenu,
    setPlatilloMenu,
    descripcionMenu,
    setDescripcionMenu,
    caloriasMenu,
    setCaloriasMenu,
    imagenMenu,
    setImagenMenu,
    publicarMenuAhora,
    setPublicarMenuAhora,
    menuError,
    menuExito,
    registrarMenu,
    cambiarEstadoPlato,
    borrarPlato,
    subirImagen,
    setMenuError,
  };
}