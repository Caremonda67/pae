import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Beneficiario, Sede } from "../types";

// Estado y operaciones del tab "beneficiarios": el formulario de alta, la
// asignacion de PINs y el borrado. Incluye el effect que deja la sede por
// defecto al cargar las sedes. Vive fuera de Admin.tsx para que el panel no
// concentre logica de todos los tabs en un solo archivo.
export function useBeneficiarios(opts: {
  beneficiarios: Beneficiario[];
  sedes: Sede[];
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
}) {
  const { beneficiarios, sedes, cargarDatos, setError } = opts;

  const [docBen, setDocBen] = useState("");
  const [nombreBen, setNombreBen] = useState("");
  const [sedeBen, setSedeBen] = useState("");
  const [turnoBen, setTurnoBen] = useState("Almuerzo");
  const [gradoBen, setGradoBen] = useState("");
  const [pinBen, setPinBen] = useState("");
  const [alergiasBen, setAlergiasBen] = useState("");
  const [prefBen, setPrefBen] = useState("");
  const [benError, setBenError] = useState("");
  const [benExito, setBenExito] = useState("");

  const [pins, setPins] = useState<Record<number, string>>({});

  useEffect(() => {
    if (sedes.length === 0) return;
    if (!sedes.some((s) => s.nombre === sedeBen)) setSedeBen(sedes[0].nombre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedes]);

  const registrarBeneficiario = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenError("");
    setBenExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({
          documento: docBen,
          nombre: nombreBen,
          sede: sedeBen,
          turno: turnoBen,
          grado: gradoBen,
          pin: pinBen,
          alergias: alergiasBen.trim() || null,
          preferencias: prefBen || null,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo registrar");
      }
      setDocBen("");
      setNombreBen("");
      setGradoBen("");
      setPinBen("");
      setAlergiasBen("");
      setPrefBen("");
      setBenExito("✅ Beneficiario registrado. Ya puede reservar su minuta.");
      cargarDatos();
    } catch (err) {
      setBenError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const asignarPin = async (ben: Beneficiario) => {
    const pin = (pins[ben.id] || "").trim();
    if (!pin) return;
    setBenError("");
    setBenExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios/${ben.id}/pin`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ pin }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo asignar el PIN");
      setPins((p) => ({ ...p, [ben.id]: "" }));
      setBenExito(`✅ PIN asignado a ${ben.nombre}. Ya puede entrar a reservar.`);
    } catch (err) {
      setBenError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const borrarBeneficiario = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios/${id}`, {
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
    beneficiarios,
    sedes,
    docBen,
    setDocBen,
    nombreBen,
    setNombreBen,
    sedeBen,
    setSedeBen,
    turnoBen,
    setTurnoBen,
    gradoBen,
    setGradoBen,
    pinBen,
    setPinBen,
    alergiasBen,
    setAlergiasBen,
    prefBen,
    setPrefBen,
    benError,
    benExito,
    pins,
    setPins,
    registrarBeneficiario,
    asignarPin,
    borrarBeneficiario,
  };
}