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

// Turnos para reservar. Un estudiante con turno "Ambas jornadas"
// elige aquí en cuál de las dos (Almuerzo o Refrigerio) reservar.
const TURNOS = ["Almuerzo", "Refrigerio"];

// Roles del personal del PAE: no reservan minutas, eso es solo de
// estudiantes y visitantes.
const ROLES_PERSONAL = ["admin", "cocina", "profesor", "coordinador"];

// Configuracion que devuelve el backend (/api/settings)
interface ConfigSistema {
  hora_limite_reserva: string | null;
  cupos_sede: Record<string, number>;
}

// Respuesta de /api/reservas/recordatorio
interface RecordatorioInfo {
  necesita: boolean;
  fecha: string;
  finDeSemana: boolean;
}

// Hora local en formato HH:MM (para compararla con la hora limite)
function horaLocal(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
}

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

  // Sedes disponibles: las administra el panel (tabla sedes).
  const [sedes, setSedes] = useState<string[]>([]);

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
  // true cuando el beneficiario tiene turno "Ambas jornadas": el turno
  // no se fija y se le pide elegir en cuál de las dos va a reservar.
  const [turnoDoble, setTurnoDoble] = useState(false);

  // Mis reservas
  const [docConsulta, setDocConsulta] = useState("");
  const [misReservas, setMisReservas] = useState<MisReserva[]>([]);
  const [consultaHecha, setConsultaHecha] = useState(false);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState("");

  // La reserva confirmada, para mostrar el boton de WhatsApp
  const [ultimaReserva, setUltimaReserva] = useState<MisReserva | null>(null);

  // Configuracion del sistema: hora limite para reservar/cancelar HOY
  const [config, setConfig] = useState<ConfigSistema | null>(null);
  // Reloj local HH:MM que se actualiza solo, para saber si ya paso
  // la hora limite sin tener que recargar la pagina
  const [ahoraHM, setAhoraHM] = useState(horaLocal());
  // Recordatorio: avisa si manana no hay reserva hecha
  const [recordatorio, setRecordatorio] = useState<RecordatorioInfo | null>(null);

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
      setTurnoDoble(false);
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
      setTurnoDoble(false);
      try {
        const respuesta = await fetch(
          `${API_URL}/api/beneficiarios/buscar?documento=${encodeURIComponent(doc)}`
        );
        if (respuesta.ok) {
          const datos = await respuesta.json();
          // Con turno "Ambas jornadas" el estudiante puede venir a
          // Almuerzo y a Refrigerio: no fijamos el turno, que elija.
          const ambasJornadas = datos.turno === "Ambas jornadas";
          setFormulario((f) => ({
            ...f,
            estudiante: datos.nombre,
            sede: datos.sede,
            turno: ambasJornadas ? "" : datos.turno,
          }));
          setBeneficiarioConfirmado(true);
          setTurnoDoble(ambasJornadas);
          setInfoBeneficiario(
            ambasJornadas
              ? `✅ Encontrado: ${datos.nombre}. Tu sede (${datos.sede}) está registrada y puedes venir en las dos jornadas (Almuerzo y Refrigerio). Elige en cuál reservar.`
              : `✅ Encontrado: ${datos.nombre}. Tu sede (${datos.sede}) y turno (${datos.turno}) ya están definidos.`
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

  // Carga las sedes registradas (las administra el panel admin).
  // Si no hay ninguna, el formulario muestra un aviso y no deja reservar.
  useEffect(() => {
    fetch(`${API_URL}/api/sedes`)
      .then((r) => (r.ok ? r.json() : []))
      .then((datos) => {
        const nombres = Array.isArray(datos)
          ? datos.map((s: { nombre: string }) => s.nombre).filter(Boolean)
          : [];
        setSedes(nombres);
      })
      .catch(() => setSedes([]));
  }, []);

  // Carga la configuracion del sistema (hora limite del panel admin)
  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => setConfig(datos))
      .catch(() => setConfig(null));
  }, []);

  // Mantiene la hora actualizada para compararla con la hora limite
  useEffect(() => {
    const t = window.setInterval(() => setAhoraHM(horaLocal()), 30000);
    return () => window.clearInterval(t);
  }, []);

  // Con sesion activa revisa si manana ya tiene reserva (recordatorio)
  useEffect(() => {
    if (!sesion?.usuario) {
      setRecordatorio(null);
      return;
    }
    consultarRecordatorio(sesion.usuario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.usuario]);

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
      const docUsado = formulario.documento.trim();
      if (docUsado) consultarRecordatorio(docUsado);
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

  // Pregunta al backend si el estudiante ya tiene reserva para manana.
  // Alimenta el recordatorio que se muestra en "Mis reservas".
  const consultarRecordatorio = async (documento: string) => {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/recordatorio?documento=${encodeURIComponent(documento)}`
      );
      if (!respuesta.ok) {
        setRecordatorio(null);
        return;
      }
      setRecordatorio(await respuesta.json());
    } catch {
      setRecordatorio(null);
    }
  };

  // Cuantas veces reservo y no asistio (inasistencias pasadas que el
  // profesor ya marco). Solo cuenta cuando la falta quedo confirmada.
  const inasistencias = misReservas.filter(
    (r) => r.fecha < hoyLocal() && r.asistio === false
  ).length;

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
      consultarRecordatorio(documento);
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
      if (documento) consultarRecordatorio(documento);
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

  // Hora limite configurada por el admin y si ya paso hoy. Si paso,
  // no se puede reservar ni cancelar PARA HOY (el backend lo valida
  // igual); para otros dias no hay limite.
  const limite = config?.hora_limite_reserva || "";
  const diaCerrado = Boolean(limite) && ahoraHM > limite;

  // El personal del PAE no usa la reserva: si entra con su sesion
  // (admin, cocina, profesor, coordinador) le mostramos un aviso.
  const esPersonal =
    sesionInicial && ROLES_PERSONAL.includes(sesionInicial.rol);

  if (esPersonal) {
    return (
      <section className="reserva-pagina">
        <h1>Reservar mi comida</h1>
        <p className="subtitulo">
          La reserva de minutas es para los estudiantes del programa.
        </p>
        <p className="estado">
          ℹ️ Tienes una sesión de{" "}
          {ROLES_LABEL[sesionInicial.rol] || sesionInicial.rol}. Para reservar
          como estudiante, entra con el documento y el PIN del estudiante.
          Desde el panel puedes gestionar las reservas del programa.
        </p>
      </section>
    );
  }

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
        {limite && (
          <p className={diaCerrado ? "estado error" : "estado"}>
            {diaCerrado
              ? `⏰ Hoy ya pasó la hora límite (${limite}): no puedes reservar ni cancelar para hoy, pero sí para los próximos días.`
              : `⏰ Para reservar o cancelar para HOY tienes hasta las ${limite}. Para otros días no hay límite.`}
          </p>
        )}
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
            {sedes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {beneficiarioConfirmado && (
            <small className="campo-fijo" aria-live="polite">Tu sede ya está registrada</small>
          )}
          {!beneficiarioConfirmado && sedes.length === 0 && (
            <small className="campo-fijo" role="alert">
              Aún no hay sedes disponibles. Contacta al equipo del PAE.
            </small>
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
              {turnoDoble
                ? "Puedes venir a Almuerzo y a Refrigerio. Elige el turno de esta reserva."
                : "Tu turno habitual ya se seleccionó, pero puedes cambiarlo."}
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
            min={diaCerrado ? sumarDias(hoyLocal(), 1) : hoyLocal()}
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

        <button type="submit" className="boton boton-primario" disabled={enviando || (sedes.length === 0 && !beneficiarioConfirmado)}>
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

      {/* Recordatorio: avisa si manana no hay reserva hecha */}
      {recordatorio && !recordatorio.finDeSemana && (
        <p
          className={recordatorio.necesita ? "estado error" : "estado exito"}
          role="status"
        >
          {recordatorio.necesita
            ? `🔔 Recordatorio: mañana (${fechaLegible(recordatorio.fecha)}) no tienes reserva. ¡Hazla ahora para que la cocina te prepare tu minuta!`
            : `🔔 Ya tienes reserva para mañana (${fechaLegible(recordatorio.fecha)}). ¡Nos vemos!`}
        </p>
      )}

      {/* Contador de inasistencias pasadas confirmadas */}
      {consultaHecha && !errorConsulta && inasistencias > 0 && (
        <p className={inasistencias >= 3 ? "estado error" : "estado"}>
          📊 Tienes {inasistencias}{" "}
          {inasistencias === 1 ? "inasistencia" : "inasistencias"} (reservas
          donde no asististe).{" "}
          {inasistencias >= 3
            ? "Cuando reservas y no vas, la comida se desperdicia. ¡Por favor cancela si no puedes ir!"
            : "Recuerda cancelar tus reservas si no puedes asistir, así otra persona puede aprovecharlas."}
        </p>
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
                  {!reserva.asistio && reserva.fecha < hoyLocal()
                    ? " · ✗ no asististe"
                    : ""}
                </span>
              </div>
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => cancelarReserva(reserva.id)}
                disabled={reserva.fecha === hoyLocal() && diaCerrado}
                title={
                  reserva.fecha === hoyLocal() && diaCerrado
                    ? `Ya pasó la hora límite (${limite}) para cancelar reservas de hoy`
                    : undefined
                }
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
