import { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config/api";
import { cabeceras, leerSesion } from "../../config/sesion";
import { CATEGORIAS_JUEGOS, DISPOSITIVOS_JUEGOS, type Juego } from "./types";

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  alJuegoCreado: (nuevo: Juego) => void;
}

const CATEGORIAS_FORMULARIO = CATEGORIAS_JUEGOS.filter((c) => c !== "Todas");

function leerArchivoBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(archivo);
  });
}

export default function ModalSubirJuego({ abierto, alCerrar, alJuegoCreado }: Props) {
  const sesion = leerSesion();
  const esPersonalPAE = sesion?.rol === "admin" || sesion?.rol === "coordinador";
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_FORMULARIO[0]);
  const [tipo, setTipo] = useState<"scratch" | "html_archivo">("scratch");
  const [dispositivo, setDispositivo] = useState<"pc" | "movil" | "ambos">("ambos");
  const [modoEntrega, setModoEntrega] = useState<"archivo" | "enlace">("archivo");
  const [archivoJuego, setArchivoJuego] = useState<{ nombre: string; url: string } | null>(null);
  const [urlRecurso, setUrlRecurso] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [portadaUrl, setPortadaUrl] = useState("");

  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [subiendoJuego, setSubiendoJuego] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const inputHtmlRef = useRef<HTMLInputElement>(null);
  const inputPortadaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const handleSubirArchivoJuego = async (archivo: File) => {
    setSubiendoJuego(true);
    setError("");
    try {
      const base64 = await leerArchivoBase64(archivo);
      const resp = await fetch(`${API_URL}/api/archivos/subir-juego`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ base64, nombre: archivo.name }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Error al subir el archivo del juego");
      }
      setArchivoJuego({ nombre: archivo.name, url: data.url });
    } catch (err: any) {
      setError(err.message || "No se pudo subir el archivo del juego");
    } finally {
      setSubiendoJuego(false);
    }
  };

  const handleSubirArchivoPortada = async (archivo: File) => {
    setSubiendoPortada(true);
    setError("");
    try {
      const base64 = await leerArchivoBase64(archivo);
      const resp = await fetch(`${API_URL}/api/archivos/subir`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ base64, nombre: archivo.name }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Error al subir la imagen");
      }
      setPortadaUrl(data.url);
    } catch (err: any) {
      setError(err.message || "No se pudo subir la imagen de portada");
    } finally {
      setSubiendoPortada(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (!titulo.trim() || titulo.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres.");
      return;
    }

    let urlFinal = urlRecurso.trim();
    if (tipo === "html_archivo" && modoEntrega === "archivo") {
      urlFinal = archivoJuego?.url || "";
      if (!urlFinal) {
        setError("Sube el archivo .html de tu juego o usa la opción de enlace.");
        return;
      }
    } else if (!urlFinal) {
      setError(
        tipo === "scratch"
          ? "Ingresa el enlace de tu proyecto Scratch o su ID numérico."
          : "Ingresa la URL de tu juego o sube su archivo."
      );
      return;
    }

    setEnviando(true);
    try {
      const resp = await fetch(`${API_URL}/api/juegos`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({
          titulo,
          categoria,
          tipo,
          dispositivo,
          url_recurso: urlFinal,
          descripcion,
          instrucciones,
          portada_url: portadaUrl,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "No se pudo enviar el juego");
      }

      setExito(
        esPersonalPAE
          ? "¡Juego oficial publicado con éxito en el Arcade!"
          : "¡Juego enviado con éxito! El coordinador o administrador lo revisará para publicarlo."
      );
      alJuegoCreado(data);
      setTimeout(() => {
        alCerrar();
        setExito("");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al enviar el juego");
    } finally {
      setEnviando(false);
    }
  };

  const cambiarTipo = (nuevo: "scratch" | "html_archivo") => {
    setTipo(nuevo);
    if (nuevo === "scratch") setModoEntrega("enlace");
    if (nuevo === "html_archivo") setModoEntrega(archivoJuego ? "archivo" : "enlace");
  };

  return (
    <div className="modal-fondo" onClick={alCerrar} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <div className="modal-caja modal-juego" onClick={(e) => e.stopPropagation()}>
        <div className="modal-encabezado">
          <div>
            <span className="arcade-tag modal-juego-tag">
              {esPersonalPAE ? "🏛️ Publicación Oficial" : "🚀 Publica tu creación"}
            </span>
            <h2 id="modal-titulo">
              {esPersonalPAE ? "Publicar videojuego educativo (Equipo PAE)" : "Enviar mi videojuego educativo"}
            </h2>
          </div>
          <button type="button" className="modal-boton-cerrar" onClick={alCerrar} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <p className="subtitulo">
          {esPersonalPAE
            ? "Publica un juego oficial del PAE para la comunidad escolar. Como personal institucional, se publicará directamente sin moderación previa."
            : "Comparte tu juego con todos los estudiantes del PAE. Un coordinador o profesor lo revisará antes de que aparezca en el catálogo."}
        </p>

        {error && <p className="estado error" role="alert">⚠️ {error}</p>}
        {exito && <p className="estado exito" role="status">✅ {exito}</p>}

        <form onSubmit={handleSubmit} className="formulario-juego">
          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">1</span> Datos del juego
            </h3>
            <div className="formulario-fila">
              <label>
                Título del juego *
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Misión Cero Desperdicio"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Categoría
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {CATEGORIAS_FORMULARIO.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">2</span> Formato del juego
            </h3>
            <div className="formato-juego-opciones" role="radiogroup" aria-label="Formato del juego">
              <button
                type="button"
                className={`formato-juego-tarjeta ${tipo === "scratch" ? "seleccionada" : ""}`}
                onClick={() => cambiarTipo("scratch")}
                role="radio"
                aria-checked={tipo === "scratch"}
              >
                <span className="formato-juego-icono">🧩</span>
                <span className="formato-juego-nombre">Scratch / TurboWarp</span>
                <span className="formato-juego-desc">Juego hecho en Scratch (enlace)</span>
              </button>
              <button
                type="button"
                className={`formato-juego-tarjeta ${tipo === "html_archivo" ? "seleccionada" : ""}`}
                onClick={() => cambiarTipo("html_archivo")}
                role="radio"
                aria-checked={tipo === "html_archivo"}
              >
                <span className="formato-juego-icono">🌐</span>
                <span className="formato-juego-nombre">Juego Web (HTML)</span>
                <span className="formato-juego-desc">Sube tu archivo .html o pega un enlace</span>
              </button>
            </div>
          </section>

          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">3</span> El juego
            </h3>

            {tipo === "scratch" ? (
              <label>
                Enlace de Scratch o ID numérico *
                <input
                  type="text"
                  value={urlRecurso}
                  onChange={(e) => setUrlRecurso(e.target.value)}
                  placeholder="Ej: https://scratch.mit.edu/projects/12345678/ o solo 12345678"
                  required
                />
                <small className="campo-ayuda">
                  💡 En Scratch: haz clic en <strong>Compartir</strong> en tu proyecto y copia la dirección del navegador.
                </small>
              </label>
            ) : (
              <>
                <div className="modo-entrega-juego" role="radiogroup" aria-label="Cómo entregar el juego">
                  <button
                    type="button"
                    className={`modo-entrega-pestana ${modoEntrega === "archivo" ? "seleccionada" : ""}`}
                    onClick={() => setModoEntrega("archivo")}
                    role="radio"
                    aria-checked={modoEntrega === "archivo"}
                  >
                    📁 Subir archivo .html
                  </button>
                  <button
                    type="button"
                    className={`modo-entrega-pestana ${modoEntrega === "enlace" ? "seleccionada" : ""}`}
                    onClick={() => setModoEntrega("enlace")}
                    role="radio"
                    aria-checked={modoEntrega === "enlace"}
                  >
                    🔗 Usar un enlace web
                  </button>
                </div>

                {modoEntrega === "archivo" ? (
                  <div className="dropzone-juego">
                    <input
                      ref={inputHtmlRef}
                      type="file"
                      accept=".html,.htm,text/html"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleSubirArchivoJuego(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      className="dropzone-juego-zona"
                      onClick={() => inputHtmlRef.current?.click()}
                      disabled={subiendoJuego}
                    >
                      {subiendoJuego ? (
                        <span className="dropzone-juego-cargando">
                          <span className="spinner" aria-hidden="true" /> Subiendo archivo...
                        </span>
                      ) : archivoJuego ? (
                        <span className="dropzone-juego-listo">
                          ✅ <strong>{archivoJuego.nombre}</strong> listo
                        </span>
                      ) : (
                        <span className="dropzone-juego-vacio">
                          <span className="dropzone-juego-icono">📄</span>
                          <strong>Haz clic para elegir tu archivo .html</strong>
                          <small>Tu juego debe ser un solo archivo HTML (CSS y código incluidos). Máx. 2 MB.</small>
                        </span>
                      )}
                    </button>
                    {archivoJuego && (
                      <button
                        type="button"
                        className="dropzone-juego-cambiar"
                        onClick={() => inputHtmlRef.current?.click()}
                      >
                        ↺ Cambiar archivo
                      </button>
                    )}
                  </div>
                ) : (
                  <label>
                    URL o enlace web del juego *
                    <input
                      type="text"
                      value={urlRecurso}
                      onChange={(e) => setUrlRecurso(e.target.value)}
                      placeholder="Ej: https://miservidor.com/juego/"
                      required
                    />
                    <small className="campo-ayuda">
                      💡 Debe ser un enlace público y seguro (HTTPS) que cargue en un navegador.
                    </small>
                  </label>
                )}
              </>
            )}

            <div className="formulario-fila">
              <label>
                ¿Para qué dispositivos?
                <select value={dispositivo} onChange={(e) => setDispositivo(e.target.value as any)}>
                  {DISPOSITIVOS_JUEGOS.map((d) => (
                    <option key={d.valor} value={d.valor}>
                      {d.icono} {d.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">4</span> Descripción y guía
            </h3>
            <label>
              ¿Qué enseña este juego sobre el PAE y la nutrición?
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explica brevemente el objetivo pedagógico o la historia de tu juego..."
                rows={2}
                maxLength={500}
              />
            </label>
            <label>
              Instrucciones de cómo jugar
              <textarea
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
                placeholder="Ej: Usa las flechas del teclado para moverte y la barra espaciadora para saltar..."
                rows={2}
                maxLength={500}
              />
            </label>
          </section>

          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">5</span> Imagen de portada
            </h3>
            <div className="subir-portada-propia">
              <input
                ref={inputPortadaRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSubirArchivoPortada(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              {portadaUrl ? (
                <div className="portada-preview">
                  <img src={portadaUrl} alt="Vista previa de la portada" />
                  <div className="portada-preview-acciones">
                    <button
                      type="button"
                      className="modal-boton-cerrar"
                      onClick={() => setPortadaUrl("")}
                      aria-label="Quitar portada"
                      title="Quitar portada"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      className="boton boton-secundario boton-chico"
                      onClick={() => inputPortadaRef.current?.click()}
                      disabled={subiendoPortada}
                    >
                      ↺ Cambiar portada
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="dropzone-portada"
                  onClick={() => inputPortadaRef.current?.click()}
                  disabled={subiendoPortada}
                >
                  {subiendoPortada ? (
                    <span className="dropzone-juego-cargando">
                      <span className="spinner" aria-hidden="true" /> Subiendo imagen...
                    </span>
                  ) : (
                    <>
                      <span className="dropzone-juego-icono">🖼️</span>
                      <span>
                        <strong>Sube una imagen de portada</strong>
                        <small>PNG, JPG o WebP. Se mostrará en la tarjeta del juego.</small>
                      </span>
                    </>
                  )}
                </button>
              )}
              <small className="campo-ayuda">
                💡 Si no subes imagen, se usará la portada predeterminada del PAE.
              </small>
            </div>
          </section>

          <div className="modal-acciones">
            <button type="button" className="boton boton-secundario" onClick={alCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button
              type="submit"
              className="boton boton-primario"
              disabled={enviando || subiendoPortada || subiendoJuego}
            >
              {enviando
                ? "Publicando juego..."
                : esPersonalPAE
                ? "🚀 Publicar juego directamente"
                : "🚀 Enviar para revisión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}