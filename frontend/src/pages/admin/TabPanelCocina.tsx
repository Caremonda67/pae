import type { Sede, MenuItem, PanelCocina } from "./types";

const TURNOS = ["Almuerzo", "Refrigerio"] as const;

interface Props {
  fechaPanel: string;
  setFechaPanel: (v: string) => void;
  panelDia: PanelCocina | null;
  panelCargando: boolean;
  menuDia: MenuItem[];
  sedes: Sede[];
  sobrantesCargando: boolean;
  sobrantesGuardando: boolean;
  sobrantesBorrador: Record<string, { porciones: string; peso_kg: string }>;
  sobranteError: string;
  sobranteExito: string;
  cambiarSobrante: (sede: string, turno: string, campo: "porciones" | "peso_kg", valor: string) => void;
  guardarSobrantes: () => Promise<void>;
}

export default function TabPanelCocina({
  fechaPanel, setFechaPanel, panelDia, panelCargando, menuDia,
  sedes, sobrantesCargando, sobrantesGuardando, sobrantesBorrador,
  sobranteError, sobranteExito, cambiarSobrante, guardarSobrantes,
}: Props) {
  return (
    <div id="panel-panel" role="tabpanel" aria-labelledby="tab-panel">
      <div className="panel-fecha">
        <label htmlFor="fecha-panel">Fecha</label>
        <input
          id="fecha-panel"
          type="date"
          value={fechaPanel}
          onChange={(e) => setFechaPanel(e.target.value)}
        />
      </div>

      {panelCargando && <p className="estado">Cargando panel…</p>}

      {!panelCargando && panelDia && (
        <>
          <h2 className="admin-subtitulo">Minutas a preparar</h2>
          <div className="reporte-cajas">
            <div className="reporte-caja">
              <span className="reporte-numero">{panelDia.porJornada.Almuerzo || 0}</span>
              <span className="reporte-etiqueta">Almuerzos</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{panelDia.porJornada.Refrigerio || 0}</span>
              <span className="reporte-etiqueta">Refrigerios</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{panelDia.total}</span>
              <span className="reporte-etiqueta">Total del día</span>
            </div>
          </div>

          {Object.keys(panelDia.porSede || {}).length > 0 && (
            <>
              <h3 className="reporte-subtitulo">Por sede</h3>
              <div className="reporte-desglose">
                {Object.entries(panelDia.porSede || {}).map(([sede, cantidad]) => (
                  <div key={sede} className="reporte-caja">
                    <span className="reporte-numero">{cantidad}</span>
                    <span className="reporte-etiqueta">{sede}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {Array.isArray(panelDia.reservas) && panelDia.reservas.length > 0 && (
            <>
              <h2 className="admin-subtitulo">Entrega (Grab & Go)</h2>
              {panelDia.reservas.filter((r) => r.para_llevar).length > 0 ? (
                <p className="estado">
                  🛍️{" "}
                  <strong>{panelDia.reservas.filter((r) => r.para_llevar).length}</strong>{" "}
                  minuta{panelDia.reservas.filter((r) => r.para_llevar).length === 1 ? "" : "s"} para
                  llevar con código. En los turnos de refrigerio pide el código
                  al estudiante y entrégalo rápido.
                </p>
              ) : (
                <p className="estado">
                  Las minutas de hoy se sirven en el comedor. Si un estudiante
                  marca "Para llevar", su reserva aparecerá aquí con código de
                  verificación.
                </p>
              )}
              <div className="lista-reservas">
                {panelDia.reservas.map((r) => (
                  <article key={r.id} className="fila-reserva">
                    <div className="fila-menu-contenido">
                      <div>
                        <strong>{r.estudiante}</strong>
                        <span className="fila-reserva-detalle">
                          {r.sede} · {r.turno} · {r.grado ? `Grado ${r.grado}` : "Sin grado"}
                          {r.para_llevar ? " · Para llevar" : " · En comedor"}
                        </span>
                        {r.para_llevar && r.codigo && (
                          <span className="ticket-codigo-inline">{r.codigo}</span>
                        )}
                        {r.alergias && (
                          <span className="etiqueta-alergia">⚠️ Alergias: {r.alergias}</span>
                        )}
                        {r.preferencias && (
                          <span className="etiqueta-preferencia">{r.preferencias}</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="sobrantes">
            <h2 className="admin-subtitulo">Sobrantes del día</h2>
            <p className="estado">
              Registra cuántas porciones y el peso (kg) de comida que
              sobró en cada sede y jornada.
            </p>
            {sobrantesCargando && <p className="estado">Cargando sobrantes…</p>}
            {!sobrantesCargando &&
              (sedes.length === 0 ? (
                <p className="estado">
                  Aún no hay sedes registradas. Crea una desde la pestaña
                  "Sedes".
                </p>
              ) : (
                <>
                  {sedes.map((s) => (
                    <div key={s.id} className="sobrante-sede">
                      <h3 className="sobrante-sede-nombre">{s.nombre}</h3>
                      {TURNOS.map((turno) => {
                        const clave = `${s.nombre}||${turno}`;
                        const datos = sobrantesBorrador[clave] || { porciones: "", peso_kg: "" };
                        return (
                          <div key={turno} className="sobrante-fila">
                            <span className="sobrante-turno">{turno}</span>
                            <label>
                              Porciones sobrantes
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={datos.porciones}
                                onChange={(e) =>
                                  cambiarSobrante(s.nombre, turno, "porciones", e.target.value)
                                }
                                placeholder="Ej: 12"
                                aria-label={`Porciones sobrantes de ${turno} en ${s.nombre}`}
                              />
                            </label>
                            <label>
                              Peso (kg)
                              <input
                                type="number"
                                min={0}
                                step="0.1"
                                value={datos.peso_kg}
                                onChange={(e) =>
                                  cambiarSobrante(s.nombre, turno, "peso_kg", e.target.value)
                                }
                                placeholder="Ej: 3.5"
                                aria-label={`Peso sobrante de ${turno} en ${s.nombre}`}
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="sobrante-acciones">
                    <button
                      type="button"
                      className="boton boton-primario"
                      onClick={guardarSobrantes}
                      disabled={sobrantesGuardando}
                    >
                      {sobrantesGuardando ? "Guardando…" : "Guardar sobrantes"}
                    </button>
                  </div>
                  {sobranteError && (
                    <p className="estado error" role="alert">⚠️ {sobranteError}</p>
                  )}
                  {sobranteExito && (
                    <p className="estado exito" role="status">✅ {sobranteExito}</p>
                  )}
                </>
              ))}
          </div>

          {menuDia.length > 0 && (
            <>
              <h2 className="admin-subtitulo">Menú del día</h2>
              <div className="lista-totales">
                {menuDia.map((plato) => (
                  <article key={plato.id} className="total-fecha">
                    <span className="total-fecha-nombre">{plato.jornada}</span>
                    <span className="total-fecha-cantidad">
                      {plato.platillo}
                    </span>
                  </article>
                ))}
              </div>
            </>
          )}

          {panelDia.total === 0 && (
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
