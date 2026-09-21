import { useEffect, useRef, useState } from "react";
import { API_URL, urlReproduccionJuego } from "../../config/api";
import type { Juego, VersionJuego } from "./types";
import { etiquetaDispositivo } from "./types";

interface Props {
  juego: Juego | null;
  alCerrar: () => void;
  alIncrementarVistas?: (id: number) => void;
}

function formatoFecha(iso?: string | null): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

export default function ReproductorJuego({ juego, alCerrar, alIncrementarVistas }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const pantallaRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false);
  const [mostrarBotonSalir, setMostrarBotonSalir] = useState(false);
  const timerOcultarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yaRegistradoRef = useRef<number | null>(null);

  const TIEMPO_OCULTAR_BOTON_MS = 2600;

  const [versiones, setVersiones] = useState<VersionJuego[]>([]);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const resetTimerOcultar = () => {
    if (timerOcultarRef.current) clearTimeout(timerOcultarRef.current);
    setMostrarBotonSalir(true);
    timerOcultarRef.current = setTimeout(() => {
      setMostrarBotonSalir(false);
    }, TIEMPO_OCULTAR_BOTON_MS);
  };

  useEffect(() => {
    if (!juego?.id || yaRegistradoRef.current === juego.id) return;
    yaRegistradoRef.current = juego.id;

    fetch(`${API_URL}/api/juegos/${juego.id}/jugar`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && !data.repetido && alIncrementarVistas) {
          alIncrementarVistas(juego.id);
        }
      })
      .catch(() => {});
  }, [juego?.id, alIncrementarVistas]);

  useEffect(() => {
    if (!juego?.id) return;
    let activo = true;

    fetch(`${API_URL}/api/juegos/${juego.id}/versiones`)
      .then((res) => res.json())
      .then((data) => {
        if (activo) setVersiones(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, [juego?.id]);

  useEffect(() => {
    if (!juego) return;

    // Bloquear scroll de la página de fondo mientras el juego está abierto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-scroll al centro y foco inmediato para que el usuario sienta la apertura al instante
    contenedorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        alCerrar();
      }
    };
    window.addEventListener("keydown", alPulsarTecla);

    const alCambiarFullscreen = () => {
      const activo = Boolean(document.fullscreenElement);
      setEsPantallaCompleta(activo);
      if (activo) {
        resetTimerOcultar();
      } else {
        if (timerOcultarRef.current) clearTimeout(timerOcultarRef.current);
        setMostrarBotonSalir(false);
      }
    };
    document.addEventListener("fullscreenchange", alCambiarFullscreen);

    const alMoverMouse = () => {
      if (document.fullscreenElement) {
        resetTimerOcultar();
      }
    };
    window.addEventListener("mousemove", alMoverMouse);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", alPulsarTecla);
      document.removeEventListener("fullscreenchange", alCambiarFullscreen);
      window.removeEventListener("mousemove", alMoverMouse);
      if (timerOcultarRef.current) clearTimeout(timerOcultarRef.current);
    };
  }, [juego, alCerrar]);

  if (!juego) return null;

  // Ponemos en pantalla completa SOLO la pantalla del juego (el iframe), NO el texto ni la barra
  const togglePantallaCompleta = () => {
    const objetivo = pantallaRef.current;
    if (!objetivo) return;

    if (!document.fullscreenElement) {
      objetivo.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const reiniciarJuego = () => {
    if (iframeRef.current) {
      const srcActual = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = srcActual;
      }, 100);
    }
  };

  return (
    <div className="modal-fondo reproductor-fondo" onClick={alCerrar} role="dialog" aria-modal="true">
      <div className="reproductor-caja" ref={contenedorRef} onClick={(e) => e.stopPropagation()}>
        <div className="reproductor-barra-superior">
          <div className="reproductor-info">
            <span className="badge-categoria">{juego.categoria}</span>
            <h3>{juego.titulo}</h3>
            <span className="reproductor-autor">
              Creado por <strong>{juego.autor_nombre}</strong>
              {juego.autor_grado ? ` (${juego.autor_grado})` : ""}
            </span>
          </div>

          <div className="reproductor-botones">
            <button
              type="button"
              className="boton-icono"
              onClick={reiniciarJuego}
              title="Reiniciar juego"
              aria-label="Reiniciar juego"
            >
              🔄
            </button>
            <button
              type="button"
              className="boton-icono"
              onClick={togglePantallaCompleta}
              title={esPantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa (solo el juego)"}
              aria-label="Pantalla completa"
            >
              {esPantallaCompleta ? "🗗" : "⛶"}
            </button>
            <button
              type="button"
              className="boton-icono boton-cerrar"
              onClick={alCerrar}
              title="Cerrar reproductor (Esc)"
              aria-label="Cerrar reproductor"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Solo esta sección entra en pantalla completa */}
        <div className="reproductor-pantalla" ref={pantallaRef}>
          <iframe
            ref={iframeRef}
            src={urlReproduccionJuego(juego.url_recurso)}
            title={juego.titulo}
            className="juego-iframe"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            allow="fullscreen; autoplay; gamepad"
            loading="lazy"
          />

          {esPantallaCompleta && (
            <>
              {/* Zona invisible sensible al cursor en el borde superior para revelar la píldora inmediatamente */}
              <div
                className="fullscreen-trigger-zona"
                onMouseEnter={resetTimerOcultar}
                aria-hidden="true"
              />
              <div
                className={`fullscreen-alerta-salir ${mostrarBotonSalir ? "visible" : ""}`}
                onMouseEnter={() => {
                  if (timerOcultarRef.current) clearTimeout(timerOcultarRef.current);
                  setMostrarBotonSalir(true);
                }}
                onMouseLeave={resetTimerOcultar}
              >
                <button
                  type="button"
                  className="boton-salir-fullscreen-pildora"
                  onClick={togglePantallaCompleta}
                  title="Salir de pantalla completa (o presiona Esc)"
                >
                  <span className="icono-salir">✕</span>
                  <span>Salir de pantalla completa</span>
                  <kbd className="tecla-esc">Esc</kbd>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="reproductor-detalles">
          <div className="reproductor-metrica">
            <span>🔥 {juego.vistas} partidas jugadas</span>
            <span className="reproductor-dispositivo">{etiquetaDispositivo(juego.dispositivo)}</span>
            {juego.actualizado_en && (
              <span className="badge-reproductor-actualizado">🔄 v{juego.version || "2.0"}</span>
            )}
          </div>

          {/* Historial de versiones: la más actual primero (desplegable) */}
          {versiones.length > 0 && (
            <div className="reproductor-seccion">
              <h4>🔄 Historial de versiones</h4>
              <ol className="historial-version-lista">
                {versiones.map((v, i) => {
                  const esActual = i === 0;
                  if (!esActual && !mostrarTodas) return null;
                  return (
                    <li
                      key={v.id}
                      className={`historial-version-item ${esActual ? "actual" : ""}`}
                    >
                      <div className="historial-version-cabecera">
                        <span className="historial-version-badge">
                          {`v${v.version}`}
                          {esActual && <span className="historial-version-actual-label">· Actual</span>}
                        </span>
                        <span className="historial-version-fecha">{formatoFecha(v.creada_en)}</span>
                      </div>
                      {v.novedades ? (
                        <p className="historial-version-novedades">{v.novedades}</p>
                      ) : (
                        <p className="historial-version-sin">Publicación inicial de este juego.</p>
                      )}
                    </li>
                  );
                })}
              </ol>
              {versiones.length > 1 && (
                <button
                  type="button"
                  className="historial-version-toggle"
                  onClick={() => setMostrarTodas((v) => !v)}
                  aria-expanded={mostrarTodas}
                >
                  {mostrarTodas
                    ? `▲ Ocultar versiones anteriores (${versiones.length - 1})`
                    : `▼ Ver versiones anteriores (${versiones.length - 1})`}
                </button>
              )}
            </div>
          )}

          {juego.instrucciones && (
            <div className="reproductor-seccion">
              <h4>🎯 ¿Cómo jugar?</h4>
              <p>{juego.instrucciones}</p>
            </div>
          )}
          {juego.descripcion && (
            <div className="reproductor-seccion">
              <h4>🌱 Sobre este juego y el PAE</h4>
              <p>{juego.descripcion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
