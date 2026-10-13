import type { TableroDia } from "./types";

function hoyLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}-${String(ahora.getDate()).padStart(2,"0")}`;
}

interface Props {
  fechaTablero: string;
  setFechaTablero: (v: string) => void;
  tablero: TableroDia | null;
  tableroCargando: boolean;
}

export default function TabTablero({
  fechaTablero, setFechaTablero, tablero, tableroCargando,
}: Props) {
  return (
    <div id="panel-tablero" role="tabpanel" aria-labelledby="tab-tablero">
      <div className="panel-fecha">
        <label htmlFor="fecha-tablero">Fecha</label>
        <input
          id="fecha-tablero"
          type="date"
          value={fechaTablero}
          onChange={(e) => setFechaTablero(e.target.value)}
        />
      </div>

      {tableroCargando && <p className="estado">Cargando tablero…</p>}

      {!tableroCargando && tablero && (
        <>
          <h2 className="admin-subtitulo">Reservas del día</h2>
          <div className="reporte-cajas">
            <div className="reporte-caja">
              <span className="reporte-numero">{tablero.total}</span>
              <span className="reporte-etiqueta">Reservas</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{tablero.asistidos}</span>
              <span className="reporte-etiqueta">Asistieron</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{tablero.sinMarcar}</span>
              <span className="reporte-etiqueta">
                {fechaTablero < hoyLocal() ? "Ausentes" : "Sin marcar"}
              </span>
            </div>
          </div>

          {tablero.porSedeTurno.length > 0 && (
            <>
              <h3 className="reporte-subtitulo">Ocupación por sede y turno</h3>
              <div className="reporte-desglose">
                {tablero.porSedeTurno.map((fila) => (
                  <div key={`${fila.sede}||${fila.turno}`} className="reporte-caja">
                    <span className="reporte-numero">
                      {fila.total}
                      <small> · {fila.asistidos} asist.</small>
                    </span>
                    <span className="reporte-etiqueta">
                      {fila.sede} · {fila.turno}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tablero.reservas.length > 0 ? (
            <>
              <h3 className="reporte-subtitulo">Reservados ({tablero.reservas.length})</h3>
              <div className="lista-totales">
                {tablero.reservas.map((r) => (
                  <article key={r.id} className="total-fecha">
                    <span className="total-fecha-nombre">{r.estudiante}</span>
                    <span className="total-fecha-cantidad">
                      {r.sede} · {r.turno}
                      {r.grado ? ` · Grado ${r.grado}` : ""}
                    </span>
                    {r.asistio && <span className="estado exito">✔ Asistió</span>}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="estado">
              No hay reservas para esa fecha. Revisa que la fecha sea hábil
              (lunes a viernes) y que los estudiantes hayan reservado.
            </p>
          )}
        </>
      )}
    </div>
  );
}
