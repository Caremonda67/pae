// formulario de contacto, guarda el mensaje en la base de datos.
// El estudiante entra aquí con su documento + PIN: su mensaje queda
// asociado a su cuenta y en la misma página ve el historial de sus
// mensajes con las respuestas que le ha dado el admin.

import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
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

  // Carga los mensajes que el estudiante registrado ha enviado, junto
  // con la respuesta que le haya dado el admin.
  const cargarMios = async () => {
    if (sesion?.rol !== "estudiante") return;
    setCargandoMios(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/mios`, {
        headers: cabeceras(false),
      });
      if (respuesta.ok) setMios(await respuesta.json());
    } catch {
      setMios([]);
    } finally {
      setCargandoMios(false);
    }
  };

  // Si ya había sesión al abrir la página, cargamos sus mensajes
  useEffect(() => {
    cargarMios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Aquí ves el historial de los mensajes que has enviado y la respuesta
            del equipo del PAE a cada uno.
          </p>

          <div className="centrar">
            <button
              type="button"
              className="boton boton-secundario"
              onClick={cargarMios}
              disabled={cargandoMios}
            >
              {cargandoMios ? "Cargando…" : "↻ Actualizar respuestas"}
            </button>
          </div>

          {cargandoMios && <p className="estado">Cargando…</p>}

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
                    <p>{m.mensaje}</p>
                    {m.imagen && (
                      <a
                        href={m.imagen}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mensaje-imagen"
                      >
                        <img src={m.imagen} alt="Foto adjunta de tu mensaje" />
                      </a>
                    )}
                    {m.respuesta ? (
                      <div className="mensaje-respuesta">
                        <strong>Respuesta del PAE:</strong>
                        <p>{m.respuesta}</p>
                      </div>
                    ) : (
                      <p className="mensaje-pendiente">
                        ⏳ Aún no hay respuesta. Te responderemos pronto.
                      </p>
                    )}
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
