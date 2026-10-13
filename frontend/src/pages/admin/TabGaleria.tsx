import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import type { FotoGaleria } from "./types";

interface Props {
  galeria: FotoGaleria[];
  tituloGaleria: string;
  setTituloGaleria: (v: string) => void;
  descripcionGaleria: string;
  setDescripcionGaleria: (v: string) => void;
  imagenGaleria: string;
  setImagenGaleria: (v: string) => void;
  galeriaError: string;
  galeriaExito: string;
  publicarFotoGaleria: (e: React.FormEvent) => Promise<void>;
  borrarFotoGaleria: (id: number) => Promise<void>;
  subirImagen: (archivo: File, setter: (url: string) => void) => Promise<string>;
}

export default function TabGaleria({
  galeria, tituloGaleria, setTituloGaleria, descripcionGaleria,
  setDescripcionGaleria, imagenGaleria, setImagenGaleria,
  galeriaError, galeriaExito,
  publicarFotoGaleria, borrarFotoGaleria, subirImagen,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [subiendoImagenGaleria, setSubiendoImagenGaleria] = useState(false);

  const subirFotoGaleria = async (archivo: File) => {
    setSubiendoImagenGaleria(true);
    try {
      await subirImagen(archivo, setImagenGaleria);
    } finally {
      setSubiendoImagenGaleria(false);
    }
  };

  return (
    <div id="panel-galeria" role="tabpanel" aria-labelledby="tab-galeria">
      <h2 className="admin-subtitulo">Publicar foto en la galería</h2>
      <p className="subtitulo">Estas fotos aparecen en la página de inicio junto con las de los platos y los avisos. Súbele el título y elige la imagen.</p>
      <form className="formulario" onSubmit={publicarFotoGaleria}>
        <label>Título<input type="text" value={tituloGaleria} onChange={(e) => setTituloGaleria(e.target.value)} required placeholder="Ej: Entrega de minutas, jornada deportiva" /></label>
        <label>Descripción<textarea value={descripcionGaleria} onChange={(e) => setDescripcionGaleria(e.target.value)} rows={3} placeholder="Ej: Estudiantes disfrutando el refrigerio de la semana" /></label>
        <label>Imagen<input type="file" accept="image/*" onChange={async (e) => { const a = e.target.files?.[0]; if (!a) return; await subirFotoGaleria(a); }} required />{subiendoImagenGaleria && <small className="campo-fijo">Subiendo imagen…</small>}{imagenGaleria && <small className="campo-fijo">✅ Imagen lista para publicar.</small>}</label>
        {galeriaError && <p className="estado error" role="alert">⚠️ {galeriaError}</p>}
        {galeriaExito && <p className="estado exito" aria-live="polite">{galeriaExito}</p>}
        <button type="submit" className="boton boton-primario" disabled={subiendoImagenGaleria}>Publicar foto</button>
      </form>
      <h2 className="admin-subtitulo">Fotos publicadas ({galeria.length})</h2>
      {galeria.length === 0 && <p className="estado">Aún no hay fotos en la galería.</p>}
      <Buscador valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar por título…" />
      <div className="galeria-admin">
        {galeria
          .filter((foto) => { if (!busqueda.trim()) return true; return coincide(foto.titulo, busqueda) || coincide(foto.descripcion || "", busqueda); })
          .map((foto) => (
          <article key={foto.id} className="fila-galeria-admin">
            <img src={foto.imagen} alt={foto.titulo} />
            <div className="fila-galeria-info">
              <strong>{foto.titulo}</strong>
              {foto.descripcion && <small>{foto.descripcion}</small>}
              <button type="button" className="boton boton-secundario" onClick={() => borrarFotoGaleria(foto.id)} aria-label={`Borrar foto ${foto.titulo}`}>Borrar</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
