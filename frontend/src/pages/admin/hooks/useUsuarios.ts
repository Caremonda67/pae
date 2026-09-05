import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Usuario, Sede } from "../types";

// Estado y operaciones del tab "usuarios": el formulario de alta de
// cuentas, la lista de cuentas creadas y la edicion/activacion/borrado.
// Vive fuera de Admin.tsx para que el panel no concentre logica de todos
// los tabs en un solo archivo.
export function useUsuarios(opts: {
  usuarios: Usuario[];
  sedes: Sede[];
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const { usuarios, sedes, cargarDatos, setError } = opts;

  const [nombreUsu, setNombreUsu] = useState("");
  const [usuarioUsu, setUsuarioUsu] = useState("");
  const [rolUsu, setRolUsu] = useState("cocina");
  const [claveUsu, setClaveUsu] = useState("");
  const [sedeUsu, setSedeUsu] = useState("");
  const [turnoUsu, setTurnoUsu] = useState("Almuerzo");
  const [gradoUsu, setGradoUsu] = useState("");
  const [usuError, setUsuError] = useState("");
  const [usuExito, setUsuExito] = useState("");

  const [editandoUsuario, setEditandoUsuario] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUsuario, setEditUsuario] = useState("");
  const [editRol, setEditRol] = useState("cocina");
  const [editClave, setEditClave] = useState("");
  const [editSede, setEditSede] = useState("");
  const [editTurno, setEditTurno] = useState("Almuerzo");
  const [editGrado, setEditGrado] = useState("");

  const registrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsuError("");
    setUsuExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({
          nombre: nombreUsu,
          usuario: usuarioUsu,
          rol: rolUsu,
          clave: claveUsu,
          sede: rolUsu === "profesor" ? sedeUsu : undefined,
          turno: rolUsu === "profesor" ? turnoUsu : undefined,
          grado: rolUsu === "profesor" ? gradoUsu : undefined,
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo crear el usuario");
      }
      setNombreUsu("");
      setUsuarioUsu("");
      setClaveUsu("");
      setSedeUsu("");
      setGradoUsu("");
      setUsuExito("✅ Cuenta creada. Ese usuario ya puede entrar al panel.");
      cargarDatos();
    } catch (err) {
      setUsuError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const alternarUsuario = async (usuario: Usuario) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ activo: !usuario.activo }),
      });
      if (!respuesta.ok) throw new Error("No se pudo actualizar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const borrarUsuarioFunc = async (usuario: Usuario) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/${usuario.id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const iniciarEdicionUsuario = (u: Usuario) => {
    setEditandoUsuario(u.id);
    setEditNombre(u.nombre);
    setEditUsuario(u.usuario);
    setEditRol(u.rol);
    setEditClave("");
    setEditSede(u.sede || "");
    setEditTurno(u.turno || "Almuerzo");
    setEditGrado(u.grado || "");
  };

  const guardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoUsuario === null) return;
    try {
      const cuerpo: Record<string, unknown> = {
        nombre: editNombre,
        usuario: editUsuario,
        rol: editRol,
      };
      if (editClave) cuerpo.clave = editClave;
      if (editRol === "profesor") {
        cuerpo.sede = editSede;
        cuerpo.turno = editTurno;
        cuerpo.grado = editGrado;
      }
      const respuesta = await fetch(`${API_URL}/api/usuarios/${editandoUsuario}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo actualizar la cuenta");
      setEditandoUsuario(null);
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return {
    usuarios,
    sedes,
    nombreUsu,
    setNombreUsu,
    usuarioUsu,
    setUsuarioUsu,
    rolUsu,
    setRolUsu,
    claveUsu,
    setClaveUsu,
    sedeUsu,
    setSedeUsu,
    turnoUsu,
    setTurnoUsu,
    gradoUsu,
    setGradoUsu,
    usuError,
    usuExito,
    registrarUsuario,
    alternarUsuario,
    borrarUsuario: borrarUsuarioFunc,
    iniciarEdicionUsuario,
    editandoUsuario,
    setEditandoUsuario,
    editNombre,
    setEditNombre,
    editUsuario,
    setEditUsuario,
    editRol,
    setEditRol,
    editClave,
    setEditClave,
    editSede,
    setEditSede,
    editTurno,
    setEditTurno,
    editGrado,
    setEditGrado,
    guardarEdicionUsuario,
  };
}
