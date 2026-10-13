import { useState } from "react";
import ComboEstudiante from "./ComboEstudiante";
import type { Incidente } from "./types";

interface Props {
  rol: string;
  incidentesVisibles: Incidente[];
  incidenteCargando: boolean;
  incidenteError: string;
  incidenteExito: string;
  incidenteEstudiantes: { documento: string; nombre: string; grado?: string }[];
  incidenteDoc: string;
  setIncidenteDoc: (v: string) => void;
  incidenteTipo: string;
  setIncidenteTipo: (v: string) => void;
  incidenteDescripcion: string;
  setIncidenteDescripcion: (v: string) => void;
  incidenteFecha: string;
  setIncidenteFecha: (v: string) => void;
  incidenteImagen: string;
  setIncidenteImagen: (v: string) => void;
  incidenteEnviando: boolean;
  incidenteResolviendo: number | null;
  editandoIncidente: Incidente | null;
  setEditandoIncidente: (v: Incidente | null) => void;
  editIncidenteTipo: string;
  setEditIncidenteTipo: (v: string) => void;
  editIncidenteDoc: string;
  setEditIncidenteDoc: (v: string) => void;
  editIncidenteDescripcion: string;
  setEditIncidenteDescripcion: (v: string) => void;
  editIncidenteFecha: string;
  setEditIncidenteFecha: (v: string) => void;
  editIncidenteImagen: string;
  setEditIncidenteImagen: (v: string) => void;
  editIncidenteEnviando: boolean;
  incidentesFiltro: "todos" | "pendientes" | "resueltos";
  setIncidentesFiltro: (f: "todos" | "pendientes" | "resueltos") => void;
  incidentesDesde: string;
  setIncidentesDesde: (v: string) => void;
  incidentesHasta: string;
  setIncidentesHasta: (v: string) => void;
  incidentesBusqueda: string;
  setIncidentesBusqueda: (v: string) => void;
  reportarIncidente: (e: React.FormEvent) => Promise<void>;
  adjuntarFotoIncidente: (archivo: File, setter: (url: string) => void, setSubiendo: (b: boolean) => void) => Promise<void>;
  resolverIncidente: (id: number, resuelto: boolean) => Promise<void>;
  abrirEdicionIncidente: (inc: Incidente) => void;
  guardarIncidenteEditado: (e: React.FormEvent) => Promise<void>;
  borrarIncidente: (inc: Incidente) => Promise<void>;
}

function fechaCortaDia(fecha: string) {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}

export default function TabIncidentes(props: Props) {
  const {
    rol, incidentesVisibles, incidenteCargando, incidenteError, incidenteExito,
    incidenteEstudiantes, incidenteDoc, setIncidenteDoc, incidenteTipo,
    setIncidenteTipo, incidenteDescripcion, setIncidenteDescripcion,
    incidenteFecha, setIncidenteFecha, incidenteImagen, setIncidenteImagen,
    incidenteEnviando, incidenteResolviendo,
    editandoIncidente, setEditandoIncidente, editIncidenteTipo,
    setEditIncidenteTipo, editIncidenteDoc, setEditIncidenteDoc,
    editIncidenteDescripcion, setEditIncidenteDescripcion, editIncidenteFecha,
    setEditIncidenteFecha, editIncidenteImagen, setEditIncidenteImagen,
    editIncidenteEnviando, incidentesFiltro,
    setIncidentesFiltro, incidentesDesde, setIncidentesDesde, incidentesHasta,
    setIncidentesHasta, incidentesBusqueda, setIncidentesBusqueda,
    reportarIncidente, adjuntarFotoIncidente, resolverIncidente,
    abrirEdicionIncidente, guardarIncidenteEditado, borrarIncidente,
  } = props;

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoEditFoto, setSubiendoEditFoto] = useState(false);

  return (
    <div id="panel-incidentes" role="tabpanel" aria-labelledby="tab-incidentes">
      <h2 className="admin-subtitulo">
        {rol === "profesor" ? "Reportar incidente o alergia" : "Incidentes y alergias de estudiantes"}
      </h2>

      {rol === "profesor" ? (
        <>
          <p className="subtitulo">Reporta un incidente o una alergia de un estudiante de tu grupo (puedes adjuntar una foto). El reporte queda visible para el coordinador, que puede marcarlo como resuelto.</p>
          <form className="formulario" onSubmit={reportarIncidente}>
            <div className="formulario-fila formulario-fila-grid">
              <label>Fecha<input type="date" value={incidenteFecha} onChange={(e) => setIncidenteFecha(e.target.value)} /></label>
              <label>Tipo<select value={incidenteTipo} onChange={(e) => setIncidenteTipo(e.target.value)}><option>Incidente</option><option>Alergia</option></select></label>
            </div>
            <label>Estudiante<ComboEstudiante estudiantes={incidenteEstudiantes} value={incidenteDoc} onChange={setIncidenteDoc} placeholder="Escribe el nombre del estudiante…" /></label>
            <label>Descripción<textarea value={incidenteDescripcion} onChange={(e) => setIncidenteDescripcion(e.target.value)} rows={3} required placeholder="Cuenta qué ocurrió…" /></label>
            <label>Foto adjunta<input type="file" accept="image/*" disabled={subiendoFoto} onChange={(e) => { const a = e.target.files?.[0]; if (a) adjuntarFotoIncidente(a, setIncidenteImagen, setSubiendoFoto); }} /></label>
            {incidenteImagen ? (<div className="incidente-foto"><img src={incidenteImagen} alt="Foto del reporte" /><button type="button" className="boton boton-secundario" onClick={() => setIncidenteImagen("")}>Quitar foto</button></div>) : null}
            <button type="submit" className="boton boton-primario" disabled={incidenteEnviando || subiendoFoto}>{incidenteEnviando ? "Reportando…" : subiendoFoto ? "Subiendo foto…" : "Reportar"}</button>
          </form>
        </>
      ) : (
        <>
          <p className="subtitulo">Reportes que dejan los profesores sobre los estudiantes de su grupo. Filtra por estado, rango de fechas o estudiante y márcalos como resueltos cuando estén atendidos.</p>
          <div className="formulario-fila">
            {(["todos", "pendientes", "resueltos"] as const).map((f) => (
              <button key={f} type="button" className={`boton ${incidentesFiltro === f ? "boton-primario" : "boton-secundario"}`} onClick={() => setIncidentesFiltro(f)}>
                {f === "todos" ? "Todos" : f === "pendientes" ? "Pendientes" : "Resueltos"}
              </button>
            ))}
          </div>
          <div className="formulario-fila formulario-fila-grid">
            <label>Desde<input type="date" value={incidentesDesde} onChange={(e) => setIncidentesDesde(e.target.value)} /></label>
            <label>Hasta<input type="date" value={incidentesHasta} onChange={(e) => setIncidentesHasta(e.target.value)} /></label>
            <label>Buscar estudiante<input type="text" value={incidentesBusqueda} onChange={(e) => setIncidentesBusqueda(e.target.value)} placeholder="Nombre o documento…" /></label>
          </div>
        </>
      )}

      {incidenteCargando && <p className="estado">Cargando reportes…</p>}
      {incidenteError && <p className="estado error" role="alert">⚠️ {incidenteError}</p>}
      {incidenteExito && <p className="estado exito" aria-live="polite">{incidenteExito}</p>}

      {rol === "profesor" && editandoIncidente && (
        <form className="formulario" onSubmit={guardarIncidenteEditado}>
          <h3 className="admin-subtitulo">Editar reporte · {editandoIncidente.estudiante}</h3>
          <div className="formulario-fila formulario-fila-grid">
            <label>Fecha<input type="date" value={editIncidenteFecha} onChange={(e) => setEditIncidenteFecha(e.target.value)} /></label>
            <label>Tipo<select value={editIncidenteTipo} onChange={(e) => setEditIncidenteTipo(e.target.value)}><option>Incidente</option><option>Alergia</option></select></label>
          </div>
          <label>Estudiante<ComboEstudiante estudiantes={incidenteEstudiantes} value={editIncidenteDoc} onChange={setEditIncidenteDoc} placeholder="Escribe el nombre del estudiante…" /></label>
          <label>Descripción<textarea value={editIncidenteDescripcion} onChange={(e) => setEditIncidenteDescripcion(e.target.value)} rows={3} required /></label>
          <label>Foto adjunta<input type="file" accept="image/*" disabled={subiendoEditFoto} onChange={(e) => { const a = e.target.files?.[0]; if (a) adjuntarFotoIncidente(a, setEditIncidenteImagen, setSubiendoEditFoto); }} /></label>
          {editIncidenteImagen ? (<div className="incidente-foto"><img src={editIncidenteImagen} alt="Foto del reporte" /><button type="button" className="boton boton-secundario" onClick={() => setEditIncidenteImagen("")}>Quitar foto</button></div>) : null}
          <div className="formulario-fila">
            <button type="submit" className="boton boton-primario" disabled={editIncidenteEnviando || subiendoEditFoto}>{editIncidenteEnviando ? "Guardando…" : "Guardar cambios"}</button>
            <button type="button" className="boton boton-secundario" onClick={() => setEditandoIncidente(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {!incidenteCargando && !incidenteError && incidentesVisibles.length === 0 ? (
        <p className="estado">{rol === "profesor" ? "Todavía no has reportado nada." : "No hay reportes con esos filtros."}</p>
      ) : (
        <div className="tabla-cocina">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th>Estudiante</th>{rol !== "profesor" && <th>Sede</th>}<th>Descripción</th><th>Foto</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody>
              {incidentesVisibles.map((inc) => (
                <tr key={inc.id} className={inc.resuelto ? "fila-resuelto" : undefined}>
                  <td>{fechaCortaDia(inc.fecha)}</td>
                  <td><span className={`chip chip-${inc.tipo.toLowerCase()}`}>{inc.tipo}</span></td>
                  <td>{inc.estudiante}{inc.grado ? ` · Grado ${inc.grado}` : ""}</td>
                  {rol !== "profesor" && <td>{inc.sede}</td>}
                  <td>{inc.descripcion}</td>
                  <td>{inc.imagen ? (<a href={inc.imagen} target="_blank" rel="noreferrer"><img className="incidente-foto-mini" src={inc.imagen} alt={`Foto de ${inc.estudiante}`} /></a>) : "—"}</td>
                  <td><span className={`incidente-estado ${inc.resuelto ? "resuelto" : "pendiente"}`}>{inc.resuelto ? "Resuelto" : "Pendiente"}</span></td>
                  <td>
                    <div className="formulario-fila">
                      {rol === "profesor" ? (
                        <>
                          <button type="button" className="boton boton-secundario" onClick={() => abrirEdicionIncidente(inc)}>✏️ Editar</button>
                          <button type="button" className="boton boton-peligro" onClick={() => borrarIncidente(inc)}>🗑️ Borrar</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="boton boton-secundario" onClick={() => resolverIncidente(inc.id, !inc.resuelto)} disabled={incidenteResolviendo === inc.id}>
                            {incidenteResolviendo === inc.id ? "Guardando…" : inc.resuelto ? "Reabrir" : "Marcar resuelto"}
                          </button>
                          <button type="button" className="boton boton-peligro" onClick={() => borrarIncidente(inc)}>🗑️ Borrar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
