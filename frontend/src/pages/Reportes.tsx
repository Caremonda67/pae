// pagina publica de reportes
// muestra las reservas de cada fecha como grafico de barras y el
// resumen de desperdicio en un formato visual y digerible para la
// comunidad. Lo tecnico (desgloses, tabla diaria, exportar CSV) vive
// en el panel protegido del admin y la cocina.

import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import FiltroReportes from "../components/FiltroReportes";

interface Reporte {
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
}

function Reportes() {
  const [totales, setTotales] = useState<Record<string, { reservas: number; asistieron: number }>>({});
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const parametros = new URLSearchParams();
        if (desde) parametros.set("desde", desde);
        if (hasta) parametros.set("hasta", hasta);
        const consulta = parametros.toString();

        const [respTotales, respReporte] = await Promise.all([
          fetch(`${API_URL}/api/reservas/totales?${consulta}`),
          fetch(`${API_URL}/api/reservas/reporte?${consulta}`),
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
  }, [desde, hasta]);

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
        <p className="estado error" role="alert">
          ⚠️ {error}. Asegúrate de que el backend esté corriendo.
        </p>
      )}

      {!cargando && !error && (
        <>
          <FiltroReportes desde={desde} hasta={hasta} onCambio={(d, h) => { setDesde(d); setHasta(h); }} />

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
            </div>
          )}

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
        </>
      )}
    </section>
  );
}

export default Reportes;
