import { fechaCorta } from "../../config/fechas";
import type { ReservaAsistencia } from "./types";

interface Props {
  asistenciaFecha: string;
  setAsistenciaFecha: (v: string) => void;
  asistenciaGrupo: { sede: string; turno: string; grado: string } | null;
  asistenciaReservas: ReservaAsistencia[];
  asistenciaCargando: boolean;
  asistenciaError: string;
  asistenciaExito: string;
  cargarAsistencia: (fecha: string) => Promise<void>;
  marcarAsistencia: (r: ReservaAsistencia) => Promise<void>;
  marcarTodosAsistencia: (asistio: boolean) => Promise<void>;
}

export default function TabAsistencia({
  asistenciaFecha, setAsistenciaFecha, asistenciaGrupo,
  asistenciaReservas, asistenciaCargando, asistenciaError, asistenciaExito,
  cargarAsistencia, marcarAsistencia, marcarTodosAsistencia,
}: Props) {
  return (
    <div id="panel-asistencia" role="tabpanel" aria-labelledby="tab-asistencia">
      <h2 className="admin-subtitulo">Asistencia de mi grupo</h2>
      <p className="subtitulo">
        Solo ves los reservados de tu grupo (sede, turno y grado).
        Marca quién asistió para que el reporte de desperdicio sea
        más exacto.
      </p>
      <form className="formulario formulario-fila" onSubmit={(e) => { e.preventDefault(); cargarAsistencia(asistenciaFecha); }}>
        <label htmlFor="fecha-asistencia">
          Fecha
          <input id="fecha-asistencia" type="date" value={asistenciaFecha} onChange={(e) => setAsistenciaFecha(e.target.value)} />
        </label>
        <button type="submit" className="boton boton-primario">Ver grupo</button>
      </form>

      {asistenciaCargando && <p className="estado">Cargando…</p>}
      {asistenciaError && (<p className="estado error" role="alert">⚠️ {asistenciaError}</p>)}
      {asistenciaExito && (<p className="estado exito" aria-live="polite">{asistenciaExito}</p>)}

      {asistenciaGrupo && !asistenciaCargando && !asistenciaError && (
        <>
          <div className="reporte-desglose">
            <div className="reporte-caja">
              <span className="reporte-numero">{asistenciaGrupo.sede}</span>
              <span className="reporte-etiqueta">Sede</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{asistenciaGrupo.turno}</span>
              <span className="reporte-etiqueta">Turno</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">Grado {asistenciaGrupo.grado}</span>
              <span className="reporte-etiqueta">Grupo</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">
                {asistenciaReservas.filter((r) => r.asistio).length} de {asistenciaReservas.length}
              </span>
              <span className="reporte-etiqueta">Asistieron</span>
            </div>
          </div>

          {asistenciaReservas.length === 0 ? (
            <p className="estado">No hay reservas de tu grupo para el {fechaCorta(asistenciaFecha)}.</p>
          ) : (
            <>
              <div className="formulario-fila">
                <button type="button" className="boton boton-secundario" onClick={() => marcarTodosAsistencia(true)}>✓ Marcar todos</button>
                <button type="button" className="boton boton-secundario" onClick={() => marcarTodosAsistencia(false)}>Desmarcar todos</button>
              </div>
              <div className="tabla-cocina">
                <table>
                  <thead><tr><th>Estudiante</th><th>Documento</th><th>Grado</th><th>Asistió</th></tr></thead>
                  <tbody>
                    {asistenciaReservas.map((r) => (
                      <tr key={r.id} className={r.asistio ? "fila-asistio" : undefined}>
                        <td>{r.estudiante}</td>
                        <td>{r.documento}</td>
                        <td>{r.grado ? `Grado ${r.grado}` : "—"}</td>
                        <td><input type="checkbox" checked={r.asistio} onChange={() => marcarAsistencia(r)} aria-label={`Marcar asistencia de ${r.estudiante}`} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
