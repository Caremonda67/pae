import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import type { MenuSemanaAdmin } from "./types";

interface Props {
  menu: MenuSemanaAdmin[];
  semanaMenu: number;
  setSemanaMenu: (v: number) => void;
  diaMenu: string;
  setDiaMenu: (v: string) => void;
  jornadaMenu: string;
  setJornadaMenu: (v: string) => void;
  platilloMenu: string;
  setPlatilloMenu: (v: string) => void;
  descripcionMenu: string;
  setDescripcionMenu: (v: string) => void;
  caloriasMenu: string;
  setCaloriasMenu: (v: string) => void;
  imagenMenu: string;
  setImagenMenu: (v: string) => void;
  publicarMenuAhora: boolean;
  setPublicarMenuAhora: (v: boolean) => void;
  menuError: string;
  menuExito: string;
  registrarMenu: (e: React.FormEvent) => Promise<void>;
  cambiarEstadoPlato: (id: number, estado: string) => Promise<void>;
  borrarPlato: (id: number) => Promise<void>;
  subirImagen: (archivo: File, setter: (url: string) => void) => Promise<string>;
  setMenuError: (v: string) => void;
}

export default function TabMenu({
  menu, semanaMenu, setSemanaMenu, diaMenu, setDiaMenu,
  jornadaMenu, setJornadaMenu, platilloMenu, setPlatilloMenu,
  descripcionMenu, setDescripcionMenu, caloriasMenu, setCaloriasMenu,
  imagenMenu, setImagenMenu, publicarMenuAhora,
  setPublicarMenuAhora, menuError, menuExito, registrarMenu,
  cambiarEstadoPlato, borrarPlato, subirImagen, setMenuError,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [subiendoImagenMenu, setSubiendoImagenMenu] = useState(false);

  const subirFotoMenu = async (archivo: File) => {
    setSubiendoImagenMenu(true);
    try {
      await subirImagen(archivo, setImagenMenu);
    } finally {
      setSubiendoImagenMenu(false);
    }
  };

  return (
    <div id="panel-menu" role="tabpanel" aria-labelledby="tab-menu">
      <h2 className="admin-subtitulo">Agregar plato al menú</h2>
      <form className="formulario" onSubmit={registrarMenu}>
        <div className="formulario-fila">
          <label>Semana del mes<select value={semanaMenu} onChange={(e) => setSemanaMenu(Number(e.target.value))}><option value={1}>Semana 1</option><option value={2}>Semana 2</option><option value={3}>Semana 3</option><option value={4}>Semana 4</option></select></label>
          <label>Día<select value={diaMenu} onChange={(e) => setDiaMenu(e.target.value)}><option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option></select></label>
          <label>Jornada<select value={jornadaMenu} onChange={(e) => setJornadaMenu(e.target.value)}><option>Almuerzo</option><option>Refrigerio</option></select></label>
          <label>Calorías (opcional)<input type="number" value={caloriasMenu} onChange={(e) => setCaloriasMenu(e.target.value)} placeholder="Ej: 650" /></label>
        </div>
        <label>Platillo<input type="text" value={platilloMenu} onChange={(e) => setPlatilloMenu(e.target.value)} required placeholder="Ej: Arroz con pollo" /></label>
        <label>Descripción<textarea value={descripcionMenu} onChange={(e) => setDescripcionMenu(e.target.value)} required rows={3} placeholder="Describe los alimentos…" /></label>
        <label>Foto del plato (opcional)<input type="file" accept="image/*" onChange={async (e) => { const a = e.target.files?.[0]; if (!a) return; setMenuError(""); await subirFotoMenu(a); }} />{subiendoImagenMenu && <small className="campo-fijo">Subiendo imagen…</small>}{imagenMenu && <small className="campo-fijo">✅ Imagen lista para guardar.</small>}</label>
        <label className="fila-check"><input type="checkbox" checked={publicarMenuAhora} onChange={(e) => setPublicarMenuAhora(e.target.checked)} />Publicar de inmediato (si no, queda como borrador)</label>
        {menuError && <p className="estado error" role="alert">⚠️ {menuError}</p>}
        {menuExito && <p className="estado exito" aria-live="polite">{menuExito}</p>}
        <button type="submit" className="boton boton-primario" disabled={subiendoImagenMenu}>Guardar plato</button>
      </form>

      <h2 className="admin-subtitulo">Menú por semana</h2>
      {menu.length === 0 && <p className="estado">El menú está vacío. Agrega los platos de la semana.</p>}
      <Buscador valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar por comida, descripción, día, jornada…" />
      <div className="lista-reservas">
        {menu.map((semana) => (
          <div key={semana.semana} className="menu-semana-admin">
            <h3>Semana {semana.semana} del mes</h3>
            {semana.dias.map((dia) => {
              const platosFiltrados = dia.platos.filter((plato) => {
                if (!busqueda.trim()) return true;
                const texto = `${plato.platillo} ${plato.descripcion} ${plato.jornada || ""} ${plato.calorias || ""} ${dia.dia} semana ${semana.semana}`;
                return coincide(texto, busqueda);
              });
              if (platosFiltrados.length === 0) return null;
              return (
                <div key={dia.dia} className="menu-dia-admin">
                  <h4>{dia.dia}</h4>
                  {platosFiltrados.map((plato) => (
                    <article key={plato.id} className="fila-reserva">
                      <div className="fila-menu-contenido">
                        {plato.imagen && <img className="miniatura-menu" src={plato.imagen} alt={plato.platillo} />}
                        <div>
                          <strong>{plato.platillo}</strong>
                          {plato.estado === "borrador" && <span className="etiqueta-estado borrador">Borrador</span>}
                          <span className="fila-reserva-detalle">{plato.descripcion}{plato.calorias ? ` · ${plato.calorias} kcal` : ""}{plato.jornada ? ` · ${plato.jornada}` : ""}</span>
                        </div>
                      </div>
                      <button type="button" className="boton boton-secundario" onClick={() => borrarPlato(plato.id)} aria-label={`Borrar plato ${plato.platillo}`}>Borrar</button>
                      {plato.estado === "borrador" ? (
                        <button type="button" className="boton boton-primario" onClick={() => cambiarEstadoPlato(plato.id, "publicado")}>Publicar</button>
                      ) : (
                        <button type="button" className="boton boton-secundario" onClick={() => cambiarEstadoPlato(plato.id, "borrador")}>Despublicar</button>
                      )}
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
