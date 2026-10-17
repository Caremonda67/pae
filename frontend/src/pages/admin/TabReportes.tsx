import { fechaCorta } from "../../config/fechas";
import { construirHtmlExcel } from "../../config/exportar";
import FiltroReportes from "../../components/FiltroReportes";
import { TURNOS_SOBRANTES } from "./types";
import type { Reporte, ReservaDiaria, Sobrante, Tendencia } from "./types";
import type { SeccionTabla, OpcionesExportar } from "../../config/exportar";

interface Props {
  desde: string;
  hasta: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  rol: string;
  reporte: Reporte | null;
  sobrantesReporte: Sobrante[];
  sobrantesReporteMensaje: { tipo: "exito" | "error"; texto: string } | null;
  editandoSobrantes: { fecha: string; sede: string; jornadas: Record<string, { porciones: string; peso_kg: string }> } | null;
  setEditandoSobrantes: (v: { fecha: string; sede: string; jornadas: Record<string, { porciones: string; peso_kg: string }> } | null) => void;
  diaria: ReservaDiaria[];
  fechaDiaria: string;
  setFechaDiaria: (v: string) => void;
  diariaCargada: boolean;
  exportarCSV: () => void;
  imprimirDiaria: () => void;
  cargarDiaria: (fecha: string) => Promise<void>;
  conteoDiario: () => Record<string, number>;
  sobrantesPorFechaSede: () => { fecha: string; sede: string; jornadas: string[]; porciones: number; peso_kg: number }[];
  abrirEdicionSobrantes: (fecha: string, sede: string) => void;
  cambiarSobranteReporte: (turno: string, campo: "porciones" | "peso_kg", valor: string) => void;
  guardarSobrantesEditados: (e: React.FormEvent) => Promise<void>;
  borrarSobrantes: (fecha: string, sede: string) => Promise<void>;
  construirSecciones: () => SeccionTabla[];
  opcionesReporte: () => OpcionesExportar;
  tendencia: Tendencia | null;
  tendenciaCargando: boolean;
}

export default function TabReportes({
  desde, hasta, setDesde, setHasta, rol, reporte,
  sobrantesReporte, sobrantesReporteMensaje, editandoSobrantes,
  setEditandoSobrantes, diaria, fechaDiaria, setFechaDiaria,
  diariaCargada, exportarCSV, imprimirDiaria, cargarDiaria,
  conteoDiario, sobrantesPorFechaSede, abrirEdicionSobrantes,
  cambiarSobranteReporte, guardarSobrantesEditados, borrarSobrantes,
  construirSecciones, opcionesReporte, tendencia, tendenciaCargando,
}: Props) {
  return (
    <div id="panel-reportes" role="tabpanel" aria-labelledby="tab-reportes">
      <FiltroReportes
        desde={desde}
        hasta={hasta}
        onCambio={(d, h) => { setDesde(d); setHasta(h); }}
      />

      {reporte && (
        <div className="reporte">
          <h2 className="admin-subtitulo">Reporte de desperdicio</h2>
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
              <span className="reporte-numero">{reporte.minutasDesperdiciadas}</span>
              <span className="reporte-etiqueta">Sin asistir ({reporte.porcentajeDesperdicio}%)</span>
            </div>
          </div>
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
          <div className="centrar">
            <button type="button" className="boton boton-secundario" onClick={exportarCSV} aria-label="Exportar reporte a Excel">⬇️ Exportar Excel</button>
          </div>
        </div>
      )}

      <h2 className="admin-subtitulo">Tendencia: demanda vs sobrantes</h2>
      <p className="subtitulo">
        Compara lo que se reserva y lo que realmente sobra cada día. El
        pronóstico estima cuántas minutas se espera que sobren en los
        próximos días hábiles si no se cancelan a tiempo.
      </p>
      {tendenciaCargando && <p className="estado">Cargando tendencia…</p>}
      {!tendenciaCargando && tendencia && (
        <>
          {tendencia.dias.length === 0 && tendencia.pronostico.length === 0 ? (
            <p className="estado">
              Aún no hay datos suficientes. La tendencia aparece cuando se
              acumulan reservas y sobrantes de varios días.
            </p>
          ) : (
            <>
              {(() => {
                const valores: number[] = [];
                for (const d of tendencia.dias) {
                  valores.push(d.reservas || 0, d.porciones_sobrantes || 0);
                }
                for (const p of tendencia.pronostico) valores.push(p.esperado || 0);
                const maximo = Math.max(...valores, 1);
                return (
                  <>
                    {tendencia.dias.length > 0 && (
                      <div className="grafico">
                        {tendencia.dias.map((d) => (
                          <div key={d.fecha} className="grafico-columna">
                            <div className="grafico-barras">
                              <div
                                className="grafico-barra verde"
                                title={`${d.reservas} reservadas`}
                                style={{ height: `${Math.round((d.reservas / maximo) * 100)}%` }}
                              />
                              <div
                                className="grafico-barra naranja"
                                title={`${d.porciones_sobrantes || 0} porciones sobraron`}
                                style={{ height: `${Math.round(((d.porciones_sobrantes || 0) / maximo) * 100)}%` }}
                              />
                            </div>
                            <span className="grafico-fecha">{fechaCorta(d.fecha)}</span>
                            <span className="grafico-leyenda">
                              {d.reservas} res. · {d.porciones_sobrantes || 0} sob.
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {tendencia.pronostico.length > 0 && (
                      <>
                        <h3 className="reporte-subtitulo">Pronóstico de sobrantes</h3>
                        <div className="grafico">
                          {tendencia.pronostico.map((p) => (
                            <div key={p.fecha} className="grafico-columna">
                              <div className="grafico-barras">
                                <div
                                  className="grafico-barra naranja"
                                  title={`${p.esperado} minutas se espera que sobren`}
                                  style={{ height: `${Math.round((p.esperado / maximo) * 100)}%` }}
                                />
                              </div>
                              <span className="grafico-fecha">{fechaCorta(p.fecha)}</span>
                              <span className="grafico-leyenda">
                                ~{p.esperado} sob.
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="nota">
                          Verde: minutas reservadas. Naranja: porciones que
                          sobraron (o que se espera que sobren). Si los
                          estudiantes cancelan antes de la hora límite, el
                          desperdicio previsto se reduce.
                        </p>
                      </>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </>
      )}

      <h2 className="admin-subtitulo">Sobrantes registrados por fecha</h2>
      <p className="subtitulo">Los días en que se reportó desperdicio de comida en el período elegido, con el total de porciones y kilos por cada sede y fecha.</p>

      {sobrantesReporteMensaje && (
        <p className={`estado ${sobrantesReporteMensaje.tipo === "exito" ? "" : "error"}`}>
          {sobrantesReporteMensaje.tipo === "exito" ? "✅ " : "⚠️ "}{sobrantesReporteMensaje.texto}
        </p>
      )}

      {sobrantesReporte.length === 0 ? (
        <p className="estado">No hay sobrantes registrados en el período seleccionado.</p>
      ) : (
        <>
          <div className="reporte-cajas">
            <div className="reporte-caja">
              <span className="reporte-numero">{new Set(sobrantesReporte.map((s) => s.fecha)).size}</span>
              <span className="reporte-etiqueta">Días con reporte</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{sobrantesReporte.reduce((total, s) => total + (s.porciones ?? 0), 0)}</span>
              <span className="reporte-etiqueta">Porciones desperdiciadas</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{sobrantesReporte.reduce((total, s) => total + (s.peso_kg ?? 0), 0)}</span>
              <span className="reporte-etiqueta">Peso total (kg)</span>
            </div>
          </div>
          <div className="tabla-cocina">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Sede</th><th>Jornadas</th><th>Porciones</th><th>Peso (kg)</th>
                  {(rol === "admin" || rol === "cocina") && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {sobrantesPorFechaSede().map((fila) => (
                  <tr key={`${fila.fecha}||${fila.sede}`}>
                    <td>{fechaCorta(fila.fecha)}</td>
                    <td>{fila.sede}</td>
                    <td>{fila.jornadas.join(", ")}</td>
                    <td>{fila.porciones}</td>
                    <td>{fila.peso_kg}</td>
                    {(rol === "admin" || rol === "cocina") && (
                      <td className="sobrante-acciones">
                        <button type="button" className="boton boton-secundario" onClick={() => abrirEdicionSobrantes(fila.fecha, fila.sede)}>✏️ Editar</button>
                        <button type="button" className="boton boton-peligro" onClick={() => borrarSobrantes(fila.fecha, fila.sede)}>🗑️ Borrar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editandoSobrantes && (
        <form className="formulario" onSubmit={guardarSobrantesEditados}>
          <h3 className="admin-subtitulo">Editar sobrantes · {fechaCorta(editandoSobrantes.fecha)} · {editandoSobrantes.sede}</h3>
          {TURNOS_SOBRANTES.map((turno) => {
            const valores = editandoSobrantes.jornadas[turno] || { porciones: "", peso_kg: "" };
            return (
              <div key={turno} className="sobrante-fila">
                <span className="sobrante-turno">{turno}</span>
                <label>
                  Porciones
                  <input type="number" min="0" value={valores.porciones} onChange={(e) => cambiarSobranteReporte(turno, "porciones", e.target.value)} />
                </label>
                <label>
                  Peso (kg)
                  <input type="number" min="0" step="0.1" value={valores.peso_kg} onChange={(e) => cambiarSobranteReporte(turno, "peso_kg", e.target.value)} />
                </label>
              </div>
            );
          })}
          <div className="sobrante-acciones">
            <button type="submit" className="boton boton-primario">Guardar cambios</button>
            <button type="button" className="boton boton-secundario" onClick={() => setEditandoSobrantes(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="reporte">
        <h2 className="admin-subtitulo">Vista previa del reporte</h2>
        <p className="subtitulo">Así se verá el documento que se descarga como Excel. Se actualiza según el filtro de fechas elegido.</p>
        <iframe className="vista-previa" title="Vista previa del reporte" srcDoc={construirHtmlExcel(construirSecciones(), opcionesReporte())} />
      </div>

      <hr className="separador" />
      <div className="tabla-diaria">
        <h2 className="admin-subtitulo">Tabla diaria de cocina</h2>
        <p className="subtitulo">Elige una fecha para ver cuántas minutas preparar por turno y quién reservó. Puedes imprimirla o guardarla en PDF.</p>
        <form className="formulario formulario-fila" onSubmit={(e) => { e.preventDefault(); cargarDiaria(fechaDiaria); }}>
          <label htmlFor="fecha-diaria">Fecha<input id="fecha-diaria" type="date" value={fechaDiaria} onChange={(e) => setFechaDiaria(e.target.value)} /></label>
          <button type="submit" className="boton boton-primario">Ver minutas</button>
          {diariaCargada && (<button type="button" className="boton boton-secundario" onClick={imprimirDiaria} aria-label="Imprimir tabla diaria o guardar en PDF">🖨️ Imprimir / PDF</button>)}
        </form>
        {diariaCargada && (
          <>
            {diaria.length === 0 ? (
              <p className="estado">No hay reservas para el {fechaDiaria}.</p>
            ) : (
              <>
                <div className="reporte-desglose">
                  {Object.entries(conteoDiario()).map(([turno, cantidad]) => (
                    <div key={turno} className="reporte-caja">
                      <span className="reporte-numero">{cantidad}</span>
                      <span className="reporte-etiqueta">Minutas · {turno}</span>
                    </div>
                  ))}
                  <div className="reporte-caja">
                    <span className="reporte-numero">{diaria.length}</span>
                    <span className="reporte-etiqueta">Total del día</span>
                  </div>
                </div>
                <div className="tabla-cocina">
                  <table>
                    <thead><tr><th>Estudiante</th><th>Documento</th><th>Sede</th><th>Turno</th><th>Asistió</th></tr></thead>
                    <tbody>
                      {diaria.map((r) => (
                        <tr key={r.id}><td>{r.estudiante}</td><td>{r.documento}</td><td>{r.sede}</td><td>{r.turno}</td><td>{r.asistio ? "✓" : "—"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
