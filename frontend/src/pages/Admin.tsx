// panel de administrador
// primero pide una clave y despues muestra:
// - el panel de cocina: minutas por fecha, asistencia y desperdicio
// - la gestion de avisos (publicar y borrar noticias)
// - los mensajes que llegan por el formulario de contacto

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Clave del panel. Para una app de produccion real esto deberia
// validarse contra el backend, pero aqui lo dejamos simple para el proyecto.
const CLAVE_ADMIN = "pae2026";

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

// pestañas del panel
type Pestana = "panel" | "avisos" | "mensajes";

function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [pestana, setPestana] = useState<Pestana>("panel");

  const [totales, setTotales] = useState<Record<string, TotalFecha>>({});
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  // formulario de nuevo aviso
  const [tituloAviso, setTituloAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");
  const [fechaAviso, setFechaAviso] = useState("");
  const [avisoError, setAvisoError] = useState("");
  const [avisoExito, setAvisoExito] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Verifica la clave del panel
  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (clave === CLAVE_ADMIN) {
      setAutenticado(true);
      setErrorLogin("");
      cargarDatos();
    } else {
      setErrorLogin("Clave incorrecta");
    }
  };

  // Carga todo: totales, reservas, reporte, avisos y mensajes
  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [respTotales, respReservas, respReporte, respAvisos, respMensajes] =
        await Promise.all([
          fetch(`${API_URL}/api/reservas/totales`),
          fetch(`${API_URL}/api/reservas`),
          fetch(`${API_URL}/api/reservas/reporte`),
          fetch(`${API_URL}/api/avisos`),
          fetch(`${API_URL}/api/contacto`),
        ]);

      if (!respTotales.ok || !respReservas.ok || !respReporte.ok || !respAvisos.ok || !respMensajes.ok) {
        throw new Error("No se pudieron cargar los datos");
      }

      setTotales(await respTotales.json());
      setReservas(await respReservas.json());
      setReporte(await respReporte.json());
      setAvisos(await respAvisos.json());
      setMensajes(await respMensajes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  // Marca una reserva como asistida (o la desmarca)
  const marcarAsistencia = async (reserva: Reserva) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/reservas/${reserva.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
          <button type="submit" className="boton boton-primario">
            Ingresar
          </button>
        </form>
      </section>
    );
  }

  // ---------- Panel de cocina ----------
  return (
    <section className="admin-pagina">
      <div className="admin-cabecera">
        <h1>Panel de administrador</h1>
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() => setAutenticado(false)}
        >
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
          className={pestana === "avisos" ? "activa" : ""}
          onClick={() => setPestana("avisos")}
        >
          📢 Avisos
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
