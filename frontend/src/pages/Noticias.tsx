// pagina de noticias y avisos
// los avisos los publica el administrador y se muestran aca,
// vienen de la base de datos (antes eran datos fijos en el codigo)

import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

interface Aviso {
  id: number;
  titulo: string;
  texto: string;
  fecha?: string;
  imagen?: string;
}

function Noticias() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarAvisos = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/avisos`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar los avisos");
        setAvisos(await respuesta.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    };
    cargarAvisos();
  }, []);

  return (
    <section className="pagina-simple">
      <h1>Noticias y avisos</h1>
      <p className="subtitulo">
        Novedades y comunicados importantes del programa.
      </p>

      {cargando && <p className="estado">Cargando avisos…</p>}
      {error && <p className="estado error" role="alert">⚠️ {error}</p>}

      {!cargando && !error && (
        <div className="lista-noticias">
          {avisos.length === 0 && (
            <p className="estado">Aún no hay avisos publicados.</p>
          )}
          {avisos.map((aviso) => (
            <article key={aviso.id} className="tarjeta-noticia">
              {aviso.imagen && (
                <img
                  className="noticia-imagen"
                  src={aviso.imagen}
                  alt={aviso.titulo}
                  loading="lazy"
                />
              )}
              {aviso.fecha && (
                <span className="noticia-fecha">{aviso.fecha}</span>
              )}
              <h3>{aviso.titulo}</h3>
              <p>{aviso.texto}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Noticias;
