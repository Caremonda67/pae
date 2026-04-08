// burbuja del chat que aparece en toda la app
// le manda lo que escribe el usuario al backend (/api/chat)
// y el backend le pregunta a Gemini, la IA de google

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

function Chatbot() {
  // abierto: muestra/oculta la ventana del chat
  const [abierto, setAbierto] = useState(false);
  // mensajes: historial del chat
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO_BOT]);
  // texto: lo que el usuario esta escribiendo
  const [texto, setTexto] = useState("");
  // escribiendo: estado de carga mientras la IA responde
  const [escribiendo, setEscribiendo] = useState(false);
  // error: mensaje si el backend no responde
  const [error, setError] = useState("");

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

    try {
      const respuesta = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: contenido }),
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
        aria-label="Abrir chatbot"
      >
        {abierto ? "✕" : "💬"}
      </button>

      {/* Ventana del chat */}
      {abierto && (
        <div className="chatbot-ventana">
          <div className="chatbot-cabecera">
            <span className="chatbot-avatar" aria-hidden="true">
              🤖
            </span>
            <div>
              <strong>PAE Bot</strong>
              <span className="chatbot-estado">● En línea</span>
            </div>
          </div>

          <div className="chatbot-mensajes">
            {mensajes.map((mensaje, indice) => (
              <div key={indice} className={`chat-burbuja ${mensaje.rol}`}>
                {mensaje.texto}
              </div>
            ))}

            {escribiendo && (
              <div className="chat-burbuja bot">
                <span className="chat-puntos">● ● ●</span>
              </div>
            )}

            {error && <p className="chat-error">⚠️ {error}</p>}
          </div>

          <form className="chatbot-input" onSubmit={enviar}>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pregunta por el menú..."
              disabled={escribiendo}
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
