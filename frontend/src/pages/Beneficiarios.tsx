// pagina de beneficiarios, muestra a quien llega el programa
// los estudiantes, el numero de minutas reservadas y el total de
// reservas por sede se leen de la base de datos (datos reales)

import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface Beneficiario {
  id: number;
  documento: string;
  nombre: string;
  sede: string;
  turno: string;
  grado?: string;
}

function Beneficiarios() {
  // datos reales del registro de beneficiarios
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  // reservas: total de minutas reservadas (dato real)
  const [reservas, setReservas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [respBen, respTotales] = await Promise.all([
          fetch(`${API_URL}/api/beneficiarios`),
          fetch(`${API_URL}/api/reservas/totales`),
        ]);
        if (!respBen.ok || !respTotales.ok) {
          throw new Error("Error al cargar los datos");
        }

        setBeneficiarios(await respBen.json());

        const datos = await respTotales.json();
        // Sumamos todas las reservas de todas las fechas
        let total = 0;
        for (const fecha in datos) {
          total += datos[fecha].reservas;
        }
        setReservas(total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // Cuenta cuantos beneficiarios hay por sede
  const porSede: Record<string, number> = {};
  for (const b of beneficiarios) {
    porSede[b.sede] = (porSede[b.sede] || 0) + 1;
  }

  return (
    <section className="pagina-simple">
      <h1>Beneficiarios</h1>
      <p className="subtitulo">
        A quién llega el programa de alimentación escolar.
      </p>

      {cargando && <p className="estado">Cargando datos…</p>}
      {error && (
        <p className="estado error">
          ⚠️ {error}. Asegúrate de que el backend esté corriendo.
        </p>
      )}

      {!cargando && !error && (
        <>
          <div className="metricas">
            <article className="metrica">
              <span className="metrica-numero">{beneficiarios.length}</span>
              <span className="metrica-etiqueta">Estudiantes beneficiarios</span>
            </article>
            <article className="metrica">
              <span className="metrica-numero">{Object.keys(porSede).length}</span>
              <span className="metrica-etiqueta">Sedes atendidas</span>
            </article>
            <article className="metrica">
              <span className="metrica-numero">{reservas}</span>
              <span className="metrica-etiqueta">
                Minutas reservadas (datos reales)
              </span>
            </article>
          </div>

          <h2 className="admin-subtitulo">Registro por sede</h2>
          <div className="lista-totales">
            {Object.entries(porSede).length === 0 && (
              <p className="estado">Aún no hay beneficiarios registrados.</p>
            )}
            {Object.entries(porSede).map(([sede, cantidad]) => (
              <article key={sede} className="total-fecha">
                <span className="total-fecha-nombre">{sede}</span>
                <span className="total-fecha-cantidad">
                  {cantidad} beneficiario{cantidad === 1 ? "" : "s"}
                </span>
              </article>
            ))}
          </div>

          <h2 className="admin-subtitulo">Listado de beneficiarios</h2>
          <div className="lista-reservas">
            {beneficiarios.map((b) => (
              <article key={b.id} className="fila-reserva">
                <div>
                  <strong>{b.nombre}</strong>
                  <span className="fila-reserva-detalle">
                    {b.sede} · {b.turno} · Doc. {b.documento}
                    {b.grado ? ` · Grado ${b.grado}` : ""}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <p className="nota">
            Este registro lo administra el equipo del PAE. El número de minutas
            reservadas es real y se calcula desde la base de datos.
          </p>
        </>
      )}
    </section>
  );
}

export default Beneficiarios;
