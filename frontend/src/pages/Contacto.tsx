// formulario de contacto, guarda el mensaje en la base de datos

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function Contacto() {
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    mensaje: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  const cambiar = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setExito("");

    try {
      const respuesta = await fetch(`${API_URL}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });

      if (!respuesta.ok) throw new Error("No se pudo enviar el mensaje");

      setExito("✅ ¡Mensaje enviado! Te responderemos pronto.");
      setFormulario({ nombre: "", correo: "", mensaje: "" });
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

        {error && <p className="estado error" role="alert">⚠️ {error}</p>}
        {exito && <p className="estado exito" aria-live="polite">{exito}</p>}

        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar mensaje"}
        </button>
      </form>
    </section>
  );
}

export default Contacto;
