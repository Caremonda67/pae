import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import { fechaCorta } from "../../config/fechas";
import type { Mensaje, MensajeChat } from "./types";

interface Props {
  mensajes: Mensaje[];
  hilos: Record<number, MensajeChat[]>;
  hiloAbierto: Record<number, boolean>;
  hiloCargando: Record<number, boolean>;
  hiloEnviando: Record<number, boolean>;
  borradoresChat: Record<number, string>;
  fotosChat: Record<number, File | null>;
  borrandoHilo: Record<number, boolean>;
  alternarLeido: (m: Mensaje) => Promise<void>;
  abrirHilo: (id: number) => void;
  enviarMensajeAdmin: (id: number) => Promise<void>;
  borrarConversacion: (id: number) => Promise<void>;
  setBorradoresChat: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setFotosChat: React.Dispatch<React.SetStateAction<Record<number, File | null>>>;
}

export default function TabMensajes({
  mensajes, hilos, hiloAbierto, hiloCargando, hiloEnviando,
  borradoresChat, fotosChat, borrandoHilo, alternarLeido,
  abrirHilo, enviarMensajeAdmin, borrarConversacion,
  setBorradoresChat, setFotosChat,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div id="panel-mensajes" role="tabpanel" aria-labelledby="tab-mensajes">
      <h2 className="admin-subtitulo">Mensajes de contacto</h2>
      {mensajes.length === 0 && <p className="estado">Aún no hay mensajes de contacto.</p>}
      <Buscador valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar por nombre, correo o mensaje…" />
      <div className="lista-mensajes">
        {mensajes
          .filter((mensaje) => { if (!busqueda.trim()) return true; return coincide(`${mensaje.nombre} ${mensaje.correo} ${mensaje.mensaje}`, busqueda); })
          .map((mensaje) => (
          <article key={mensaje.id} className={`fila-mensaje${mensaje.leido ? "" : " no-leido"}`}>
            <div>
              <strong>{mensaje.nombre}</strong>
              {!mensaje.leido && <span className="badge-sin-leer">Nuevo</span>}
              <span className="fila-reserva-detalle">{mensaje.correo}{mensaje.documento ? ` · Estudiante Doc. ${mensaje.documento}` : ""}</span>
              <p>{mensaje.mensaje}</p>
              {mensaje.imagen && (<a href={mensaje.imagen} target="_blank" rel="noopener noreferrer" className="mensaje-imagen"><img src={mensaje.imagen} alt="Foto adjunta del mensaje" /></a>)}
            </div>
            <div className="formulario-fila">
              <button type="button" className="boton boton-secundario" onClick={() => alternarLeido(mensaje)} aria-label={`${mensaje.leido ? "Marcar como no leído" : "Marcar como leído"} el mensaje de ${mensaje.nombre}`}>{mensaje.leido ? "Marcar no leído" : "✓ Marcar leído"}</button>
              <button type="button" className="boton boton-secundario" onClick={() => abrirHilo(mensaje.id)} aria-expanded={hiloAbierto[mensaje.id] || false}>{hiloAbierto[mensaje.id] ? "Ocultar conversación" : "Ver conversación"}</button>
              <button type="button" className="boton boton-peligro" onClick={() => borrarConversacion(mensaje.id)} disabled={borrandoHilo[mensaje.id] || false}>{borrandoHilo[mensaje.id] ? "Borrando…" : "🗑 Borrar"}</button>
            </div>

            {hiloAbierto[mensaje.id] && (
              <>
                <div className="chat-burbujas">
                  {hiloCargando[mensaje.id] && !hilos[mensaje.id] && <p className="estado">Cargando conversación…</p>}
                  {(hilos[mensaje.id] || []).map((msj) => (
                    <div key={msj.id} className={`chat-burbuja ${msj.remitente === "estudiante" ? "estudiante" : "admin"}`}>
                      <p>{msj.texto}</p>
                      {msj.imagen && (<a href={msj.imagen} target="_blank" rel="noopener noreferrer"><img src={msj.imagen} alt="Foto adjunta" /></a>)}
                      {msj.created_at && <small>{fechaCorta(msj.created_at)}</small>}
                    </div>
                  ))}
                  {hilos[mensaje.id] && hilos[mensaje.id].length === 1 && <p className="estado">Aún no has respondido a este mensaje.</p>}
                </div>
                <div className="chat-responder">
                  <input value={borradoresChat[mensaje.id] || ""} onChange={(e) => setBorradoresChat((b) => ({ ...b, [mensaje.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviarMensajeAdmin(mensaje.id); } }} placeholder="Escribe tu respuesta y presiona Enter…" aria-label={`Responder al mensaje de ${mensaje.nombre}`} />
                  <label className="chat-foto" title="Adjuntar foto">📎<input type="file" accept="image/*" hidden onChange={(e) => setFotosChat((f) => ({ ...f, [mensaje.id]: e.target.files?.[0] || null }))} aria-label="Adjuntar foto a la respuesta" /></label>
                  <button type="button" className="boton boton-primario" onClick={() => enviarMensajeAdmin(mensaje.id)} disabled={(!(borradoresChat[mensaje.id] || "").trim() && !fotosChat[mensaje.id]) || hiloEnviando[mensaje.id]}>{hiloEnviando[mensaje.id] ? "Enviando…" : "Enviar"}</button>
                </div>
                {fotosChat[mensaje.id] && (
                  <div className="chat-vista-previa">
                    <img src={URL.createObjectURL(fotosChat[mensaje.id]!)} alt="Vista previa de la foto" />
                    <span>{fotosChat[mensaje.id]!.name}</span>
                    <button type="button" onClick={() => setFotosChat((f) => ({ ...f, [mensaje.id]: null }))} aria-label="Quitar la foto adjunta">✕</button>
                  </div>
                )}
              </>
            )}
            <span className="mensaje-fecha">{mensaje.created_at ? mensaje.created_at.slice(0, 10) : ""}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
