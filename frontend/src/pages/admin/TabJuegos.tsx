import { useEffect, useMemo, useRef, useState } from "react";
import { urlReproduccionJuego } from "../../config/api";
import { CATEGORIAS_JUEGOS, type Juego } from "../juegos/types";

interface Props {
  juegos: Juego[];
  cargando: boolean;
  error: string;
  exito: string;
  filtroEstado: string;
  setFiltroEstado: (f: string) => void;
  pendientesCount: number;
  actualizacionesPendientes: Juego[];
  revisarActualizacion: (id: number, decision: "aprobar" | "rechazar", motivo?: string) => Promise<void>;
  juegoPrevisualizando: Juego | null;
  setJuegoPrevisualizando: (j: Juego | null) => void;
  cambiarEstado: (id: number, nuevoEstado: "aprobado" | "rechazado", motivo?: string) => Promise<void>;
  eliminarJuego: (id: number) => Promise<void>;
  rol?: string;
}

export default function TabJuegos({
  juegos,
  cargando,
  error,
  exito,
  filtroEstado,
  setFiltroEstado,
  pendientesCount,
  actualizacionesPendientes,
  revisarActualizacion,
  juegoPrevisualizando,
  setJuegoPrevisualizando,
  cambiarEstado,
  eliminarJuego,
  rol,
}: Props) {
  const [motivoRechazoId, setMotivoRechazoId] = useState<number | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [rechazoActualizacionId, setRechazoActualizacionId] = useState<number | null>(null);
  const [motivoActualizacion, setMotivoActualizacion] = useState("");
  const [revisionColapsada, setRevisionColapsada] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const pantallaPreviewRef = useRef<HTMLDivElement>(null);
  const iframePreviewRef = useRef<HTMLIFrameElement>(null);
  const [esPantallaCompletaPreview, setEsPantallaCompletaPreview] = useState(false);
  const [mostrarBotonSalirPreview, setMostrarBotonSalirPreview] = useState(false);
  const timerOcultarPreviewRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimerOcultarPreview = () => {
    if (timerOcultarPreviewRef.current) clearTimeout(timerOcultarPreviewRef.current);
    setMostrarBotonSalirPreview(true);
    timerOcultarPreviewRef.current = setTimeout(() => {
      setMostrarBotonSalirPreview(false);
    }, 2600);
  };

  const togglePantallaCompletaPreview = () => {
    const objetivo = pantallaPreviewRef.current;
    if (!objetivo) return;

    if (!document.fullscreenElement) {
      objetivo.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const reiniciarPreview = () => {
    if (iframePreviewRef.current) {
      const srcActual = iframePreviewRef.current.src;
      iframePreviewRef.current.src = "";
      setTimeout(() => {
        if (iframePreviewRef.current) iframePreviewRef.current.src = srcActual;
      }, 100);
    }
  };

  useEffect(() => {
    if (!juegoPrevisualizando) return;

    const alCambiarFullscreen = () => {
      const activo = Boolean(document.fullscreenElement);
      setEsPantallaCompletaPreview(activo);
      if (activo) {
        resetTimerOcultarPreview();
      } else {
        if (timerOcultarPreviewRef.current) clearTimeout(timerOcultarPreviewRef.current);
        setMostrarBotonSalirPreview(false);
      }
    };
    document.addEventListener("fullscreenchange", alCambiarFullscreen);

    const alMoverMouse = () => {
      if (document.fullscreenElement) {
        resetTimerOcultarPreview();
      }
    };
    window.addEventListener("mousemove", alMoverMouse);

    return () => {
      document.removeEventListener("fullscreenchange", alCambiarFullscreen);
      window.removeEventListener("mousemove", alMoverMouse);
      if (timerOcultarPreviewRef.current) clearTimeout(timerOcultarPreviewRef.current);
    };
  }, [juegoPrevisualizando]);

  const handleRechazarConMotivo = async (id: number) => {
    if (!motivoTexto.trim()) {
      alert("Por favor indica la razón para rechazar el juego.");
      return;
    }
    await cambiarEstado(id, "rechazado", motivoTexto);
    setMotivoRechazoId(null);
    setMotivoTexto("");
  };

  const juegosFiltrados = useMemo(() => {
    return juegos.filter((j) => {
      if (filtroCategoria !== "Todas" && j.categoria !== filtroCategoria) {
        return false;
      }
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim();
        const coincideTitulo = j.titulo.toLowerCase().includes(term);
        const coincideAutor = j.autor_nombre.toLowerCase().includes(term);
        const coincideDoc = j.autor_documento.toLowerCase().includes(term);
        const coincideGrado = (j.autor_grado || "").toLowerCase().includes(term);
        const coincideDesc = (j.descripcion || "").toLowerCase().includes(term);
        return coincideTitulo || coincideAutor || coincideDoc || coincideGrado || coincideDesc;
      }
      return true;
    });
  }, [juegos, busqueda, filtroCategoria]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCategoria("Todas");
  };

  return (
    <section className="tab-juegos">
      <div className="tab-cabecera">
        <div>
          <h2>🎮 Moderación de Videojuegos Educativos</h2>
          <p className="subtitulo">
            Revisa, prueba y autoriza los juegos enviados por los estudiantes antes de que sean visibles en el Arcade público.
          </p>
        </div>
      </div>

      {error && <p className="estado error" role="alert">⚠️ {error}</p>}
      {exito && <p className="estado exito" role="status">✅ {exito}</p>}

      {actualizacionesPendientes.length > 0 && (
        <div className="admin-actualizaciones">
          <button
            type="button"
            className="admin-actualizaciones-titulo"
            onClick={() => setRevisionColapsada((v) => !v)}
            aria-expanded={!revisionColapsada}
          >
            <span>🔄 Actualizaciones propuestas por estudiantes ({actualizacionesPendientes.length})</span>
            <span>{revisionColapsada ? "▼" : "▲"}</span>
          </button>

          {!revisionColapsada && (
            <div className="admin-actualizaciones-lista">
              {actualizacionesPendientes.map((j) => {
                const prop = j.actualizacion_pendiente;
                return (
                  <article key={j.id} className="tarjeta-revision-actualizacion">
                    <div className="revision-actualizacion-cabecera">
                      <h4>🔄 {j.titulo}</h4>
                      <span className="badge-estado estado-aprobado">
                        Actual v{j.version || "1.0"} → propuesta v{prop?.version || "?"}
                      </span>
                    </div>

                    <div className="revision-actualizacion-autor">
                      Propone: <strong>{j.autor_nombre}</strong> (Doc: {j.autor_documento})
                      {j.autor_grado ? ` · ${j.autor_grado}` : ""}
                    </div>

                    <div className="revision-actualizacion-datos">
                      <p>
                        <strong>Qué cambia ({prop?.version || "nueva"}):</strong>
                      </p>
                      <blockquote>
                        {prop?.novedades || "El autor no escribió novedades."}
                      </blockquote>
                      {prop?.url_recurso && (
                        <p className="revision-actualizacion-url">
                          <strong>Nuevo enlace:</strong> <a href={prop.url_recurso} target="_blank" rel="noreferrer">{prop.url_recurso}</a>
                        </p>
                      )}
                      {prop?.dispositivo && (
                        <p className="revision-actualizacion-url">
                          <strong>Dispositivo:</strong>{" "}
                          {prop.dispositivo === "pc" ? "🖥️ Solo PC" : prop.dispositivo === "movil" ? "📱 Solo Celular" : "🖥️📱 PC y Celular"}
                        </p>
                      )}
                      <p className="revision-actualizacion-fecha">
                        Solicitada: {new Date(prop?.solicitado_en || "").toLocaleString("es-CO")}
                      </p>
                    </div>

                    <div className="revision-actualizacion-acciones">
                      {rechazoActualizacionId !== j.id ? (
                        <>
                          <button
                            type="button"
                            className="boton boton-primario boton-chico"
                            onClick={() => revisarActualizacion(j.id, "aprobar")}
                          >
                            ✅ Aprobar y publicar actualización
                          </button>
                          <button
                            type="button"
                            className="boton boton-secundario boton-chico"
                            onClick={() => {
                              setRechazoActualizacionId(j.id);
                              setMotivoActualizacion("");
                            }}
                          >
                            ❌ Rechazar
                          </button>
                          <button
                            type="button"
                            className="boton boton-secundario boton-chico"
                            onClick={() => setJuegoPrevisualizando(j)}
                          >
                            ▶ Probar nueva versión
                          </button>
                        </>
                      ) : (
                        <div className="caja-motivo-rechazo">
                          <label>
                            Indica la razón para rechazar la actualización:
                            <input
                              type="text"
                              value={motivoActualizacion}
                              onChange={(e) => setMotivoActualizacion(e.target.value)}
                              placeholder="Ej: el juego presenta errores o el tema no cumple el PAE"
                            />
                          </label>
                          <div className="acciones-fila">
                            <button
                              type="button"
                              className="boton boton-peligro boton-chico"
                              onClick={() => {
                                if (!motivoActualizacion.trim()) {
                                  alert("Escribe la razón para rechazar la actualización.");
                                  return;
                                }
                                revisarActualizacion(j.id, "rechazar", motivoActualizacion.trim());
                                setRechazoActualizacionId(null);
                                setMotivoActualizacion("");
                              }}
                            >
                              Confirmar Rechazo
                            </button>
                            <button
                              type="button"
                              className="boton boton-secundario boton-chico"
                              onClick={() => setRechazoActualizacionId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="admin-filtros-juegos-barra">
        <div className="admin-busqueda-juego">
          <span className="icono-busqueda">🔍</span>
          <input
            type="text"
            placeholder="Buscar por título, autor, grado o documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar juegos en el panel"
          />
          {busqueda && (
            <button
              type="button"
              className="boton-limpiar-busqueda"
              onClick={() => setBusqueda("")}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className="admin-select-categoria">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
          >
            {CATEGORIAS_JUEGOS.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "Todas" ? "Todas las categorías" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-filtros-chips">
        <button
          type="button"
          className={`chip ${filtroEstado === "pendiente" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("pendiente")}
        >
          ⏳ Pendientes de revisión {pendientesCount > 0 && `(${pendientesCount})`}
        </button>
        <button
          type="button"
          className={`chip ${filtroEstado === "aprobado" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("aprobado")}
        >
          ✅ Publicados
        </button>
        <button
          type="button"
          className={`chip ${filtroEstado === "rechazado" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("rechazado")}
        >
          ❌ Rechazados
        </button>
        <button
          type="button"
          className={`chip ${filtroEstado === "todos" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("todos")}
        >
          📁 Todos
        </button>
      </div>

      {cargando ? (
        <p className="estado">Cargando lista de juegos...</p>
      ) : juegosFiltrados.length === 0 ? (
        <div className="admin-vacio-juegos">
          <p className="estado">
            No se encontraron juegos{" "}
            {busqueda || filtroCategoria !== "Todas"
              ? "que coincidan con los criterios de búsqueda o categoría."
              : filtroEstado !== "todos"
              ? `con estado "${filtroEstado}".`
              : "registrados en el sistema."}
          </p>
          {(busqueda || filtroCategoria !== "Todas") && (
            <button type="button" className="boton boton-secundario boton-chico" onClick={limpiarFiltros}>
              🔄 Limpiar filtros de búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="lista-tarjetas-admin">
          {juegosFiltrados.map((j) => (
            <article key={j.id} className="tarjeta-admin-juego">
              <div className="tarjeta-admin-miniatura">
                <img
                  src={j.portada_url || "/placeholder-juego.svg"}
                  alt={j.titulo}
                />
                <span className={`badge-estado estado-${j.estado}`}>
                  {j.estado === "aprobado" ? "Publicado" : j.estado === "pendiente" ? "Pendiente" : "Rechazado"}
                </span>
              </div>

              <div className="tarjeta-admin-info">
                <h3>{j.titulo}</h3>
                <span className="badge-categoria-inline">{j.categoria}</span> · <span className="tipo-recurso">Formato: {j.tipo}</span>
                
                <p className="tarjeta-admin-desc">
                  {j.descripcion || "Sin descripción proporcionada."}
                </p>

                <div className="tarjeta-admin-meta">
                  <span>
                    👤 Creado por: <strong>{j.autor_nombre}</strong> (Doc: {j.autor_documento}
                    {j.autor_grado ? `, Grado: ${j.autor_grado}` : ""})
                  </span>
                  <span>🔥 Partidas: {j.vistas}</span>
                  {j.motivo_rechazo && (
                    <span className="motivo-rechazo-alerta">
                      ⚠️ Motivo rechazo: {j.motivo_rechazo}
                    </span>
                  )}
                </div>

                {motivoRechazoId === j.id && (
                  <div className="caja-motivo-rechazo">
                    <label>
                      Indica el motivo del rechazo al estudiante:
                      <input
                        type="text"
                        value={motivoTexto}
                        onChange={(e) => setMotivoTexto(e.target.value)}
                        placeholder="Ej: El enlace no funciona o el tema no se relaciona al PAE"
                      />
                    </label>
                    <div className="acciones-fila">
                      <button
                        type="button"
                        className="boton boton-peligro boton-chico"
                        onClick={() => handleRechazarConMotivo(j.id)}
                      >
                        Confirmar Rechazo
                      </button>
                      <button
                        type="button"
                        className="boton boton-secundario boton-chico"
                        onClick={() => setMotivoRechazoId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="tarjeta-admin-acciones">
                  <button
                    type="button"
                    className="boton boton-secundario boton-chico"
                    onClick={() => setJuegoPrevisualizando(j)}
                  >
                    ▶ Probar juego
                  </button>

                  {j.estado !== "aprobado" && (
                    <button
                      type="button"
                      className="boton boton-primario boton-chico"
                      onClick={() => cambiarEstado(j.id, "aprobado")}
                    >
                      ✅ Aprobar y Publicar
                    </button>
                  )}

                  {j.estado === "pendiente" && motivoRechazoId !== j.id && (
                    <button
                      type="button"
                      className="boton boton-secundario boton-chico"
                      onClick={() => {
                        setMotivoRechazoId(j.id);
                        setMotivoTexto("");
                      }}
                    >
                      ❌ Rechazar
                    </button>
                  )}

                  {rol === "admin" && (
                    <button
                      type="button"
                      className="boton boton-peligro boton-chico"
                      onClick={() => eliminarJuego(j.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {juegoPrevisualizando && (
        <div className="modal-fondo" onClick={() => setJuegoPrevisualizando(null)}>
          <div className="modal-caja modal-preview-juego" onClick={(e) => e.stopPropagation()}>
            <div className="modal-encabezado">
              <h3>🕹️ Probando: {juegoPrevisualizando.titulo}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="boton-icono"
                  onClick={reiniciarPreview}
                  title="Reiniciar juego"
                  aria-label="Reiniciar juego"
                >
                  🔄
                </button>
                <button
                  type="button"
                  className="boton-icono"
                  onClick={togglePantallaCompletaPreview}
                  title={esPantallaCompletaPreview ? "Salir de pantalla completa" : "Pantalla completa (solo el juego)"}
                  aria-label="Pantalla completa"
                >
                  {esPantallaCompletaPreview ? "🗗" : "⛶"}
                </button>
                <button
                  type="button"
                  className="modal-boton-cerrar"
                  onClick={() => setJuegoPrevisualizando(null)}
                  title="Cerrar prueba (Esc)"
                  aria-label="Cerrar prueba"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="preview-iframe-wrapper" ref={pantallaPreviewRef}>
              <iframe
                ref={iframePreviewRef}
                src={urlReproduccionJuego(
                  juegoPrevisualizando.actualizacion_pendiente?.url_recurso ||
                  juegoPrevisualizando.url_recurso
                )}
                title={juegoPrevisualizando.titulo}
                className="preview-iframe"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                allow="fullscreen; autoplay; gamepad"
              />

              {esPantallaCompletaPreview && (
                <>
                  <div
                    className="fullscreen-trigger-zona"
                    onMouseEnter={resetTimerOcultarPreview}
                    aria-hidden="true"
                  />
                  <div
                    className={`fullscreen-alerta-salir ${mostrarBotonSalirPreview ? "visible" : ""}`}
                    onMouseEnter={() => {
                      if (timerOcultarPreviewRef.current) clearTimeout(timerOcultarPreviewRef.current);
                      setMostrarBotonSalirPreview(true);
                    }}
                    onMouseLeave={resetTimerOcultarPreview}
                  >
                    <button
                      type="button"
                      className="boton-salir-fullscreen-pildora"
                      onClick={togglePantallaCompletaPreview}
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
            {juegoPrevisualizando.actualizacion_pendiente?.estado === "pendiente" && (
              <div className="preview-actualizacion-aviso">
                <p>
                  💡 Este es el <strong>nuevo enlace</strong> propuesto por el autor (v
                  {juegoPrevisualizando.actualizacion_pendiente.version}). Si es correcto, aprueba la
                  actualización.
                </p>
              </div>
            )}
            <div className="modal-acciones">
              {juegoPrevisualizando.estado !== "aprobado" && (
                <button
                  type="button"
                  className="boton boton-primario"
                  onClick={() => cambiarEstado(juegoPrevisualizando.id, "aprobado")}
                >
                  ✅ Aprobar y Publicar Ahora
                </button>
              )}
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => setJuegoPrevisualizando(null)}
              >
                Cerrar Prueba
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
