// formulario de contacto, guarda el mensaje en la base de datos.
// El estudiante entra aquí con su documento + PIN: su mensaje queda
// asociado a su cuenta y en la misma página ve el historial de sus
// mensajes con las respuestas que le ha dado el admin.

import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { fechaCorta } from "../config/fechas";
import {
  leerSesion,
  guardarSesion,
  cerrarSesion,
  cabeceras,
} from "../config/sesion";
import type { Sesion } from "../config/sesion";

// un mensaje que manda el estudiante y la respuesta del admin
interface MiMensaje {
  id: number;
  nombre: string;
  mensaje: string;
  imagen?: string | null;
  respuesta?: string | null;
  respuesta_at?: string | null;
  created_at: string;
}

// un mensaje del hilo de chat entre estudiante y admin
interface MensajeChat {
  id: number | string;
  remitente: "estudiante" | "admin";
  texto: string;
  imagen?: string | null;
  created_at?: string;
}

// Convierte un archivo de imagen a base64 para mandarlo en el JSON
function aBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(file);
  });
}

function Contacto() {
  // Sesión compartida (misma que la reserva). Si el estudiante ya
  // entró en la página de reserva, aquí también está dentro.
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion());

  // Login del estudiante (documento + PIN)
  const [docLogin, setDocLogin] = useState("");
  const [pinLogin, setPinLogin] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: sesion?.nombre || "",
    correo: "",
    mensaje: "",
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  // Mensajes propios y respuestas del admin (solo estudiante logueado)
  const [mios, setMios] = useState<MiMensaje[]>([]);
  const [cargandoMios, setCargandoMios] = useState(false);

  // Conversaciones (hilos) de cada mensaje + borradores para responder
  const [hilos, setHilos] = useState<Record<number, MensajeChat[]>>({});
  const [borradoresChat, setBorradoresChat] = useState<Record<number, string>>({});
  const [hiloCargando, setHiloCargando] = useState<Record<number, boolean>>({});
  const [hiloEnviando, setHiloEnviando] = useState<Record<number, boolean>>({});

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
  };

  // Entra el estudiante con documento + PIN. Usa el mismo login que la
  // reserva, así la sesión sirve en toda la aplicación.
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntrando(true);
    setErrorLogin("");
    try {
      const respuesta = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: docLogin, clave: pinLogin }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "Documento o PIN incorrectos");
      }
      if (datos.rol !== "estudiante") {
        throw new Error("Este documento no tiene cuenta de estudiante.");
      }
      const nuevaSesion: Sesion = {
        token: datos.token,
        rol: datos.rol,
        usuario: datos.usuario,
        nombre: datos.nombre,
      };
      guardarSesion(nuevaSesion);
      setSesion(nuevaSesion);
      setFormulario((f) => ({ ...f, nombre: nuevaSesion.nombre || "" }));
      setDocLogin("");
      setPinLogin("");
      cargarMios();
    } catch (err) {
      setErrorLogin(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEntrando(false);
    }
  };

  // Cierra la sesión del estudiante
  const salir = () => {
    cerrarSesion();
    setSesion(null);
    setMios([]);
    setFormulario((f) => ({ ...f, nombre: "" }));
  };

  // Carga la conversacion completa de un mensaje del estudiante
  const cargarHilo = async (id: number) => {
    setHiloCargando((c) => ({ ...c, [id]: true }));
    try {
      const respuesta = await fetch(
        `${API_URL}/api/contacto/${id}/mensajes/estudiante`,
        { headers: cabeceras(false) }
      );
      if (respuesta.ok) {
        const datos = (await respuesta.json()) as MensajeChat[];
        setHilos((h) => ({ ...h, [id]: datos }));
      }
    } catch {
      // dejamos el hilo anterior si falla
    } finally {
      setHiloCargando((c) => ({ ...c, [id]: false }));
    }
  };

  // Carga los mensajes que el estudiante registrado ha enviado, junto
  // con su conversacion con el admin.
  const cargarMios = async () => {
    if (sesion?.rol !== "estudiante") return;
    setCargandoMios(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/mios`, {
        headers: cabeceras(false),
      });
      if (respuesta.ok) {
        const lista = (await respuesta.json()) as MiMensaje[];
        setMios(lista);
        // Recargamos los hilos para ver las respuestas nuevas del
        // admin sin necesidad de recargar la pagina.
        lista.forEach((m) => cargarHilo(m.id));
      }
    } catch {
      setMios([]);
    } finally {
      setCargandoMios(false);
    }
  };

  // El estudiante responde dentro de una conversacion. Se puede
  // responder varias veces (es un chat, no solo mensaje -> respuesta).
  const enviarMensajeEstudiante = async (id: number) => {
    const texto = (borradoresChat[id] || "").trim();
    if (!texto) return;
    setHiloEnviando((e) => ({ ...e, [id]: true }));
    try {
      const respuesta = await fetch(
        `${API_URL}/api/contacto/${id}/mensajes/estudiante`,
        {
          method: "POST",
          headers: cabeceras(),
          body: JSON.stringify({ texto }),
        }
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo enviar el mensaje");
      }
      setBorradoresChat((b) => ({ ...b, [id]: "" }));
      cargarHilo(id);
      cargarMios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setHiloEnviando((e) => ({ ...e, [id]: false }));
    }
  };

  // Si ya había sesión al abrir la página, cargamos sus mensajes. Y
  // mientras el estudiante está dentro, actualizamos cada pocos
  // segundos para que las respuestas del admin aparezcan solas.
  useEffect(() => {
    if (sesion?.rol !== "estudiante") return;
    cargarMios();
    const intervalo = setInterval(cargarMios, 7000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setExito("");

    try {
      const cuerpo: Record<string, unknown> = { ...formulario };
      // Si entro como estudiante, su documento queda asociado al
      // mensaje para que el admin pueda responderle.
      if (sesion?.rol === "estudiante") {
        cuerpo.documento = sesion.usuario;
      }
      if (foto) {
        cuerpo.imagenBase64 = await aBase64(foto);
        cuerpo.imagenNombre = foto.name;
      }

      const respuesta = await fetch(`${API_URL}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });

      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo enviar el mensaje");
      }

      setExito("✅ ¡Mensaje enviado! Te responderemos pronto.");
      setFormulario({ nombre: sesion?.nombre || "", correo: "", mensaje: "" });
      setFoto(null);
      cargarMios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="contacto-pagina">
      <h1>Contáctanos</h1>
      <p className="subtitulo">
        ¿Tienes dudas sobre el programa, alergias alimentarias o sugerencias?
        Escríbenos.
      </p>

      {/* Entrada del estudiante: con documento + PIN puede recibir las
          respuestas del admin y ver el historial de sus mensajes */}
      <hr className="separador" />
      <h2>Estudiante: entra y recibe las respuestas</h2>
      <p className="subtitulo">
        Entra con tu documento y PIN para que tu mensaje quede asociado a tu
        cuenta y aquí veas las respuestas del equipo del PAE.
      </p>

      {sesion?.rol === "estudiante" ? (
        <div className="sesion-estudiante" aria-live="polite">
          <p>
            ✅ Estás como {sesion.nombre || sesion.usuario}. Ya puedes enviar tu
            mensaje (el formulario de abajo) y ver tus respuestas en la sección
            "Mis mensajes y respuestas".
          </p>
          <button type="button" className="boton boton-secundario" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        <form className="formulario" onSubmit={entrar} aria-label="Entrar como estudiante">
          <div className="formulario-fila">
            <label htmlFor="doc-contacto">
              Identificación
              <input
                id="doc-contacto"
                type="text"
                value={docLogin}
                onChange={(e) => setDocLogin(e.target.value)}
                required
                placeholder="Tu número de documento"
                autoComplete="username"
              />
            </label>
            <label htmlFor="pin-contacto">
              PIN
              <input
                id="pin-contacto"
                type="password"
                value={pinLogin}
                onChange={(e) => setPinLogin(e.target.value)}
                required
                minLength={4}
                placeholder="Tu PIN (te lo da el equipo del PAE)"
                autoComplete="current-password"
              />
            </label>
          </div>
          {errorLogin && <p className="estado error" role="alert">⚠️ {errorLogin}</p>}
          <button type="submit" className="boton boton-secundario" disabled={entrando}>
            {entrando ? "Verificando…" : "Entrar"}
          </button>
        </form>
      )}

      <form className="formulario" onSubmit={enviar}>
        <label>
          Nombre
          <input
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={cambiar}
            required
            placeholder="Tu nombre"
          />
        </label>

        <label>
          Correo electrónico
          <input
            type="email"
            name="correo"
            value={formulario.correo}
            onChange={cambiar}
            required
            placeholder="tu@correo.com"
          />
        </label>

        <label>
          Mensaje
          <textarea
            name="mensaje"
            value={formulario.mensaje}
            onChange={cambiar}
            required
            rows={5}
            placeholder="Escribe tu mensaje…"
          />
        </label>

        <label>
          Foto (opcional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
          {foto && <small className="campo-fijo">✅ Foto lista para enviar.</small>}
        </label>

        {error && <p className="estado error" role="alert">⚠️ {error}</p>}
        {exito && <p className="estado exito" aria-live="polite">{exito}</p>}

        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar mensaje"}
        </button>
      </form>

      {sesion?.rol === "estudiante" && (
        <>
          <hr className="separador" />
          <h2>Mis mensajes y respuestas</h2>
          <p className="subtitulo">
            Conversa con el equipo del PAE: escribes un mensaje, el equipo te
            responde y aquí sigue la conversación. Se actualiza sola, no hace
            falta recargar la página.
          </p>

          <div className="centrar">
            <button
              type="button"
              className="boton boton-secundario"
              onClick={cargarMios}
              disabled={cargandoMios}
            >
              {cargandoMios ? "Cargando…" : "↻ Actualizar"}
            </button>
          </div>

          {cargandoMios && mios.length === 0 && <p className="estado">Cargando…</p>}

          {!cargandoMios && mios.length === 0 && (
            <p className="estado">
              Aún no has enviado mensajes con tu cuenta de estudiante.
            </p>
          )}

          {mios.length > 0 && (
            <div className="lista-mensajes">
              {mios.map((m) => (
                <article key={m.id} className="fila-mensaje">
                  <div>
                    <strong>{m.nombre}</strong>
                    <span className="fila-reserva-detalle">
                      {m.created_at ? m.created_at.slice(0, 10) : ""}
                    </span>
                  </div>

                  <div className="chat-burbujas">
                    {hiloCargando[m.id] && !hilos[m.id] && (
                      <p className="estado">Cargando conversación…</p>
                    )}
                    {(hilos[m.id] || []).map((msj) => (
                      <div
                        key={msj.id}
                        className={`chat-burbuja ${msj.remitente === "estudiante" ? "estudiante" : "admin"}`}
                      >
                        <p>{msj.texto}</p>
                        {msj.imagen && (
                          <a
                            href={msj.imagen}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img src={msj.imagen} alt="Foto adjunta" />
                          </a>
                        )}
                        {msj.created_at && <small>{fechaCorta(msj.created_at)}</small>}
                      </div>
                    ))}
                    {hilos[m.id] && hilos[m.id].length === 1 && (
                      <p className="estado">
                        ⏳ Aún no hay respuesta. Te responderemos pronto.
                      </p>
                    )}
                  </div>

                  <div className="chat-responder">
                    <input
                      value={borradoresChat[m.id] || ""}
                      onChange={(e) =>
                        setBorradoresChat((b) => ({ ...b, [m.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          enviarMensajeEstudiante(m.id);
                        }
                      }}
                      placeholder="Escribe tu respuesta y presiona Enter…"
                      aria-label={`Responder a la conversación del ${m.created_at ? m.created_at.slice(0, 10) : "PAE"}`}
                    />
                    <button
                      type="button"
                      className="boton boton-primario"
                      onClick={() => enviarMensajeEstudiante(m.id)}
                      disabled={
                        !(borradoresChat[m.id] || "").trim() || hiloEnviando[m.id]
                      }
                    >
                      {hiloEnviando[m.id] ? "Enviando…" : "Enviar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Contacto;
