// Pagina publica de estadisticas del programa
// - resumen del mes (reservas, servidas, desperdicio)
// - minutas por dia de la semana del mes (para ver los dias de mas afluencia)
// - desglose por sede y por turno
// - ranking de platos con su valoracion y el mas/menos gustado

import { useEffect, useState } from "react";
import { descargarCSV } from "../config/exportar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface DatosMes {
  mes: string;
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
  porDiaSemana: Record<string, { reservas: number; servidas: number }>;
  porSede: Record<string, { reservas: number; servidas: number }>;
  porTurno: Record<string, { reservas: number; servidas: number }>;
  ranking: {
    id: number;
    semana: number;
    dia: string;
    platillo: string;
    imagen?: string | null;
    jornada?: string | null;
    valoracion: number | null;
    votos: number;
  }[];
  platoFavorito: { platillo: string; valoracion: number } | null;
  platoMenosGustado: { platillo: string; valoracion: number } | null;
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

function Estadisticas() {
  const [mes, setMes] = useState(mesActual());
  const [datos, setDatos] = useState<DatosMes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      setCargando(true);
      setError("");
      try {
        const respuesta = await fetch(
          `${API_URL}/api/estadisticas?mes=${encodeURIComponent(mes)}`
        );
        if (!respuesta.ok) throw new Error("No se pudieron cargar las estadísticas");
        const json = await respuesta.json();
        if (!cancelado) setDatos(json);
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [mes]);

  const exportarCSV = () => {
    if (!datos) return;
    const filas: (string | number)[][] = [
      ["PAE - Estadísticas", nombreMes(datos.mes)],
      ["Minutas reservadas", datos.totalReservas],
      ["Minutas servidas", datos.minutasServidas],
      ["Minutas sin asistir", datos.minutasDesperdiciadas],
      ["Porcentaje de desperdicio", `${datos.porcentajeDesperdicio}%`],
      [],
      ["Desglose por día de la semana"],
      ["Día", "Reservadas", "Servidas"],
      ...Object.entries(datos.porDiaSemana).map(([dia, info]) => [
        dia,
        info.reservas,
        info.servidas,
      ]),
      [],
      ["Desglose por sede"],
      ["Sede", "Reservadas", "Servidas"],
      ...Object.entries(datos.porSede).map(([sede, info]) => [
        sede,
        info.reservas,
        info.servidas,
      ]),
      [],
      ["Desglose por turno"],
      ["Turno", "Reservadas", "Servidas"],
      ...Object.entries(datos.porTurno).map(([turno, info]) => [
        turno,
        info.reservas,
        info.servidas,
      ]),
      [],
      ["Ranking de platos"],
      ["Plato", "Valoración", "Votos"],
      ...datos.ranking
        .filter((r) => r.valoracion !== null)
        .map((plato) => [plato.platillo, plato.valoracion ?? "", plato.votos]),
    ];
    descargarCSV(filas, `estadisticas-${datos.mes}.csv`);
  };

  return (
    <section className="estadisticas-pagina">
      <h1>📊 Estadísticas del PAE</h1>
      <p className="subtitulo">
        Así se ve el programa por mes: cuántas minutas se sirvieron, en qué días
        hay más afluencia y qué platos les gustan más a los estudiantes.
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
        {datos && (
          <button type="button" className="boton boton-secundario" onClick={exportarCSV}>
            ⬇️ Exportar CSV
          </button>
        )}
      </div>

      {error && <p className="estado error">⚠️ {error}</p>}
      {cargando && <p className="estado">Cargando…</p>}

      {!cargando && !error && datos && (
        <>
          <h2 className="estadisticas-titulo">{nombreMes(datos.mes)}</h2>

          {/* Resumen del mes */}
          <div className="reporte-cajas">
            <div className="reporte-caja">
              <span className="reporte-numero">{datos.totalReservas}</span>
              <span className="reporte-etiqueta">Minutas reservadas</span>
            </div>
            <div className="reporte-caja">
              <span className="reporte-numero">{datos.minutasServidas}</span>
              <span className="reporte-etiqueta">Minutas servidas</span>
            </div>
            <div className="reporte-caja desperdicio">
              <span className="reporte-numero">{datos.minutasDesperdiciadas}</span>
              <span className="reporte-etiqueta">
                Sin asistir ({datos.porcentajeDesperdicio}%)
              </span>
            </div>
          </div>

          {/* Por dia de la semana */}
          <h3 className="estadisticas-titulo">Minutas por día de la semana</h3>
          {Object.keys(datos.porDiaSemana).length > 0 ? (
            <Barras datos={datos.porDiaSemana} />
          ) : (
            <p className="estado">No hubo reservas en este mes.</p>
          )}

          <div className="estadisticas-columnas">
            <div>
              <h3 className="estadisticas-titulo">Por sede</h3>
              {Object.keys(datos.porSede).length > 0 ? (
                <Barras datos={datos.porSede} />
              ) : (
                <p className="estado">Sin datos.</p>
              )}
            </div>
            <div>
              <h3 className="estadisticas-titulo">Por turno</h3>
              {Object.keys(datos.porTurno).length > 0 ? (
                <Barras datos={datos.porTurno} />
              ) : (
                <p className="estado">Sin datos.</p>
              )}
            </div>
          </div>

          {/* Platos favoritos */}
          <div className="estadisticas-favoritos">
            <div className="favorito-caja">
              <span className="favorito-titulo">🏆 Plato más gustado</span>
              {datos.platoFavorito ? (
                <>
                  <strong>{datos.platoFavorito.platillo}</strong>
                  <span className="favorito-estrellas">
                    {"⭐".repeat(Math.round(datos.platoFavorito.valoracion))}
                    {datos.platoFavorito.valoracion}
                  </span>
                </>
              ) : (
                <span className="estado">Aún no hay valoraciones.</span>
              )}
            </div>
            <div className="favorito-caja">
              <span className="favorito-titulo">😐 Plato que menos gustó</span>
              {datos.platoMenosGustado ? (
                <>
                  <strong>{datos.platoMenosGustado.platillo}</strong>
                  <span className="favorito-estrellas">
                    {"⭐".repeat(Math.round(datos.platoMenosGustado.valoracion))}
                    {datos.platoMenosGustado.valoracion}
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
            {datos.ranking
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
            {datos.ranking.filter((r) => r.valoracion !== null).length === 0 && (
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

export default Estadisticas;
