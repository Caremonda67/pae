// pagina donde el estudiante confirma que va a comer
// asi la cocina sabe cuantas minutas preparar y no sobra comida
//
// incluye:
// - autocompletado: al escribir el documento se busca al
//   estudiante en el registro de beneficiarios y se rellena el nombre
// - confirmacion por WhatsApp: tras reservar, un boton abre
//   wa.me con el mensaje de confirmacion listo para enviar
// - "Mis reservas": consulta y cancelacion de las reservas propias

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Turnos y sedes disponibles (se pueden ampliar luego desde el admin)
const TURNOS = ["Almuerzo", "Refrigerio"];
const SEDES = ["Sede A", "Sede B", "Sede C"];

interface MisReserva {
  id: number;
  estudiante: string;
  documento: string;
  sede: string;
  turno: string;
  fecha: string;
  asistio: boolean;
}

function Reserva() {
  // Estado del formulario
  const [formulario, setFormulario] = useState({
    estudiante: "",
    documento: "",
    correo: "",
    sede: "",
    turno: "",
    fecha: "",
  });

  // Estados de la respuesta del servidor
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  // Autocompletado: al escribir el documento se busca el nombre
  const [buscandoBeneficiario, setBuscandoBeneficiario] = useState(false);
  const [infoBeneficiario, setInfoBeneficiario] = useState("");

  // Mis reservas
  const [docConsulta, setDocConsulta] = useState("");
  const [misReservas, setMisReservas] = useState<MisReserva[]>([]);
  const [consultaHecha, setConsultaHecha] = useState(false);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState("");

  // La reserva confirmada, para mostrar el boton de WhatsApp
  const [ultimaReserva, setUltimaReserva] = useState<MisReserva | null>(null);

  // Actualiza un campo del formulario
  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
  };

  // Cuando el documento cambia, buscamos al beneficiario y
  // rellenamos el nombre automaticamente (autocompletado)
  const buscarBeneficiario = async (documento: string) => {
    if (!documento || documento.trim().length < 3) {
      setInfoBeneficiario("");
      return;
    }

    setBuscandoBeneficiario(true);
    setInfoBeneficiario("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/beneficiarios/buscar?documento=${encodeURIComponent(documento.trim())}`
      );
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setFormulario((f) => ({ ...f, estudiante: datos.nombre }));
        setInfoBeneficiario(
          `✅ Encontrado: ${datos.nombre} (${datos.sede}, ${datos.turno})`
        );
      } else {
        setInfoBeneficiario("ℹ️ Documento no registrado. Verifica con el equipo del PAE.");
      }
    } catch {
      setInfoBeneficiario("ℹ️ No se pudo verificar el documento ahora.");
    } finally {
      setBuscandoBeneficiario(false);
    }
  };

  // Envia la reserva al backend
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setExito("");
    setUltimaReserva(null);

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

      const guardada = await respuesta.json();
      setUltimaReserva(guardada);
      setExito(
        "✅ ¡Reserva confirmada! La cocina preparará tu minuta. Recuerda asistir para evitar desperdicio."
      );
      // Limpiamos el formulario despues de reservar
      setFormulario({ estudiante: "", documento: "", correo: "", sede: "", turno: "", fecha: "" });
      setInfoBeneficiario("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  };

  // Consulta las reservas propias por documento
  const consultarMisReservas = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoConsulta(true);
    setErrorConsulta("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/mis?documento=${encodeURIComponent(docConsulta.trim())}`
      );
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudieron cargar tus reservas");
      }
      setMisReservas(await respuesta.json());
      setConsultaHecha(true);
    } catch (err) {
      setErrorConsulta(err instanceof Error ? err.message : "Error desconocido");
      setConsultaHecha(true);
      setMisReservas([]);
    } finally {
      setCargandoConsulta(false);
    }
  };

  // Cancela una reserva propia
  const cancelarReserva = async (id: number) => {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/mis/${id}?documento=${encodeURIComponent(docConsulta.trim())}`,
        { method: "DELETE" }
      );
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo cancelar");
      }
      setMisReservas((lista) => lista.filter((r) => r.id !== id));
    } catch (err) {
      setErrorConsulta(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Link de WhatsApp con la confirmacion lista para enviar
  const whatsappLink = () => {
    if (!ultimaReserva) return "";
    const mensaje =
      `Hola, soy ${ultimaReserva.estudiante} (Doc. ${ultimaReserva.documento}). ` +
      `Confirmo mi minuta para el ${ultimaReserva.fecha} (${ultimaReserva.turno} en ${ultimaReserva.sede}). ¡Gracias!`;
    return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
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
          Número de documento
          <input
            type="text"
            name="documento"
            value={formulario.documento}
            onChange={(e) => {
              const valor = e.target.value;
              setFormulario({ ...formulario, documento: valor });
              buscarBeneficiario(valor);
            }}
            required
            placeholder="Escribe tu documento"
          />
        </label>
        {buscandoBeneficiario && <p className="estado">Buscando…</p>}
        {infoBeneficiario && (
          <p className="estado">{infoBeneficiario}</p>
        )}

        <label>
          Nombre completo (se llena solo con el documento)
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
          Correo (opcional, para recibir confirmación)
          <input
            type="email"
            name="correo"
            value={formulario.correo}
            onChange={cambiar}
            placeholder="Ej: correo@ejemplo.com"
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

        {/* Boton de WhatsApp para compartir la confirmacion */}
        {ultimaReserva && (
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
            className="boton boton-whatsapp"
          >
            💬 Compartir confirmación por WhatsApp
          </a>
        )}

        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? "Guardando…" : "Confirmar reserva"}
        </button>
      </form>

      {/* Seccion Mis reservas */}
      <hr className="separador" />
      <h2>Mis reservas</h2>
      <p className="subtitulo">
        Consulta y cancela tus reservas escribiendo tu documento.
      </p>

      <form className="formulario" onSubmit={consultarMisReservas}>
        <label>
          Tu número de documento
          <input
            type="text"
            value={docConsulta}
            onChange={(e) => setDocConsulta(e.target.value)}
            required
            placeholder="Escribe tu documento"
          />
        </label>
        <button type="submit" className="boton boton-primario" disabled={cargandoConsulta}>
          {cargandoConsulta ? "Consultando…" : "Consultar mis reservas"}
        </button>
      </form>

      {errorConsulta && <p className="estado error">⚠️ {errorConsulta}</p>}

      {consultaHecha && !errorConsulta && misReservas.length === 0 && (
        <p className="estado">No tienes reservas registradas con ese documento.</p>
      )}

      {misReservas.length > 0 && (
        <div className="lista-reservas">
          {misReservas.map((reserva) => (
            <article key={reserva.id} className="fila-reserva">
              <div>
                <strong>{reserva.fecha}</strong>
                <span className="fila-reserva-detalle">
                  {reserva.turno} · {reserva.sede}
                  {reserva.asistio ? " · ✓ ya asististe" : ""}
                </span>
              </div>
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => cancelarReserva(reserva.id)}
              >
                Cancelar
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Reserva;
