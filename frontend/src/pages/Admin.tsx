// panel de administrador
// primero pide una clave y despues muestra cuantas minutas se
// reservaron por fecha, la lista de reservas para marcar quien
// asistio y un reporte de desperdicio.

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

function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  const [totales, setTotales] = useState<Record<string, TotalFecha>>({});
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reporte, setReporte] = useState<Reporte | null>(null);
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

  // Carga todo: totales por fecha, reservas y reporte
  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [respTotales, respReservas, respReporte] = await Promise.all([
        fetch(`${API_URL}/api/reservas/totales`),
        fetch(`${API_URL}/api/reservas`),
        fetch(`${API_URL}/api/reservas/reporte`),
      ]);

      if (!respTotales.ok || !respReservas.ok || !respReporte.ok) {
        throw new Error("No se pudieron cargar los datos");
      }

      setTotales(await respTotales.json());
      setReservas(await respReservas.json());
      setReporte(await respReporte.json());
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
        <h1>Panel de cocina</h1>
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() => setAutenticado(false)}
        >
          Salir
        </button>
      </div>

      <p className="subtitulo">
        Minutas a preparar, asistencia de estudiantes y desperdicio evitado.
      </p>

      <button type="button" className="boton boton-secundario" onClick={cargarDatos}>
        Actualizar datos
      </button>

      {cargando && <p className="estado">Cargando…</p>}
      {error && <p className="estado error">⚠️ {error}</p>}

      {!cargando && !error && (
        <>
          {/* Reporte de desperdicio */}
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

          {/* Totales por fecha */}
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

          {/* Lista de reservas con asistencia */}
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
    </section>
  );
}

export default Admin;
