// pagina donde el estudiante confirma que va a comer
// asi la cocina sabe cuantas minutas preparar y no sobra comida

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Turnos y sedes disponibles (se pueden ampliar luego desde el admin)
const TURNOS = ["Almuerzo", "Refrigerio"];
const SEDES = ["Sede A", "Sede B", "Sede C"];

function Reserva() {
  // Estado del formulario
  const [formulario, setFormulario] = useState({
    estudiante: "",
    documento: "",
    sede: "",
    turno: "",
    fecha: "",
  });

  // Estados de la respuesta del servidor
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  // Actualiza un campo del formulario
  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
  };

  // Envia la reserva al backend
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setExito("");

    try {
      const respuesta = await fetch(`${API_URL}/api/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar la reserva");
      }

      setExito(
        "✅ ¡Reserva confirmada! La cocina preparará tu minuta. Recuerda asistir para evitar desperdicio."
      );
      // Limpiamos el formulario despues de reservar
      setFormulario({ estudiante: "", documento: "", sede: "", turno: "", fecha: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="reserva-pagina">
      <h1>Reservar mi comida</h1>
      <p className="subtitulo">
        Confirma que recibirás alimentación para que se preparen solo las
        minutas necesarias y no se desperdicie comida.
      </p>

      <form className="formulario" onSubmit={enviar}>
        <label>
          Nombre completo
          <input
            type="text"
            name="estudiante"
            value={formulario.estudiante}
            onChange={cambiar}
            required
            placeholder="Ej: Ana María Pérez"
          />
        </label>

        <label>
          Número de documento
          <input
            type="text"
            name="documento"
            value={formulario.documento}
            onChange={cambiar}
            required
            placeholder="Ej: 1012345678"
          />
        </label>

        <label>
          Sede
          <select name="sede" value={formulario.sede} onChange={cambiar} required>
            <option value="">Selecciona tu sede</option>
            {SEDES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Turno
          <select name="turno" value={formulario.turno} onChange={cambiar} required>
            <option value="">Selecciona el turno</option>
            {TURNOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          Fecha
          <input
            type="date"
            name="fecha"
            value={formulario.fecha}
            onChange={cambiar}
            required
          />
        </label>

        {error && <p className="estado error">⚠️ {error}</p>}
        {exito && <p className="estado exito">{exito}</p>}

        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? "Guardando…" : "Confirmar reserva"}
        </button>
      </form>
    </section>
  );
}

export default Reserva;
