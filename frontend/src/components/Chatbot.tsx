// burbuja del chat que aparece en toda la app
// le manda lo que escribe el usuario al backend (/api/chat)
// y el backend le pregunta a Gemini, la IA de google
//
// El historial se guarda en la base (tabla chatbot_mensajes) por
// sesion del navegador: si recargas la pagina o cambias de seccion
// la conversacion sigue. Un boton permite empezar una conversacion
// nueva (deja la anterior guardada).

import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

// Tipos de mensajes del chat
interface Mensaje {
  rol: "usuario" | "bot";
  texto: string;
}

// Mensaje de bienvenida del bot
const SALUDO_BOT: Mensaje = {
  rol: "bot",
  texto:
    "¡Hola! Soy PAE Bot 🤖. Pregúntame qué hay de comer hoy, cuál es el menú de la semana o cómo reservar tu minuta.",
};

const CLAVE_SESION = "pae_chat_sesion";

// Identifica la conversacion de este navegador en la base. Si no
// hay una guardada, crea una nueva.
function obtenerSesion() {
  try {
    let sesion = localStorage.getItem(CLAVE_SESION);
    if (!sesion) {
      sesion = crypto.randomUUID();
      localStorage.setItem(CLAVE_SESION, sesion);
    }
    return sesion;
  } catch {
    return "";
  }
}

function Chatbot() {
  // abierto: muestra/oculta la ventana del chat
  const [abierto, setAbierto] = useState(false);
  // mensajes: historial del chat (cargado desde la base)
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO_BOT]);
  // cargando: recuperando el historial guardado
  const [cargando, setCargando] = useState(true);
  // texto: lo que el usuario esta escribiendo
  const [texto, setTexto] = useState("");
  // escribiendo: estado de carga mientras la IA responde
  const [escribiendo, setEscribiendo] = useState(false);
  // error: mensaje si el backend no responde
  const [error, setError] = useState("");

  // Al abrir la app recuperamos la conversacion guardada de este
  // navegador para que no se pierda al recargar la pagina.
  useEffect(() => {
    let activo = true;
    const sesion = obtenerSesion();
    if (!sesion) {
      setCargando(false);
      return;
    }
    fetch(`${API_URL}/api/chat/historial?sesion=${encodeURIComponent(sesion)}`)
      .then((r) => r.json())
      .then((lista) => {
        if (activo && Array.isArray(lista) && lista.length > 0) {
          setMensajes(lista);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Empezar una conversacion nueva: olvida la sesion anterior y
  // limpia los mensajes en pantalla.
  function nuevaConversacion() {
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {}
    setMensajes([SALUDO_BOT]);
    setError("");
  }

  // Envia el mensaje del usuario al backend
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || escribiendo) return;

    // Agregamos el mensaje del usuario al historial
    setMensajes((prev) => [...prev, { rol: "usuario", texto: contenido }]);
    setTexto("");
    setEscribiendo(true);
    setError("");

    // Enviamos las ultimas conversaciones para que el bot tenga contexto
    // y personalice sus respuestas (recuerda lo que ya se dijeron).
    const historial = mensajes
      .slice(-10)
      .filter((m) => m.texto.trim() !== "")
      .map((m) => ({ rol: m.rol, texto: m.texto }));

    try {
      const respuesta = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: contenido,
          historial,
          sesion_id: obtenerSesion(),
        }),
      });

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(datos?.error || "El chatbot no respondió");
      }

      setMensajes((prev) => [...prev, { rol: "bot", texto: datos.respuesta }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <>
      {/* Boton flotante del chat */}
      <button
        type="button"
        className="chatbot-boton"
        onClick={() => setAbierto(!abierto)}
        aria-label={abierto ? "Cerrar chatbot" : "Abrir chatbot"}
        aria-expanded={abierto}
        aria-controls="chatbot-ventana"
      >
        {abierto ? "✕" : "💬"}
      </button>

      {/* Ventana del chat */}
      {abierto && (
        <div id="chatbot-ventana" className="chatbot-ventana" role="dialog" aria-label="Chat con PAE Bot" aria-modal="true">
          <div className="chatbot-cabecera">
            <span className="chatbot-avatar" aria-hidden="true">
              🤖
            </span>
            <div>
              <strong>PAE Bot</strong>
              <span className="chatbot-estado">● En línea</span>
            </div>
            <button
              type="button"
              className="chatbot-limpiar"
              onClick={nuevaConversacion}
              title="Nueva conversación"
              aria-label="Nueva conversación"
            >
              ⟳
            </button>
          </div>

          <div className="chatbot-mensajes" aria-live="polite" aria-relevant="additions">
            {mensajes.map((mensaje, indice) => (
              <div key={indice} className={`chat-burbuja ${mensaje.rol}`}>
                {mensaje.texto}
              </div>
            ))}

            {cargando && (
              <div className="chat-burbuja bot">
                <span className="chat-puntos" aria-label="Cargando conversación">
                  ● ● ●
                </span>
              </div>
            )}

            {!cargando && escribiendo && (
              <div className="chat-burbuja bot">
                <span className="chat-puntos" aria-label="Escribiendo">
                  ● ● ●
                </span>
              </div>
            )}

            {error && <p className="chat-error" role="alert">⚠️ {error}</p>}
          </div>

          <form className="chatbot-input" onSubmit={enviar}>
            <label htmlFor="chat-mensaje" className="sr-only">
              Escribe tu pregunta
            </label>
            <input
              id="chat-mensaje"
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pregunta por el menú..."
              disabled={escribiendo}
              aria-autocomplete="none"
            />
            <button type="submit" disabled={escribiendo} aria-label="Enviar">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;