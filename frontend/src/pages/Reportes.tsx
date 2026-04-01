// pagina de reportes
// muestra las reservas de cada fecha como grafico de barras,
// el resumen de desperdicio con desglose por sede y turno,
// la tabla diaria para la cocina y botones para exportar a
// CSV o imprimir/PDF. Todo con datos reales del backend.

import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface Reporte {
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
  porSede: Record<string, { reservas: number; asistieron: number }>;
  porTurno: Record<string, { reservas: number; asistieron: number }>;
}

interface ReservaDiaria {
  id: number;
  estudiante: string;
  documento: string;
  sede: string;
  turno: string;
  fecha: string;
  asistio: boolean;
}

function Reportes() {
  const [totales, setTotales] = useState<Record<string, { reservas: number; asistieron: number }>>({});
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // tabla diaria de cocina
  const [fechaDiaria, setFechaDiaria] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [diaria, setDiaria] = useState<ReservaDiaria[]>([]);
  const [diariaCargada, setDiariaCargada] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [respTotales, respReporte] = await Promise.all([
          fetch(`${API_URL}/api/reservas/totales`),
          fetch(`${API_URL}/api/reservas/reporte`),
        ]);
        if (!respTotales.ok || !respReporte.ok) {
          throw new Error("No se pudieron cargar los datos");
        }
        setTotales(await respTotales.json());
        setReporte(await respReporte.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // Carga las reservas de un dia concreto
  const cargarDiaria = async (fecha: string) => {
    setDiariaCargada(false);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/diario?fecha=${fecha}`
      );
      if (!respuesta.ok) throw new Error("No se pudo cargar la tabla diaria");
      const datos = await respuesta.json();
      setDiaria(datos.reservas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDiariaCargada(true);
    }
  };

  // Cuenta la tabla diaria por turno
  const conteoDiario = () => {
    const conteo: Record<string, number> = {};
    for (const r of diaria) {
      conteo[r.turno] = (conteo[r.turno] || 0) + 1;
    }
    return conteo;
  };

  // Descarga un CSV con el resumen de reservas por fecha
  const exportarCSV = () => {
    const filas = [
      ["Fecha", "Reservadas", "Asistieron"],
      ...Object.entries(totales)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([fecha, info]) => [fecha, info.reservas, info.asistieron]),
      ...(reporte
        ? [
            [],
            ["Reporte general"],
            ["Total reservadas", reporte.totalReservas],
            ["Minutas servidas", reporte.minutasServidas],
            ["Minutas desperdiciadas", reporte.minutasDesperdiciadas],
            ["Porcentaje de desperdicio", `${reporte.porcentajeDesperdicio}%`],
          ]
        : []),
    ];

    const texto = filas
      .map((fila) =>
        fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + texto], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "reporte-pae.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  // Imprime / guarda en PDF la tabla diaria de cocina
  const imprimirDiaria = () => {
    window.print();
  };

  // la barra mas alta tiene 100% y las demas se calculan respecto a ella
  const fechas = Object.keys(totales).sort();
  const maximo = Math.max(1, ...fechas.map((f) => totales[f].reservas));

  return (
    <section className="pagina-simple">
      <h1>Reportes</h1>
      <p className="subtitulo">
        Reservas y desperdicio de comida con datos reales de la base de datos.
      </p>

      {cargando && <p className="estado">Cargando datos…</p>}
      {error && (
        <p className="estado error">
          ⚠️ {error}. Asegúrate de que el backend esté corriendo.
        </p>
      )}

      {!cargando && !error && (
        <>
          {/* Resumen de desperdicio */}
          {reporte && (
            <div className="reporte">
              <h2>Resumen general</h2>
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

          {/* Botones de exportacion */}
          <div className="centrar">
            <button type="button" className="boton boton-secundario" onClick={exportarCSV}>
              ⬇️ Exportar CSV
            </button>
          </div>

          {/* Grafico de barras por fecha */}
          <h2 className="admin-subtitulo">Reservas por fecha</h2>
          {fechas.length === 0 && (
            <p className="estado">Aún no hay reservas registradas.</p>
          )}

          <div className="grafico">
            {fechas.map((fecha) => {
              const total = totales[fecha];
              const altura = Math.round((total.reservas / maximo) * 100);
              return (
                <div key={fecha} className="grafico-columna">
                  <div className="grafico-barras">
                    <div
                      className="grafico-barra verde"
                      title={`${total.reservas} reservadas`}
                      style={{ height: `${altura}%` }}
                    />
                    <div
                      className="grafico-barra naranja"
                      title={`${total.asistieron} asistieron`}
                      style={{ height: `${Math.round((total.asistieron / maximo) * 100)}%` }}
                    />
                  </div>
                  <span className="grafico-fecha">{fecha}</span>
                  <span className="grafico-leyenda">
                    {total.reservas} · {total.asistieron} asist.
                  </span>
                </div>
              );
            })}
          </div>

          <p className="nota">
            Verde: minutas reservadas. Naranja: estudiantes que asistieron. La
            diferencia es el desperdicio evitado al preparar solo lo necesario.
          </p>

          {/* Tabla diaria para la cocina */}
          <hr className="separador" />
          <div className="tabla-diaria">
            <h2 className="admin-subtitulo">Tabla diaria de cocina</h2>
            <p className="subtitulo">
              Elige una fecha para ver cuántas minutas preparar por turno. Puedes
              imprimirla o guardarla en PDF.
            </p>

            <form
              className="formulario formulario-fila"
              onSubmit={(e) => {
                e.preventDefault();
                cargarDiaria(fechaDiaria);
              }}
            >
              <label>
                Fecha
                <input
                  type="date"
                  value={fechaDiaria}
                  onChange={(e) => setFechaDiaria(e.target.value)}
                />
              </label>
              <button type="submit" className="boton boton-primario">
                Ver minutas
              </button>
              {diariaCargada && (
                <button type="button" className="boton boton-secundario" onClick={imprimirDiaria}>
                  🖨️ Imprimir / PDF
                </button>
              )}
            </form>

            {diariaCargada && (
              <>
                {diaria.length === 0 ? (
                  <p className="estado">
                    No hay reservas para el {fechaDiaria}.
                  </p>
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
                        <thead>
                          <tr>
                            <th>Estudiante</th>
                            <th>Documento</th>
                            <th>Sede</th>
                            <th>Turno</th>
                            <th>Asistió</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diaria.map((r) => (
                            <tr key={r.id}>
                              <td>{r.estudiante}</td>
                              <td>{r.documento}</td>
                              <td>{r.sede}</td>
                              <td>{r.turno}</td>
                              <td>{r.asistio ? "✓" : "—"}</td>
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
        </>
      )}
    </section>
  );
}

export default Reportes;
