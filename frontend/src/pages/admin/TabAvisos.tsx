import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import type { Aviso } from "./types";

interface Props {
  avisos: Aviso[];
  tituloAviso: string;
  setTituloAviso: (v: string) => void;
  textoAviso: string;
  setTextoAviso: (v: string) => void;
  fechaAviso: string;
  setFechaAviso: (v: string) => void;
  imagenAviso: string;
  setImagenAviso: (v: string) => void;
  publicarAvisoAhora: boolean;
  setPublicarAvisoAhora: (v: boolean) => void;
  avisoError: string;
  avisoExito: string;
  publicarAviso: (e: React.FormEvent) => Promise<void>;
  cambiarEstadoAviso: (id: number, estado: string) => Promise<void>;
  borrarAviso: (id: number) => Promise<void>;
  subirImagen: (archivo: File, setter: (url: string) => void) => Promise<string>;
}

export default function TabAvisos({
  avisos, tituloAviso, setTituloAviso, textoAviso, setTextoAviso,
  fechaAviso, setFechaAviso, imagenAviso, setImagenAviso,
  publicarAvisoAhora, setPublicarAvisoAhora,
  avisoError, avisoExito, publicarAviso, cambiarEstadoAviso,
  borrarAviso, subirImagen,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [subiendoImagenAviso, setSubiendoImagenAviso] = useState(false);

  const subirFotoAviso = async (archivo: File) => {
    setSubiendoImagenAviso(true);
    try {
      await subirImagen(archivo, setImagenAviso);
    } finally {
      setSubiendoImagenAviso(false);
    }
  };

  return (
    <div id="panel-avisos" role="tabpanel" aria-labelledby="tab-avisos">
      <h2 className="admin-subtitulo">Publicar aviso</h2>
      <form className="formulario" onSubmit={publicarAviso}>
        <label>Título<input type="text" value={tituloAviso} onChange={(e) => setTituloAviso(e.target.value)} required placeholder="Ej: Suspensión del servicio" /></label>
        <label>Texto<textarea value={textoAviso} onChange={(e) => setTextoAviso(e.target.value)} required rows={3} placeholder="Describe el aviso…" /></label>
        <label>Etiqueta (opcional)<input type="text" value={fechaAviso} onChange={(e) => setFechaAviso(e.target.value)} placeholder="Ej: Novedad, Recordatorio" /></label>
        <label>Imagen (opcional)<input type="file" accept="image/*" onChange={async (e) => { const a = e.target.files?.[0]; if (!a) return; await subirFotoAviso(a); }} />{subiendoImagenAviso && <small className="campo-fijo">Subiendo imagen…</small>}{imagenAviso && <small className="campo-fijo">✅ Imagen lista para publicar.</small>}</label>
        <label className="fila-check"><input type="checkbox" checked={publicarAvisoAhora} onChange={(e) => setPublicarAvisoAhora(e.target.checked)} />Publicar de inmediato (si no, queda como borrador)</label>
        {avisoError && <p className="estado error" role="alert">⚠️ {avisoError}</p>}
        {avisoExito && <p className="estado exito" aria-live="polite">{avisoExito}</p>}
        <button type="submit" className="boton boton-primario" disabled={subiendoImagenAviso}>Publicar aviso</button>
      </form>

      <h2 className="admin-subtitulo">Avisos del programa</h2>
      {avisos.length === 0 && <p className="estado">No hay avisos.</p>}
      <Buscador valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar por título o texto…" />
      <div className="lista-avisos-admin">
        {avisos
          .filter((aviso) => { if (!busqueda.trim()) return true; return coincide(`${aviso.titulo} ${aviso.texto} ${aviso.fecha || ""}`, busqueda); })
          .map((aviso) => (
          <article key={aviso.id} className="fila-aviso-admin">
            <div className="fila-menu-contenido">
              {aviso.imagen && <img className="miniatura-menu" src={aviso.imagen} alt={aviso.titulo} />}
              <div>
                <strong>{aviso.titulo}</strong>
                {aviso.estado === "borrador" && <span className="etiqueta-estado borrador">Borrador</span>}
                <span className="fila-reserva-detalle">{aviso.fecha ? `${aviso.fecha} · ` : ""}{aviso.texto}</span>
              </div>
            </div>
            {aviso.estado === "borrador" ? (
              <button type="button" className="boton boton-primario" onClick={() => cambiarEstadoAviso(aviso.id, "publicado")}>Publicar</button>
            ) : (
              <button type="button" className="boton boton-secundario" onClick={() => cambiarEstadoAviso(aviso.id, "borrador")}>Despublicar</button>
            )}
            <button type="button" className="boton boton-secundario" onClick={() => borrarAviso(aviso.id)} aria-label={`Borrar aviso ${aviso.titulo}`}>Borrar</button>
          </article>
        ))}
      </div>
    </div>
  );
}
