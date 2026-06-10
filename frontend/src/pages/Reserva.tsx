// pagina donde el estudiante confirma que va a comer
// asi la cocina sabe cuantas minutas preparar y no sobra comida
//
// incluye:
// - autocompletado: al escribir el documento se busca al
//   estudiante en el registro de beneficiarios y se rellena el nombre
// - confirmacion por WhatsApp: tras reservar, un boton abre
//   wa.me con el mensaje de confirmacion listo para enviar
// - "Mis reservas": consulta y cancelacion de las reservas propias

import { useEffect, useRef, useState } from "react";
import { fechaLegible, hoyLocal, sumarDias, validarFecha } from "../config/fechas";
import { API_URL } from "../config/api";
import {
  leerSesion,
  guardarSesion,
  cerrarSesion,
  ROLES_LABEL,
} from "../config/sesion";

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
  // Sesión del estudiante (entra con documento + PIN). Si hay sesión,
  // el documento se autocompleta y no hay que volver a escribirlo.
  const sesionInicial = leerSesion();
  const [sesion, setSesion] = useState(sesionInicial);

  // Formulario de login del estudiante
  const [docLogin, setDocLogin] = useState(sesionInicial?.usuario || "");
  const [pinLogin, setPinLogin] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  // Estado del formulario
  const [formulario, setFormulario] = useState({
    estudiante: "",
    documento: sesionInicial?.usuario || "",
    correo: "",
    sede: "",
    turno: "",
    fecha: "",
  });

  // Estados de la respuesta del servidor
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  // Autocompletado: al escribir el documento se busca el nombre,
  // la sede y el turno que ya tiene registrado el estudiante
  const [buscandoBeneficiario, setBuscandoBeneficiario] = useState(false);
  const [infoBeneficiario, setInfoBeneficiario] = useState("");
  // true cuando el documento es de un beneficiario registrado:
  // la sede y el turno quedan fijos (no se le preguntan)
  const [beneficiarioConfirmado, setBeneficiarioConfirmado] = useState(false);

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

  // Entra el estudiante con documento + PIN
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
      const nuevaSesion = {
        token: datos.token,
        rol: datos.rol,
        usuario: datos.usuario,
        nombre: datos.nombre,
      };
      guardarSesion(nuevaSesion);
      setSesion(nuevaSesion);
      setFormulario((f) => ({ ...f, documento: datos.usuario }));
      setDocConsulta(datos.usuario);
      setPinLogin("");
      // Al entrar, rellenamos tambien nombre, sede y turno buscando al
      // beneficiario (igual que cuando se escribe el documento a mano).
      buscarBeneficiario(datos.usuario);
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
    setDocLogin("");
    setFormulario((f) => ({ ...f, documento: "" }));
    setDocConsulta("");
    setMisReservas([]);
    setConsultaHecha(false);
  };

  // Cuando el documento cambia, buscamos al beneficiario y
  // rellenamos automaticamente el nombre, la sede y el turno.
  // Con debounce (350 ms) para no pegarle al servidor en cada tecla.
  const debounceRef = useRef<number | null>(null);

  const buscarBeneficiario = (documento: string) => {
    // Limpiamos el temporizador anterior (debounce)
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    if (!documento || documento.trim().length < 3) {
      // Si se borra el documento, limpiamos los datos que se
      // habian autocompletado del beneficiario anterior
      setInfoBeneficiario("");
      setBeneficiarioConfirmado(false);
      setFormulario((f) => ({
        ...f,
        estudiante: "",
        sede: "",
        turno: "",
      }));
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      const doc = documento.trim();
      if (!doc || doc.length < 3) return;

      setBuscandoBeneficiario(true);
      setInfoBeneficiario("");
      setBeneficiarioConfirmado(false);
      try {
        const respuesta = await fetch(
          `${API_URL}/api/beneficiarios/buscar?documento=${encodeURIComponent(doc)}`
        );
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setFormulario((f) => ({
            ...f,
            estudiante: datos.nombre,
            sede: datos.sede,
            turno: datos.turno,
          }));
          setBeneficiarioConfirmado(true);
          setInfoBeneficiario(
            `✅ Encontrado: ${datos.nombre}. Tu sede (${datos.sede}) y turno (${datos.turno}) ya están definidos.`
          );
        } else {
          setInfoBeneficiario("ℹ️ Documento no registrado. Verifica con el equipo del PAE.");
        }
      } catch {
        setInfoBeneficiario("ℹ️ No se pudo verificar el documento ahora.");
      } finally {
        setBuscandoBeneficiario(false);
      }
    }, 350);
  };

  // Si el componente se desmonta, cancelamos la busqueda pendiente
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Si ya hay sesion al abrir la pagina (por ejemplo al recargar),
  // se rellena la informacion del beneficiario (nombre, sede, turno)
  // ademas del documento, que ya viene precargado.
  useEffect(() => {
    if (sesionInicial?.usuario) {
      buscarBeneficiario(sesionInicial.usuario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Envia la reserva al backend
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setExito("");
    setUltimaReserva(null);

    // Validamos la fecha antes de mandarla: evita fechas con año
    // con demasiados digitos o fechas imposibles que darian error luego
    const errorFecha = validarFecha(formulario.fecha);
    if (errorFecha) {
      setError(errorFecha);
      setEnviando(false);
      return;
    }

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
      setBeneficiarioConfirmado(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  };

  // Consulta las reservas propias por documento
  const consultarMisReservas = async (e: React.FormEvent) => {
    e.preventDefault();
    const documento = (sesion?.usuario || docConsulta).trim();
    setCargandoConsulta(true);
    setErrorConsulta("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/mis?documento=${encodeURIComponent(documento)}`
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
    const documento = (sesion?.usuario || docConsulta).trim();
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/mis/${id}?documento=${encodeURIComponent(documento)}`,
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
      `¡Hola! 👋 Soy ${ultimaReserva.estudiante} (Doc. ${ultimaReserva.documento}) ` +
      `y quiero confirmar mi minuta del PAE.\n\n` +
      `🍽️ Fecha: ${fechaLegible(ultimaReserva.fecha)}\n` +
      `🍽️ Turno: ${ultimaReserva.turno}\n` +
      `🏫 Sede: ${ultimaReserva.sede}\n\n` +
      `¡Allí estaré para que no se desperdicie comida! 🙌`;
    return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <section className="reserva-pagina">
      <h1>Reservar mi comida</h1>
      <p className="subtitulo">
        Confirma que recibirás alimentación para que se preparen solo las
        minutas necesarias y no se desperdicie comida.
      </p>

      {sesion?.rol === "estudiante" ? (
        <div className="sesion-estudiante" aria-live="polite">
          <p>
            ✅ Estás como {sesion.nombre || sesion.usuario} ({ROLES_LABEL.estudiante}).
            Tu documento ya está cargado, solo elige fecha y turno.
          </p>
          <button type="button" className="boton boton-secundario" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        <form className="formulario" onSubmit={entrar} aria-label="Entrar como estudiante">
          <h2 className="admin-subtitulo">Entrar con documento y PIN</h2>
          <div className="formulario-fila">
            <label htmlFor="doc-login">
              Número de documento
              <input
                id="doc-login"
                type="text"
                value={docLogin}
                onChange={(e) => setDocLogin(e.target.value)}
                required
                placeholder="Tu documento"
                autoComplete="username"
              />
            </label>
            <label htmlFor="pin-login">
              PIN
              <input
                id="pin-login"
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
          <p className="subtitulo">
            También puedes reservar sin entrar, escribiendo tu documento abajo.
          </p>
        </form>
      )}

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
            disabled={Boolean(sesion)}
            placeholder="Escribe tu documento"
          />
          {sesion && (
            <small className="campo-fijo">Documento de tu sesión</small>
          )}
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
          <select
            name="sede"
            value={formulario.sede}
            onChange={cambiar}
            required
            disabled={beneficiarioConfirmado}
          >
            <option value="">
              {beneficiarioConfirmado
                ? "Definida por el registro"
                : "Selecciona tu sede"}
            </option>
            {SEDES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {beneficiarioConfirmado && (
            <small className="campo-fijo" aria-live="polite">Tu sede ya está registrada</small>
          )}
        </label>

        <label>
          Turno
          <select
            name="turno"
            value={formulario.turno}
            onChange={cambiar}
            required
          >
            <option value="">
              {beneficiarioConfirmado
                ? "Tu turno (puedes cambiarlo)"
                : "Selecciona el turno"}
            </option>
            {TURNOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {beneficiarioConfirmado && (
            <small className="campo-fijo">
              Tu turno habitual ya se seleccionó, pero puedes cambiarlo.
            </small>
          )}
        </label>

        <label>
          Fecha
          <input
            type="date"
            name="fecha"
            value={formulario.fecha}
            onChange={cambiar}
            required
            min={hoyLocal()}
            max={sumarDias(hoyLocal(), 60)}
          />
          <small className="campo-fijo">
            El servicio funciona de lunes a viernes.
          </small>
        </label>

        {error && <p className="estado error">⚠️ {error}</p>}
        {exito && <p className="estado exito">{exito}</p>}

        {/* Boton de WhatsApp para compartir la confirmacion */}
        {ultimaReserva && (
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-whatsapp"
            aria-label="Abrir WhatsApp para compartir la confirmación de la reserva"
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
        Consulta y cancela tus reservas {sesion ? "de tu sesión" : "escribiendo tu documento"}.
      </p>

      <form className="formulario" onSubmit={consultarMisReservas}>
        <label>
          Tu número de documento
          <input
            type="text"
            value={sesion?.usuario || docConsulta}
            onChange={(e) => {
              if (!sesion) setDocConsulta(e.target.value);
            }}
            required
            disabled={Boolean(sesion)}
            placeholder="Escribe tu documento"
          />
          {sesion && (
            <small className="campo-fijo">Documento de tu sesión</small>
          )}
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
