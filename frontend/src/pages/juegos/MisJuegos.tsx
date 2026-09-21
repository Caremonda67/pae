import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { cabeceras, type Sesion } from "../../config/sesion";
import { etiquetaDispositivo, type Juego } from "./types";
import ModalActualizarJuego from "./ModalActualizarJuego";

interface Props {
  sesion: Sesion | null;
  alEnviar: () => void;
}

export default function MisJuegos({ sesion, alEnviar }: Props) {
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [juegoActualizando, setJuegoActualizando] = useState<Juego | null>(null);

  const cargarMisJuegos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const resp = await fetch(`${API_URL}/api/juegos/mios`, { headers: cabeceras(false) });
      if (!resp.ok) throw new Error("No se pudieron cargar tus juegos");
      const data = await resp.json();
      setJuegos(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (sesion) cargarMisJuegos();
  }, [sesion, cargarMisJuegos]);

  const handleActualizado = (juegoActualizado: Juego) => {
    setJuegos((prev) => prev.map((j) => (j.id === juegoActualizado.id ? juegoActualizado : j)));
    setExito("Actualización enviada. El administrador la revisará antes de publicarla.");
    setJuegoActualizando(null);
  };

  const pendienteActualizacion = (j: Juego) => j.actualizacion_pendiente?.estado;

  return (
    <section className="mis-juegos">
      <div className="mis-juegos-cabecera">
        <div>
          <h2>🎮 Mis juegos</h2>
          <p className="subtitulo">
            Administra tus creaciones: revisa su estado y solicita actualizaciones cuando quieras.
          </p>
        </div>
        <button
          type="button"
          className="boton boton-secundario boton-chico"
          onClick={cargarMisJuegos}
          disabled={cargando}
        >
          🔄 Actualizar lista
        </button>
      </div>

      {error && <p className="estado error" role="alert">⚠️ {error}</p>}
      {exito && <p className="estado exito" role="status">✅ {exito}</p>}

      {cargando ? (
        <p className="estado">Cargando tus juegos...</p>
      ) : juegos.length === 0 ? (
        <div className="arcade-vacio">
          <span className="arcade-vacio-icono">🕹️</span>
          <h3>Aún no has enviado ningún juego</h3>
          <p>Crea un videojuego educativo sobre el PAE y forma parte del Arcade.</p>
          <button type="button" className="boton boton-primario" onClick={alEnviar}>
            🚀 Enviar mi primer videojuego
          </button>
        </div>
      ) : (
        <div className="mis-juegos-lista">
          {juegos.map((juego) => (
            <article key={juego.id} className="tarjeta-mis-juegos">
              <div className="tarjeta-mis-juegos-portada">
                <img
                  src={juego.portada_url || "/placeholder-juego.svg"}
                  alt={juego.titulo}
                />
                <span className={`badge-estado estado-${juego.estado}`}>
                  {juego.estado === "aprobado" ? "Publicado" : juego.estado === "pendiente" ? "En revisión" : "Rechazado"}
                </span>
              </div>

              <div className="tarjeta-mis-juegos-info">
                <h3>{juego.titulo}</h3>
                <span className="badge-categoria-inline">{juego.categoria}</span>
                <span className="badge-dispositivo-inline">{etiquetaDispositivo(juego.dispositivo)}</span>
                <p className="tarjeta-mis-juegos-desc">
                  {juego.descripcion || "Sin descripción."}
                </p>

                {juego.estado === "rechazado" && juego.motivo_rechazo && (
                  <div className="caja-motivo-rechazo">
                    <span className="motivo-rechazo-alerta">
                      ⚠️ Motivo del rechazo: {juego.motivo_rechazo}
                    </span>
                  </div>
                )}

                {/* Estado de la actualización solicitada */}
                {pendienteActualizacion(juego) === "pendiente" && (
                  <div className="juego-novedades-contenido actualizacion-estado">
                    <p>⏳ Tienes una actualización <strong>en revisión</strong> (v{juego.actualizacion_pendiente?.version || "?"}):</p>
                    <blockquote>{juego.actualizacion_pendiente?.novedades}</blockquote>
                  </div>
                )}
                {pendienteActualizacion(juego) === "rechazado" && (
                  <div className="juego-novedades-contenido actualizacion-estado rechazada">
                    <p>❌ Tu actualización fue <strong>rechazada</strong>:</p>
                    <blockquote>{juego.actualizacion_pendiente?.motivo || "Sin motivo especificado"}</blockquote>
                  </div>
                )}

                <div className="tarjeta-mis-juegos-acciones">
                  {juego.estado === "aprobado" && (
                    juego.actualizacion_pendiente?.estado === "pendiente" ? (
                      <span className="badge-espera">⏳ Esperando revisión del admin</span>
                    ) : (
                      <button
                        type="button"
                        className="boton boton-primario boton-chico"
                        onClick={() => setJuegoActualizando(juego)}
                      >
                        {juego.actualizacion_pendiente?.estado === "rechazado"
                          ? "🔄 Reintentar actualización"
                          : "🔄 Solicitar actualización"}
                      </button>
                    )
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {juegoActualizando && (
        <ModalActualizarJuego
          juego={juegoActualizando}
          alCerrar={() => setJuegoActualizando(null)}
          alActualizado={handleActualizado}
        />
      )}
    </section>
  );
}