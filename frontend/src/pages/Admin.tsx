// panel de administrador
// ahora el login es REAL: la clave se manda al backend, este la
// compara con ADMIN_CLAVE y devuelve un token que el panel guarda
// para llamar a las rutas protegidas. Ya no hay clave escrita en
// el codigo del navegador.
//
// Pestañas:
// - panel de cocina: minutas por fecha, asistencia y desperdicio
// - beneficiarios: registro de los estudiantes del programa
// - avisos: publicar y borrar noticias
// - notificaciones: confirmaciones de reserva enviadas
// - mensajes: los que llegan por el formulario de contacto

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// token guardado entre sesiones (el navegador lo conserva)
const TOKEN_KEY = "pae_admin_token";

function leerToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

// cabeceras con el token del admin para rutas protegidas
function cabeceras(token: string, cuerpo = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (cuerpo) headers["Content-Type"] = "application/json";
  return headers;
}

// una reserva que llega del backend
interface Reserva {
  id: number;
  estudiante: string;
  documento: string;
  sede: string;
  turno: string;
  fecha: string;
  asistio: boolean;
}

interface TotalFecha {
  reservas: number;
  asistieron: number;
}

interface Reporte {
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
  porSede: Record<string, { reservas: number; asistieron: number }>;
  porTurno: Record<string, { reservas: number; asistieron: number }>;
}

interface Aviso {
  id: number;
  titulo: string;
  texto: string;
  fecha?: string;
}

interface Mensaje {
  id: number;
  nombre: string;
  correo: string;
  mensaje: string;
  created_at: string;
}

interface Beneficiario {
  id: number;
  documento: string;
  nombre: string;
  sede: string;
  turno: string;
  grado?: string;
}

interface Notificacion {
  id: number;
  tipo: string;
  destinatario: string;
  mensaje: string;
  enviado: boolean;
  created_at: string;
}

// pestañas del panel
type Pestana = "panel" | "beneficiarios" | "avisos" | "notificaciones" | "mensajes";

function Admin() {
  const [autenticado, setAutenticado] = useState(leerToken() !== "");
  const [clave, setClave] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [pestana, setPestana] = useState<Pestana>("panel");

  const [totales, setTotales] = useState<Record<string, TotalFecha>>({});
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // formulario de nuevo aviso
  const [tituloAviso, setTituloAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");
  const [fechaAviso, setFechaAviso] = useState("");
  const [avisoError, setAvisoError] = useState("");
  const [avisoExito, setAvisoExito] = useState("");

  // formulario de nuevo beneficiario
  const [docBen, setDocBen] = useState("");
  const [nombreBen, setNombreBen] = useState("");
  const [sedeBen, setSedeBen] = useState("Sede A");
  const [turnoBen, setTurnoBen] = useState("Almuerzo");
  const [gradoBen, setGradoBen] = useState("");
  const [benError, setBenError] = useState("");
  const [benExito, setBenExito] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Pide el token al backend comparando la clave con ADMIN_CLAVE
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoLogin(true);
    setErrorLogin("");
    try {
      const respuesta = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "Clave incorrecta");
      }
      localStorage.setItem(TOKEN_KEY, datos.token);
      setAutenticado(true);
      cargarDatos();
    } catch (err) {
      setErrorLogin(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargandoLogin(false);
    }
  };

  // Cierra sesion (borra el token guardado)
  const salir = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAutenticado(false);
    setClave("");
  };

  // Carga todo: totales, reservas, reporte, avisos, mensajes,
  // beneficiarios y notificaciones (las protegidas usan el token)
  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    const token = leerToken();
    try {
      const [
        respTotales,
        respReservas,
        respReporte,
        respAvisos,
        respMensajes,
        respBeneficiarios,
        respNotificaciones,
      ] = await Promise.all([
        fetch(`${API_URL}/api/reservas/totales`),
        fetch(`${API_URL}/api/reservas`, { headers: cabeceras(token, false) }),
        fetch(`${API_URL}/api/reservas/reporte`),
        fetch(`${API_URL}/api/avisos`),
        fetch(`${API_URL}/api/contacto`, { headers: cabeceras(token, false) }),
        fetch(`${API_URL}/api/beneficiarios`),
        fetch(`${API_URL}/api/notificaciones`, { headers: cabeceras(token, false) }),
      ]);

      if (
        !respTotales.ok ||
        !respReservas.ok ||
        !respReporte.ok ||
        !respAvisos.ok ||
        !respMensajes.ok ||
        !respBeneficiarios.ok ||
        !respNotificaciones.ok
      ) {
        throw new Error("No se pudieron cargar los datos");
      }

      setTotales(await respTotales.json());
      setReservas(await respReservas.json());
      setReporte(await respReporte.json());
      setAvisos(await respAvisos.json());
      setMensajes(await respMensajes.json());
      setBeneficiarios(await respBeneficiarios.json());
      setNotificaciones(await respNotificaciones.json());
    } catch (err) {
      // si el token expiro o es invalido, pedimos login de nuevo
      if (err instanceof Error && err.message.includes("No se pudieron cargar")) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    } finally {
      setCargando(false);
    }
  };

  // Marca una reserva como asistida (o la desmarca)
  const marcarAsistencia = async (reserva: Reserva) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/reservas/${reserva.id}`, {
        method: "PUT",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({ asistio: !reserva.asistio }),
      });
      if (!respuesta.ok) throw new Error("No se pudo actualizar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Publica un aviso nuevo
  const publicarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoError("");
    setAvisoExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({
          titulo: tituloAviso,
          texto: textoAviso,
          fecha: fechaAviso,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo publicar el aviso");
      }
      setTituloAviso("");
      setTextoAviso("");
      setFechaAviso("");
      setAvisoExito("✅ Aviso publicado. Ya aparece en la página y el bot lo conoce.");
      cargarDatos();
    } catch (err) {
      setAvisoError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra un aviso
  const borrarAviso = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Registra un beneficiario nuevo
  const registrarBeneficiario = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenError("");
    setBenExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({
          documento: docBen,
          nombre: nombreBen,
          sede: sedeBen,
          turno: turnoBen,
          grado: gradoBen,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo registrar");
      }
      setDocBen("");
      setNombreBen("");
      setGradoBen("");
      setBenExito("✅ Beneficiario registrado. Ya puede reservar su minuta.");
      cargarDatos();
    } catch (err) {
      setBenError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra un beneficiario
  const borrarBeneficiario = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // ---------- Pantalla de login ----------
  if (!autenticado) {
    return (
      <section className="admin-pagina">
        <h1>Panel de administrador</h1>
        <form className="formulario" onSubmit={entrar}>
          <label>
            Clave del panel
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              placeholder="Ingresa la clave"
            />
          </label>
          {errorLogin && <p className="estado error">⚠️ {errorLogin}</p>}
          <button type="submit" className="boton boton-primario" disabled={cargandoLogin}>
            {cargandoLogin ? "Verificando…" : "Ingresar"}
          </button>
        </form>
      </section>
    );
  }

  // ---------- Panel de administrador ----------
  return (
    <section className="admin-pagina">
      <div className="admin-cabecera">
        <h1>Panel de administrador</h1>
        <button type="button" className="boton boton-secundario" onClick={salir}>
          Salir
        </button>
      </div>

      {/* Pestañas */}
      <div className="admin-pestanas">
        <button
          type="button"
          className={pestana === "panel" ? "activa" : ""}
          onClick={() => setPestana("panel")}
        >
          🍳 Panel de cocina
        </button>
        <button
          type="button"
          className={pestana === "beneficiarios" ? "activa" : ""}
          onClick={() => setPestana("beneficiarios")}
        >
          🎓 Beneficiarios
        </button>
        <button
          type="button"
          className={pestana === "avisos" ? "activa" : ""}
          onClick={() => setPestana("avisos")}
        >
          📢 Avisos
        </button>
        <button
          type="button"
          className={pestana === "notificaciones" ? "activa" : ""}
          onClick={() => setPestana("notificaciones")}
        >
          🔔 Notificaciones
        </button>
        <button
          type="button"
          className={pestana === "mensajes" ? "activa" : ""}
          onClick={() => setPestana("mensajes")}
        >
          ✉️ Mensajes ({mensajes.length})
        </button>
      </div>

      {error && <p className="estado error">⚠️ {error}</p>}

      {cargando && <p className="estado">Cargando…</p>}

      {!cargando && !error && pestana === "panel" && (
        <>
          {reporte && (
            <div className="reporte">
              <h2>Reporte de desperdicio</h2>
              <div className="reporte-cajas">
                <div className="reporte-caja">
                  <span className="reporte-numero">{reporte.totalReservas}</span>
                  <span className="reporte-etiqueta">Minutas reservadas</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">{reporte.minutasServidas}</span>
                  <span className="reporte-etiqueta">Minutas servidas</span>
                </div>
                <div className="reporte-caja desperdicio">
                  <span className="reporte-numero">
                    {reporte.minutasDesperdiciadas}
                  </span>
                  <span className="reporte-etiqueta">Sin asistir ({reporte.porcentajeDesperdicio}%)</span>
                </div>
              </div>

              {/* Desglose por sede y turno */}
              <h3 className="reporte-subtitulo">Desglose por sede</h3>
              <div className="reporte-desglose">
                {Object.entries(reporte.porSede || {}).map(([sede, info]) => (
                  <div key={sede} className="reporte-caja">
                    <span className="reporte-numero">{info.reservas}</span>
                    <span className="reporte-etiqueta">{sede} · {info.asistieron} asistieron</span>
                  </div>
                ))}
              </div>
              <h3 className="reporte-subtitulo">Desglose por turno</h3>
              <div className="reporte-desglose">
                {Object.entries(reporte.porTurno || {}).map(([turno, info]) => (
                  <div key={turno} className="reporte-caja">
                    <span className="reporte-numero">{info.reservas}</span>
                    <span className="reporte-etiqueta">{turno} · {info.asistieron} asistieron</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="admin-subtitulo">Minutas a preparar por fecha</h2>
          <div className="lista-totales">
            {Object.keys(totales).length === 0 && (
              <p className="estado">Aún no hay reservas registradas.</p>
            )}
            {Object.entries(totales)
              .sort((a, b) => (a[0] < b[0] ? -1 : 1))
              .map(([fecha, total]) => (
                <article key={fecha} className="total-fecha">
                  <span className="total-fecha-nombre">{fecha}</span>
                  <span className="total-fecha-cantidad">
                    {total.reservas} minutas · {total.asistieron} asistieron
                  </span>
                </article>
              ))}
          </div>

          <h2 className="admin-subtitulo">Reservas</h2>
          {reservas.length === 0 && (
            <p className="estado">Aún no hay reservas registradas.</p>
          )}
          <div className="lista-reservas">
            {reservas
              .slice()
              .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
              .map((reserva) => (
                <article key={reserva.id} className="fila-reserva">
                  <div>
                    <strong>{reserva.estudiante}</strong>
                    <span className="fila-reserva-detalle">
                      {reserva.sede} · {reserva.turno} · {reserva.fecha}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`asistencia ${reserva.asistio ? "asistio" : ""}`}
                    onClick={() => marcarAsistencia(reserva)}
                  >
                    {reserva.asistio ? "✓ Asistió" : "Marcar asistencia"}
                  </button>
                </article>
              ))}
          </div>
        </>
      )}

      {!cargando && !error && pestana === "beneficiarios" && (
        <>
          <h2 className="admin-subtitulo">Registrar beneficiario</h2>
          <form className="formulario" onSubmit={registrarBeneficiario}>
            <label>
              Documento
              <input
                type="text"
                value={docBen}
                onChange={(e) => setDocBen(e.target.value)}
                required
                placeholder="Ej: 1234567890"
              />
            </label>
            <label>
              Nombre completo
              <input
                type="text"
                value={nombreBen}
                onChange={(e) => setNombreBen(e.target.value)}
                required
                placeholder="Nombre del estudiante"
              />
            </label>
            <div className="formulario-fila">
              <label>
                Sede
                <select value={sedeBen} onChange={(e) => setSedeBen(e.target.value)}>
                  <option>Sede A</option>
                  <option>Sede B</option>
                  <option>Sede C</option>
                </select>
              </label>
              <label>
                Turno
                <select value={turnoBen} onChange={(e) => setTurnoBen(e.target.value)}>
                  <option>Almuerzo</option>
                  <option>Refrigerio</option>
                </select>
              </label>
              <label>
                Grado (opcional)
                <input
                  type="text"
                  value={gradoBen}
                  onChange={(e) => setGradoBen(e.target.value)}
                  placeholder="Ej: 5"
                />
              </label>
            </div>
            {benError && <p className="estado error">⚠️ {benError}</p>}
            {benExito && <p className="estado exito">{benExito}</p>}
            <button type="submit" className="boton boton-primario">
              Registrar beneficiario
            </button>
          </form>

          <h2 className="admin-subtitulo">
            Beneficiarios registrados ({beneficiarios.length})
          </h2>
          {beneficiarios.length === 0 && (
            <p className="estado">Aún no hay beneficiarios registrados.</p>
          )}
          <div className="lista-reservas">
            {beneficiarios.map((b) => (
              <article key={b.id} className="fila-reserva">
                <div>
                  <strong>{b.nombre}</strong>
                  <span className="fila-reserva-detalle">
                    {b.sede} · {b.turno} · Doc. {b.documento}
                    {b.grado ? ` · Grado ${b.grado}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => borrarBeneficiario(b.id)}
                >
                  Borrar
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {!cargando && !error && pestana === "avisos" && (
        <>
          <h2 className="admin-subtitulo">Publicar aviso</h2>
          <form className="formulario" onSubmit={publicarAviso}>
            <label>
              Título
              <input
                type="text"
                value={tituloAviso}
                onChange={(e) => setTituloAviso(e.target.value)}
                required
                placeholder="Ej: Suspensión del servicio"
              />
            </label>
            <label>
              Texto
              <textarea
                value={textoAviso}
                onChange={(e) => setTextoAviso(e.target.value)}
                required
                rows={3}
                placeholder="Describe el aviso…"
              />
            </label>
            <label>
              Etiqueta (opcional)
              <input
                type="text"
                value={fechaAviso}
                onChange={(e) => setFechaAviso(e.target.value)}
                placeholder="Ej: Novedad, Recordatorio"
              />
            </label>
            {avisoError && <p className="estado error">⚠️ {avisoError}</p>}
            {avisoExito && <p className="estado exito">{avisoExito}</p>}
            <button type="submit" className="boton boton-primario">
              Publicar aviso
            </button>
          </form>

          <h2 className="admin-subtitulo">Avisos publicados</h2>
          {avisos.length === 0 && <p className="estado">No hay avisos.</p>}
          <div className="lista-avisos-admin">
            {avisos.map((aviso) => (
              <article key={aviso.id} className="fila-aviso-admin">
                <div>
                  <strong>{aviso.titulo}</strong>
                  <span className="fila-reserva-detalle">
                    {aviso.fecha ? `${aviso.fecha} · ` : ""}
                    {aviso.texto}
                  </span>
                </div>
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => borrarAviso(aviso.id)}
                >
                  Borrar
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {!cargando && !error && pestana === "notificaciones" && (
        <>
          <h2 className="admin-subtitulo">
            Confirmaciones de reserva ({notificaciones.length})
          </h2>
          {notificaciones.length === 0 && (
            <p className="estado">Aún no hay notificaciones. Cuando un estudiante
              reserve, la confirmación aparece aquí.</p>
          )}
          <div className="lista-mensajes">
            {notificaciones.map((nota) => (
              <article key={nota.id} className="fila-mensaje">
                <div>
                  <strong>{nota.tipo} {nota.enviado ? "· ✅ enviada" : "· ⏳ pendiente"}</strong>
                  <span className="fila-reserva-detalle">
                    {nota.destinatario || "Sin correo"} ·{" "}
                    {nota.created_at ? nota.created_at.slice(0, 10) : ""}
                  </span>
                  <p>{nota.mensaje}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {!cargando && !error && pestana === "mensajes" && (
        <>
          <h2 className="admin-subtitulo">Mensajes de contacto</h2>
          {mensajes.length === 0 && (
            <p className="estado">Aún no hay mensajes de contacto.</p>
          )}
          <div className="lista-mensajes">
            {mensajes.map((mensaje) => (
              <article key={mensaje.id} className="fila-mensaje">
                <div>
                  <strong>{mensaje.nombre}</strong>
                  <span className="fila-reserva-detalle">{mensaje.correo}</span>
                  <p>{mensaje.mensaje}</p>
                </div>
                <span className="mensaje-fecha">
                  {mensaje.created_at ? mensaje.created_at.slice(0, 10) : ""}
                </span>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default Admin;
