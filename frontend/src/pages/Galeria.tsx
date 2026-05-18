// pagina de galeria
// muestra solo las fotos propias del programa (tabla galeria),
// las publica el administrador. Incluye buscador por titulo o
// descripcion para encontrar una foto puntual.

import { useEffect, useState } from "react";
import Buscador from "../components/Buscador";
import Lightbox from "../components/Lightbox";
import { API_URL } from "../config/api";

interface Foto {
  id: number;
  titulo: string;
  imagen: string;
  descripcion?: string;
}

// Compara dos textos en minusculas, sin tildes ni espacios de mas
function coincide(texto: string, busqueda: string) {
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  return normalizar(texto).includes(normalizar(busqueda));
}

function Galeria() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fotoAbierta, setFotoAbierta] = useState<Foto | null>(null);

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

  const filtradas = fotos.filter((foto) => {
    if (!busqueda.trim()) return true;
    return (
      coincide(foto.titulo, busqueda) ||
      coincide(foto.descripcion || "", busqueda)
    );
  });

  return (
    <section className="pagina-simple">
      <h1>Galería</h1>
      <p className="subtitulo">
        Fotos del programa de alimentación escolar.
      </p>

      <Buscador
        valor={busqueda}
        alCambiar={setBusqueda}
        placeholder="Buscar por título o descripción…"
      />

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
        ) : filtradas.length === 0 ? (
          <p className="estado">No se encontraron fotos para "{busqueda}".</p>
        ) : (
          <div className="galeria">
            {filtradas.map((foto) => (
              <figure
                key={foto.id}
                className="galeria-item"
                onClick={() => setFotoAbierta(foto)}
              >
                <img src={foto.imagen} alt={foto.titulo} loading="lazy" />
                <figcaption>
                  <span className="galeria-titulo">{foto.titulo}</span>
                  {foto.descripcion && (
                    <span className="galeria-descripcion">{foto.descripcion}</span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        ))}

      {fotoAbierta && (
        <Lightbox
          imagen={fotoAbierta.imagen}
          titulo={fotoAbierta.titulo}
          descripcion={fotoAbierta.descripcion}
          alCerrar={() => setFotoAbierta(null)}
        />
      )}
    </section>
  );
}

export default Galeria;
