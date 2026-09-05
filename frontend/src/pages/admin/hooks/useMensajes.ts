import { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import type { Mensaje, MensajeChat } from "../types";

function aBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(archivo);
  });
}

// Estado y operaciones del tab "mensajes": la lista de contacto, los hilos
// abiertos, el envio de respuestas y el polling de nuevos mensajes. Vive
// fuera de Admin.tsx para que el panel no concentre logica de todos los
// tabs en un solo archivo. La lista `mensajes` la puebla cargarDatos, asi
// que se recibe desde fuera junto con su setter.
export function useMensajes(opts: {
  mensajes: Mensaje[];
  setMensajes: React.Dispatch<React.SetStateAction<Mensaje[]>>;
  cargarDatos: () => Promise<void>;
  setError: (v: string) => void;
  autenticado: boolean;
  pestana: string;
}) {
  const { mensajes, setMensajes, cargarDatos, setError, autenticado, pestana } = opts;

  const [hilos, setHilos] = useState<Record<number, MensajeChat[]>>({});
  const [hiloAbierto, setHiloAbierto] = useState<Record<number, boolean>>({});
  const [hiloCargando, setHiloCargando] = useState<Record<number, boolean>>({});
  const [hiloEnviando, setHiloEnviando] = useState<Record<number, boolean>>({});
  const [borradoresChat, setBorradoresChat] = useState<Record<number, string>>({});
  const [fotosChat, setFotosChat] = useState<Record<number, File | null>>({});
  const [borrandoHilo, setBorrandoHilo] = useState<Record<number, boolean>>({});
  const hilosRef = useRef(hilos);
  hilosRef.current = hilos;
  const hiloAbiertoRef = useRef(hiloAbierto);
  hiloAbiertoRef.current = hiloAbierto;

  const alternarLeido = async (mensaje: Mensaje) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/${mensaje.id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ leido: !mensaje.leido }),
      });
      if (!respuesta.ok) throw new Error("No se pudo actualizar el mensaje");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const cargarHilo = async (id: number) => {
    setHiloCargando((c) => ({ ...c, [id]: true }));
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/${id}/mensajes`, {
        headers: cabeceras(false),
      });
      if (respuesta.ok) {
        const datos = (await respuesta.json()) as MensajeChat[];
        setHilos((h) => ({ ...h, [id]: datos }));
      }
    } catch {
      // sin cambios
    } finally {
      setHiloCargando((c) => ({ ...c, [id]: false }));
    }
  };

  const abrirHilo = (id: number) => {
    setHiloAbierto((a) => {
      const abierto = !a[id];
      if (abierto) cargarHilo(id);
      return { ...a, [id]: abierto };
    });
  };

  const enviarMensajeAdmin = async (id: number) => {
    const texto = (borradoresChat[id] || "").trim();
    const foto = fotosChat[id];
    if (!texto && !foto) return;
    setHiloEnviando((e) => ({ ...e, [id]: true }));
    try {
      const cuerpo: Record<string, unknown> = { texto };
      if (foto) {
        cuerpo.imagenBase64 = await aBase64(foto);
        cuerpo.imagenNombre = foto.name;
      }
      const respuesta = await fetch(`${API_URL}/api/contacto/${id}/mensajes`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo enviar el mensaje");
      setBorradoresChat((b) => ({ ...b, [id]: "" }));
      setFotosChat((f) => ({ ...f, [id]: null }));
      cargarHilo(id);
      refrescarMensajes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setHiloEnviando((e) => ({ ...e, [id]: false }));
    }
  };

  const borrarConversacion = async (id: number) => {
    if (!window.confirm("¿Borrar esta conversación? No se puede deshacer.")) return;
    setBorrandoHilo((e) => ({ ...e, [id]: true }));
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo borrar la conversación");
      setMensajes((m) => m.filter((msj) => msj.id !== id));
      setHilos((h) => {
        const copia = { ...h };
        delete copia[id];
        return copia;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setBorrandoHilo((e) => ({ ...e, [id]: false }));
    }
  };

  const refrescarMensajes = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto`, {
        headers: cabeceras(false),
      });
      if (respuesta.ok) setMensajes(await respuesta.json());
    } catch {
      // sin cambios
    }
    for (const id of Object.keys(hilosRef.current)) {
      if (hiloAbiertoRef.current[Number(id)]) cargarHilo(Number(id));
    }
  };

  useEffect(() => {
    if (!autenticado || pestana !== "mensajes") return;
    refrescarMensajes();
    const intervalo = setInterval(refrescarMensajes, 7000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  return {
    mensajes,
    hilos,
    hiloAbierto,
    hiloCargando,
    hiloEnviando,
    borradoresChat,
    fotosChat,
    borrandoHilo,
    alternarLeido,
    abrirHilo,
    enviarMensajeAdmin,
    borrarConversacion,
    setBorradoresChat,
    setFotosChat,
  };
}