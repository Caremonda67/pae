// pagina de beneficiarios, muestra a quien llega el programa
// el numero de minutas reservadas se cuenta desde la base de datos

import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function Beneficiarios() {
  // reservasHoy: total de reservas registradas (datos reales)
  const [reservas, setReservas] = useState(0);

  useEffect(() => {
    const cargarTotales = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/reservas/totales`);
        if (!respuesta.ok) throw new Error("Error al cargar");
        const datos = await respuesta.json();
        // Sumamos todas las reservas de todas las fechas
        const total = Object.values(datos as Record<string, number>).reduce(
          (suma: number, valor: number) => suma + valor,
          0
        );
        setReservas(total);
      } catch {
        setReservas(0);
      }
    };
    cargarTotales();
  }, []);

  return (
    <section className="pagina-simple">
      <h1>Beneficiarios</h1>
      <p className="subtitulo">
        A quién llega el programa de alimentación escolar.
      </p>

      <div className="metricas">
        <article className="metrica">
          <span className="metrica-numero">1.254</span>
          <span className="metrica-etiqueta">Estudiantes beneficiarios</span>
        </article>
        <article className="metrica">
          <span className="metrica-numero">23</span>
          <span className="metrica-etiqueta">Instituciones educativas</span>
        </article>
        <article className="metrica">
          <span className="metrica-numero">{reservas}</span>
          <span className="metrica-etiqueta">
            Minutas reservadas (datos reales)
          </span>
        </article>
      </div>

      <p className="nota">
        Las cifras de estudiantes e instituciones son de referencia del
        programa. El número de minutas reservadas es real y se calcula desde la
        base de datos.
      </p>
    </section>
  );
}

export default Beneficiarios;
