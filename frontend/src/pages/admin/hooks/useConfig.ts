import { useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Sede } from "../types";

// Estado y operaciones del tab "configuracion": hora limite de reserva y
// cupos por sede. Vive fuera de Admin.tsx para que el panel no concentre
// logica de todos los tabs en un solo archivo. El estado config/horaLimite/
// cupos lo puebla cargarDatos, asi que se recibe desde fuera.
export function useConfig(opts: {
  config: { hora_limite_reserva: string | null; cupos_sede: Record<string, number> };
  horaLimite: string;
  setHoraLimite: (v: string) => void;
  cupos: Record<string, string>;
  setCupos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sedes: Sede[];
  cargarDatos: () => Promise<void>;
}) {
  const {
    config,
    horaLimite,
    setHoraLimite,
    cupos,
    setCupos,
    sedes,
    cargarDatos,
  } = opts;

  const [configMensaje, setConfigMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  const guardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMensaje(null);
    try {
      const cuposNumero: Record<string, number> = {};
      for (const [sede, valor] of Object.entries(cupos)) {
        const numero = valor.trim() === "" ? 0 : Number(valor);
        if (!Number.isInteger(numero) || numero < 0) {
          setConfigMensaje({
            tipo: "error",
            texto: `El cupo de "${sede}" debe ser un número entero (0 o más).`,
          });
          return;
        }
        cuposNumero[sede] = numero;
      }

      const respuesta = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({
          hora_limite_reserva: horaLimite.trim() || null,
          cupos_sede: cuposNumero,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar la configuración");
      }
      setConfigMensaje({ tipo: "exito", texto: "✅ Configuración guardada." });
      cargarDatos();
    } catch (err) {
      setConfigMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  };

  return {
    config,
    horaLimite,
    setHoraLimite,
    cupos,
    setCupos,
    configMensaje,
    sedes,
    guardarConfig,
  };
}