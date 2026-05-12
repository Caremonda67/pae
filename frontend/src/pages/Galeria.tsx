// pagina de galeria
// muestra solo las fotos propias del programa (tabla galeria),
// las publica el administrador. Antes el boton "Ver mas" de la
// Home llevaba a noticias; ahora hay un apartado dedicado.

import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface Foto {
  id: number;
  titulo: string;
  imagen: string;
}

function Galeria() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/galeria`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar las fotos");
        setFotos(await respuesta.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  return (
    <section className="pagina-simple">
      <h1>Galería</h1>
      <p className="subtitulo">
        Fotos del programa de alimentación escolar.
      </p>

      {cargando && <p className="estado">Cargando fotos…</p>}
      {error && <p className="estado error" role="alert">⚠️ {error}</p>}

      {!cargando && !error &&
        (fotos.length === 0 ? (
          <div className="galeria-vacia">
            <span className="galeria-vacia-icono" aria-hidden="true">🖼️</span>
            <p className="galeria-vacia-texto">
              La galería está vacía. El equipo subirá fotos del programa muy pronto.
            </p>
          </div>
        ) : (
          <div className="galeria">
            {fotos.map((foto) => (
              <figure key={foto.id} className="galeria-item">
                <img src={foto.imagen} alt={foto.titulo} loading="lazy" />
                <figcaption>{foto.titulo}</figcaption>
              </figure>
            ))}
          </div>
        ))}
    </section>
  );
}

export default Galeria;
