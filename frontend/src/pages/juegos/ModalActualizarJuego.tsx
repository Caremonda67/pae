import { useEffect, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { cabeceras, leerSesion } from "../../config/sesion";
import { DISPOSITIVOS_JUEGOS, type Juego } from "./types";

interface Props {
  juego: Juego;
  alCerrar: () => void;
  alActualizado: (juego: Juego) => void;
}

function leerArchivoBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(archivo);
  });
}

export default function ModalActualizarJuego({ juego, alCerrar, alActualizado }: Props) {
  const sesion = leerSesion();
  const esAdmin = sesion?.rol === "admin";
  const [tipo, setTipo] = useState<"scratch" | "html_archivo">(
    juego.tipo === "html_archivo" ? "html_archivo" : "scratch"
  );
  const [modoEntrega, setModoEntrega] = useState<"archivo" | "enlace">("enlace");
  const [archivoJuego, setArchivoJuego] = useState<{ nombre: string; url: string } | null>(null);
  const [urlRecurso, setUrlRecurso] = useState(juego.url_recurso.replace(/\/embed$/, ""));
  const [dispositivo, setDispositivo] = useState<string>(juego.dispositivo || "ambos");
  const [version, setVersion] = useState(calcularSiguienteVersion(juego.version));
  const [novedades, setNovedades] = useState("");
  const [subiendoJuego, setSubiendoJuego] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const inputHtmlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (juego) {
      setTipo(juego.tipo === "html_archivo" ? "html_archivo" : "scratch");
      setUrlRecurso(juego.url_recurso.replace(/\/embed$/, ""));
      setDispositivo(juego.dispositivo || "ambos");
      setVersion(calcularSiguienteVersion(juego.version));
      setModoEntrega(juego.tipo === "html_archivo" ? "archivo" : "enlace");
    }
  }, [juego]);

  // Cierra con Escape y bloquea scroll
  useEffect(() => {
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
  }, [alCerrar]);

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

  const cambiarTipo = (nuevo: "scratch" | "html_archivo") => {
    setTipo(nuevo);
    if (nuevo === "scratch") setModoEntrega("enlace");
    if (nuevo === "html_archivo") setModoEntrega("enlace");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (!novedades.trim()) {
      setError("Describe qué mejoras o cambios incluye esta nueva versión.");
      return;
    }

    let urlFinal = urlRecurso.trim();
    if (tipo === "html_archivo" && modoEntrega === "archivo") {
      urlFinal = archivoJuego?.url || "";
      if (!urlFinal) {
        setError("Sube el nuevo archivo .html o cambia a la opción de enlace.");
        return;
      }
    } else if (!urlFinal) {
      setError("Ingresa la URL del nuevo juego o sube su archivo.");
      return;
    }

    setEnviando(true);
    try {
      const payload: Record<string, unknown> = {
        tipo,
        dispositivo,
        version,
        novedades: novedades.trim(),
      };
      if (urlFinal) payload.url_recurso = urlFinal;

      const resp = await fetch(`${API_URL}/api/juegos/${juego.id}/actualizar`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "No se pudo solicitar la actualización");
      }

      setExito("¡Actualización enviada! El administrador la revisará.");
      alActualizado(data);
      setTimeout(() => {
        alCerrar();
      }, 1600);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al solicitar la actualización");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-fondo" onClick={alCerrar} role="dialog" aria-modal="true" aria-labelledby="modal-actualizar-titulo">
      <div className="modal-caja modal-juego" onClick={(e) => e.stopPropagation()}>
        <div className="modal-encabezado">
          <div>
            <span className="arcade-tag modal-juego-tag">🔄 Nueva versión</span>
            <h2 id="modal-actualizar-titulo">Actualizar: {juego.titulo}</h2>
          </div>
          <button type="button" className="modal-boton-cerrar" onClick={alCerrar} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <p className="subtitulo">
          {esAdmin
            ? "Actualiza este videojuego. Como administrador, los cambios y las novedades se aplicarán directamente a la versión pública."
            : "Propones una nueva versión de tu juego. El administrador la revisará antes de reemplazar la versión publicada, y los estudiantes podrán ver en qué cambió."}
        </p>

        {error && <p className="estado error" role="alert">⚠️ {error}</p>}
        {exito && <p className="estado exito" role="status">✅ {exito}</p>}

        <form onSubmit={handleSubmit} className="formulario-juego">
          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">1</span> Versión y formato
            </h3>
            <div className="formulario-fila">
              <label>
                Nueva versión *
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="Ej: 2.0"
                  maxLength={20}
                  required
                />
              </label>
              <label>
                ¿Para qué dispositivos?
                <select value={dispositivo} onChange={(e) => setDispositivo(e.target.value)}>
                  {DISPOSITIVOS_JUEGOS.map((d) => (
                    <option key={d.valor} value={d.valor}>
                      {d.icono} {d.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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
                <span className="formato-juego-desc">Sube el nuevo archivo .html o pega un enlace</span>
              </button>
            </div>
          </section>

          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">2</span> El juego en esta versión
            </h3>

            {tipo === "scratch" ? (
              <label>
                Enlace de Scratch o ID numérico
                <input
                  type="text"
                  value={urlRecurso}
                  onChange={(e) => setUrlRecurso(e.target.value)}
                  placeholder="Ej: https://scratch.mit.edu/projects/12345678/ o solo 12345678"
                />
                <small className="campo-ayuda">
                  💡 Déjalo igual si sigues usando el mismo proyecto.
                </small>
              </label>
            ) : (
              <>
                <div className="modo-entrega-juego" role="radiogroup" aria-label="Cómo entregar la nueva versión">
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
                          <strong>Haz clic para elegir el nuevo archivo .html</strong>
                          <small>Tu juego debe ser un solo archivo HTML con CSS y código incluidos. Máx. 2 MB.</small>
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
                    URL o enlace web del juego
                    <input
                      type="text"
                      value={urlRecurso}
                      onChange={(e) => setUrlRecurso(e.target.value)}
                      placeholder="https://... / nueva_url_o_misma"
                    />
                    <small className="campo-ayuda">
                      💡 Déjalo igual si la URL no cambió en esta versión.
                    </small>
                  </label>
                )}
              </>
            )}
          </section>

          <section className="formulario-seccion">
            <h3 className="formulario-seccion-titulo">
              <span className="formulario-seccion-num">3</span> ¿Qué cambió?
            </h3>
            <label>
              Novedades de esta versión (las verán los estudiantes) *
              <textarea
                value={novedades}
                onChange={(e) => setNovedades(e.target.value)}
                placeholder="Ej: Agregué 3 nuevos niveles, mejor sonido y corregí la caída al pasar el nivel 5..."
                rows={3}
                maxLength={800}
                required
              />
            </label>
          </section>

          <div className="modal-acciones">
            <button type="button" className="boton boton-secundario" onClick={alCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-primario" disabled={enviando || subiendoJuego}>
              {enviando
                ? "Guardando..."
                : esAdmin
                ? "🚀 Guardar y publicar actualización"
                : "🚀 Enviar actualización para revisión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function calcularSiguienteVersion(actual?: string | null): string {
  if (!actual) return "2.0";
  const [mayor, menor] = String(actual).split(".").map((p) => parseInt(p, 10));
  const baseMayor = Number.isFinite(mayor) ? mayor : 1;
  // si el formato es "X.Y", subimos la versión menor (1.1 -> 1.2)
  if (Number.isFinite(menor)) return `${baseMayor}.${menor + 1}`;
  return `${baseMayor + 1}.0`;
}