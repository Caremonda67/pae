import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Sede, TurnoCocina, UsuarioCocina } from "../types";

// Estado y operaciones del tab "turnos": asignacion y retiro de turnos de
// cocina por fecha/sede. Vive fuera de Admin.tsx para que el panel no
// concentre logica de todos los tabs en un solo archivo. Las listas
// turnos/listaCocina y el usuario por defecto los puebla cargarDatos, asi
// que se reciben desde fuera.
export function useTurnos(opts: {
  turnos: TurnoCocina[];
  listaCocina: UsuarioCocina[];
  fechaTurno: string;
  setFechaTurno: (v: string) => void;
  usuarioTurno: string;
  setUsuarioTurno: (v: string) => void;
  sedes: Sede[];
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const {
    turnos,
    listaCocina,
    fechaTurno,
    setFechaTurno,
    usuarioTurno,
    setUsuarioTurno,
    sedes,
    cargarDatos,
    setError,
  } = opts;

  const [sedeTurno, setSedeTurno] = useState("");
  const [turnosMensaje, setTurnosMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  const asignarTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setTurnosMensaje(null);
    if (!usuarioTurno || !sedeTurno) {
      setTurnosMensaje({ tipo: "error", texto: "Elige el personal de cocina y la sede." });
      return;
    }
    try {
      const respuesta = await fetch(`${API_URL}/api/turnos`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ fecha: fechaTurno, usuario: usuarioTurno, sede: sedeTurno }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo asignar el turno");
      }
      setTurnosMensaje({ tipo: "exito", texto: "✅ Turno asignado." });
      cargarDatos();
    } catch (err) {
      setTurnosMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  };

  const quitarTurno = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/turnos/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo quitar el turno");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return {
    turnos,
    listaCocina,
    fechaTurno,
    setFechaTurno,
    usuarioTurno,
    setUsuarioTurno,
    sedeTurno,
    setSedeTurno,
    turnosMensaje,
    sedes,
    asignarTurno,
    quitarTurno,
  };
}