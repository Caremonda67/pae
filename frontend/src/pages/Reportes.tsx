// pagina publica de reportes (fusiona el antiguo Reportes + Estadisticas)
// - resumen de reservas/desperdicio en un rango de fechas (grafico de barras)
// - ranking de platos con su valoracion y el mas/menos gustado del mes

import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { descargarExcel } from "../config/exportar";
import FiltroReportes from "../components/FiltroReportes";

interface Reporte {
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
}

interface PlatoRanking {
  id: number;
  semana: number;
  dia: string;
  platillo: string;
  jornada?: string | null;
  valoracion: number | null;
  votos: number;
}

interface DatosMes {
  mes: string;
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
  porDiaSemana: Record<string, { reservas: number; servidas: number }>;
  porSede: Record<string, { reservas: number; servidas: number }>;
  porTurno: Record<string, { reservas: number; servidas: number }>;
  platoFavorito: { platillo: string; valoracion: number } | null;
  platoMenosGustado: { platillo: string; valoracion: number } | null;
  ranking: PlatoRanking[];
}

// mes actual en formato YYYY-MM (zona horaria local)
function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

// recibe "2026-08" y devuelve "Agosto 2026"
function nombreMes(mes: string) {
  const [año, mesNum] = mes.split("-");
  const nombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${nombres[Number(mesNum) - 1] || mesNum} ${año}`;
}

// barras horizontales simples para mostrar cantidades
function Barras({ datos }: { datos: Record<string, { reservas: number; servidas: number }> }) {
  const maximo = Math.max(1, ...Object.values(datos).map((d) => d.reservas));
  return (
    <div className="barras">
      {Object.entries(datos).map(([nombre, info]) => (
        <div key={nombre} className="barra-fila">
          <span className="barra-nombre">{nombre}</span>
          <div className="barra-pista">
            <div
              className="barra-llena"
              style={{ width: `${Math.round((info.reservas / maximo) * 100)}%` }}
            />
          </div>
          <span className="barra-cantidad">
            {info.reservas} · {info.servidas} servidas
          </span>
        </div>
      ))}
    </div>
  );
}

function Reportes() {
  // Rango de fechas (seccion de reservas/desperdicio)
  const [totales, setTotales] = useState<Record<string, { reservas: number; asistieron: number }>>({});
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Estadisticas del mes (ranking de platos)
  const [mes, setMes] = useState(mesActual());
  const [datosMes, setDatosMes] = useState<DatosMes | null>(null);
  const [cargandoMes, setCargandoMes] = useState(false);
  const [errorMes, setErrorMes] = useState("");

  const exportarExcel = () => {
    if (!datosMes) return;
    const secciones = [
      {
        titulo: `PAE · Estadísticas de ${nombreMes(datosMes.mes)}`,
        columnas: ["Concepto", "Valor"],
        filas: [
          ["Minutas reservadas", datosMes.totalReservas],
          ["Minutas servidas", datosMes.minutasServidas],
          ["Minutas sin asistir", datosMes.minutasDesperdiciadas],
          ["Porcentaje de desperdicio", `${datosMes.porcentajeDesperdicio}%`],
        ],
      },
      {
        titulo: "Desglose por día de la semana",
        columnas: ["Día", "Reservadas", "Servidas"],
        filas: Object.entries(datosMes.porDiaSemana).map(([dia, info]) => [
          dia,
          info.reservas,
          info.servidas,
        ]),
      },
      {
        titulo: "Desglose por sede",
        columnas: ["Sede", "Reservadas", "Servidas"],
        filas: Object.entries(datosMes.porSede).map(([sede, info]) => [
          sede,
          info.reservas,
          info.servidas,
        ]),
      },
      {
        titulo: "Desglose por turno",
        columnas: ["Turno", "Reservadas", "Servidas"],
        filas: Object.entries(datosMes.porTurno).map(([turno, info]) => [
          turno,
          info.reservas,
          info.servidas,
        ]),
      },
      {
        titulo: "Ranking de platos",
        columnas: ["Plato", "Valoración", "Votos"],
        filas: datosMes.ranking
          .filter((r) => r.valoracion !== null)
          .map((plato) => [plato.platillo, plato.valoracion ?? "", plato.votos]),
      },
    ];
    descargarExcel(secciones, `estadisticas-${datosMes.mes}.xls`, {
      titulo: `Estadísticas ${nombreMes(datosMes.mes)}`,
      subtitulo: "Programa de Alimentación Escolar · consumo y preferencias",
    });
  };

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

  useEffect(() => {
    let cancelado = false;
    const cargarEstadisticas = async () => {
      setCargandoMes(true);
      setErrorMes("");
      try {
        const respuesta = await fetch(
          `${API_URL}/api/estadisticas?mes=${encodeURIComponent(mes)}`
        );
        if (!respuesta.ok) throw new Error("No se pudieron cargar las estadísticas");
        const json = await respuesta.json();
        if (!cancelado) setDatosMes(json);
      } catch (err) {
        if (!cancelado) setErrorMes(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (!cancelado) setCargandoMes(false);
      }
    };
    cargarEstadisticas();
    return () => {
      cancelado = true;
    };
  }, [mes]);

  // la barra mas alta tiene 100% y las demas se calculan respecto a ella
  const fechas = Object.keys(totales).sort();
  const maximo = Math.max(1, ...fechas.map((f) => totales[f].reservas));

  return (
    <section className="pagina-simple">
      <h1>Reportes</h1>
      <p className="subtitulo">
        Reservas, desperdicio y preferencias de platos con datos reales del programa.
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
            Reservas: barra verde lisa. Asistencia: barra naranja rayada. Cada
            fecha muestra ambos valores para que la diferencia no dependa solo
            del color.
          </p>
        </>
      )}

      <hr className="separador" />

      {/* Estadisticas del mes (ranking de platos) */}
      <h2 className="admin-subtitulo">Preferencias de los estudiantes</h2>
      <p className="subtitulo">
        Qué platos les gustan más, por mes.
      </p>

      <div className="mes-selector">
        <label>
          Mes a consultar
          <input
            type="month"
            value={mes}
            onChange={(e) => e.target.value && setMes(e.target.value)}
          />
        </label>
        {datosMes && (
          <button type="button" className="boton boton-secundario" onClick={exportarExcel}>
            ⬇️ Exportar Excel
          </button>
        )}
      </div>

      {errorMes && <p className="estado error" role="alert">⚠️ {errorMes}</p>}
      {cargandoMes && <p className="estado">Cargando…</p>}

      {!cargandoMes && !errorMes && datosMes && (
        <>
          <h2 className="estadisticas-titulo">{nombreMes(datosMes.mes)}</h2>

          {/* Por dia de la semana */}
          <h3 className="estadisticas-titulo">Minutas por día de la semana</h3>
          {Object.keys(datosMes.porDiaSemana).length > 0 ? (
            <Barras datos={datosMes.porDiaSemana} />
          ) : (
            <p className="estado">No hubo reservas en este mes.</p>
          )}

          <div className="estadisticas-columnas">
            <div>
              <h3 className="estadisticas-titulo">Por sede</h3>
              {Object.keys(datosMes.porSede).length > 0 ? (
                <Barras datos={datosMes.porSede} />
              ) : (
                <p className="estado">Sin datos.</p>
              )}
            </div>
            <div>
              <h3 className="estadisticas-titulo">Por turno</h3>
              {Object.keys(datosMes.porTurno).length > 0 ? (
                <Barras datos={datosMes.porTurno} />
              ) : (
                <p className="estado">Sin datos.</p>
              )}
            </div>
          </div>

          {/* Platos favoritos */}
          <div className="estadisticas-favoritos">
            <div className="favorito-caja">
              <span className="favorito-titulo">🏆 Plato más gustado</span>
              {datosMes.platoFavorito ? (
                <>
                  <strong>{datosMes.platoFavorito.platillo}</strong>
                  <span className="favorito-estrellas">
                    {"⭐".repeat(Math.round(datosMes.platoFavorito.valoracion))}
                    {datosMes.platoFavorito.valoracion}
                  </span>
                </>
              ) : (
                <span className="estado">Aún no hay valoraciones.</span>
              )}
            </div>
            <div className="favorito-caja">
              <span className="favorito-titulo">😐 Plato que menos gustó</span>
              {datosMes.platoMenosGustado ? (
                <>
                  <strong>{datosMes.platoMenosGustado.platillo}</strong>
                  <span className="favorito-estrellas">
                    {"⭐".repeat(Math.round(datosMes.platoMenosGustado.valoracion))}
                    {datosMes.platoMenosGustado.valoracion}
                  </span>
                </>
              ) : (
                <span className="estado">Aún no hay valoraciones.</span>
              )}
            </div>
          </div>

          {/* Ranking de platos */}
          <h3 className="estadisticas-titulo">Ranking de platos</h3>
          <div className="ranking-lista">
            {datosMes.ranking
              .filter((r) => r.valoracion !== null)
              .map((plato, indice) => (
                <article key={plato.id} className="fila-reserva">
                  <div>
                    <strong>
                      {indice + 1}. {plato.platillo}
                    </strong>
                    <span className="fila-reserva-detalle">
                      {plato.dia} · Semana {plato.semana}
                      {plato.jornada ? ` · ${plato.jornada}` : ""}
                    </span>
                  </div>
                  <span className="favorito-estrellas">
                    {"⭐".repeat(Math.round(plato.valoracion ?? 0))}
                    {plato.valoracion} · {plato.votos}{" "}
                    {plato.votos === 1 ? "voto" : "votos"}
                  </span>
                </article>
              ))}
            {datosMes.ranking.filter((r) => r.valoracion !== null).length === 0 && (
              <p className="estado">
                Ningún plato tiene valoraciones todavía. Vota cuando veas el menú.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default Reportes;
