import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import { GRADOS } from "../../config/horarios";
import type { Usuario, Sede } from "./types";

interface Props {
  usuarios: Usuario[];
  sedes: Sede[];
  nombreUsu: string;
  setNombreUsu: (v: string) => void;
  usuarioUsu: string;
  setUsuarioUsu: (v: string) => void;
  rolUsu: string;
  setRolUsu: (v: string) => void;
  claveUsu: string;
  setClaveUsu: (v: string) => void;
  sedeUsu: string;
  setSedeUsu: (v: string) => void;
  turnoUsu: string;
  setTurnoUsu: (v: string) => void;
  gradoUsu: string;
  setGradoUsu: (v: string) => void;
  usuError: string;
  usuExito: string;
  registrarUsuario: (e: React.FormEvent) => Promise<void>;
  alternarUsuario: (u: Usuario) => Promise<void>;
  borrarUsuario: (u: Usuario) => Promise<void>;
  iniciarEdicionUsuario: (u: Usuario) => void;
  editandoUsuario: number | null;
  setEditandoUsuario: (v: number | null) => void;
  editNombre: string;
  setEditNombre: (v: string) => void;
  editUsuario: string;
  setEditUsuario: (v: string) => void;
  editRol: string;
  setEditRol: (v: string) => void;
  editClave: string;
  setEditClave: (v: string) => void;
  editSede: string;
  setEditSede: (v: string) => void;
  editTurno: string;
  setEditTurno: (v: string) => void;
  editGrado: string;
  setEditGrado: (v: string) => void;
  guardarEdicionUsuario: (e: React.FormEvent) => Promise<void>;
}

export default function TabUsuarios({
  usuarios, sedes, nombreUsu, setNombreUsu, usuarioUsu, setUsuarioUsu,
  rolUsu, setRolUsu, claveUsu, setClaveUsu, sedeUsu, setSedeUsu,
  turnoUsu, setTurnoUsu, gradoUsu, setGradoUsu, usuError, usuExito,
  registrarUsuario, alternarUsuario, borrarUsuario, iniciarEdicionUsuario,
  editandoUsuario, setEditandoUsuario, editNombre, setEditNombre,
  editUsuario, setEditUsuario, editRol, setEditRol, editClave,
  setEditClave, editSede, setEditSede, editTurno, setEditTurno,
  editGrado, setEditGrado, guardarEdicionUsuario,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div id="panel-usuarios" role="tabpanel" aria-labelledby="tab-usuarios">
      <h2 className="admin-subtitulo">Crear cuenta de usuario</h2>
      <p className="subtitulo">Cada cuenta da acceso al panel con el rol que elijas. Para los estudiantes la cuenta se crea automáticamente al registrarlos con PIN en la pestaña Beneficiarios.</p>
      <form className="formulario" onSubmit={registrarUsuario}>
        <label htmlFor="nombre-usu">Nombre completo<input id="nombre-usu" type="text" value={nombreUsu} onChange={(e) => setNombreUsu(e.target.value)} required placeholder="Nombre del usuario" autoComplete="off" /></label>
        <div className="formulario-fila">
          <label htmlFor="usuario-usu">Usuario<input id="usuario-usu" type="text" value={usuarioUsu} onChange={(e) => setUsuarioUsu(e.target.value)} required placeholder="Con qué nombre entrará" autoComplete="off" /></label>
          <label htmlFor="rol-usu">Rol<select id="rol-usu" value={rolUsu} onChange={(e) => setRolUsu(e.target.value)}><option value="cocina">Cocina</option><option value="profesor">Profesor</option><option value="coordinador">Coordinador</option><option value="admin">Administrador</option></select></label>
        </div>
        {rolUsu === "profesor" && (
          <div className="formulario-fila formulario-fila-grid">
            <label htmlFor="sede-usu">Sede<select id="sede-usu" value={sedeUsu} onChange={(e) => setSedeUsu(e.target.value)} required><option value="">Elige una sede</option>{sedes.map((s) => (<option key={s.id} value={s.nombre}>{s.nombre}</option>))}</select></label>
            <label htmlFor="turno-usu">Turno<select id="turno-usu" value={turnoUsu} onChange={(e) => setTurnoUsu(e.target.value)}><option>Almuerzo</option><option>Refrigerio</option><option>Ambas jornadas</option></select></label>
            <label htmlFor="grado-usu">Grado<select id="grado-usu" value={gradoUsu} onChange={(e) => setGradoUsu(e.target.value)} required><option value="">Elige un grado</option>{GRADOS.map((grado) => (<option key={grado} value={grado}>{grado}</option>))}</select></label>
          </div>
        )}
        <label htmlFor="clave-usu">Clave<input id="clave-usu" type="text" value={claveUsu} onChange={(e) => setClaveUsu(e.target.value)} required minLength={4} placeholder="Mínimo 4 caracteres" autoComplete="new-password" /></label>
        {usuError && <p className="estado error" role="alert">⚠️ {usuError}</p>}
        {usuExito && <p className="estado exito" aria-live="polite">{usuExito}</p>}
        <button type="submit" className="boton boton-primario">Crear usuario</button>
      </form>

      <h2 className="admin-subtitulo">Cuentas creadas ({usuarios.length})</h2>
      {usuarios.length === 0 && <p className="estado">Aún no hay cuentas creadas. Crea la primera arriba.</p>}
      <Buscador valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar por nombre, usuario o rol…" />
      <div className="lista-reservas">
        {usuarios
          .filter((u) => { if (!busqueda.trim()) return true; return coincide(`${u.nombre} ${u.usuario} ${u.rol}`, busqueda); })
          .map((u) => (
          <article key={u.id} className="fila-reserva">
            <div>
              <strong>{u.nombre}</strong>
              <span className="fila-reserva-detalle">{u.usuario} · {u.rol} · {u.activo ? "activo" : "desactivado"}</span>
            </div>
            <div className="formulario-fila">
              <button type="button" className="boton boton-secundario" onClick={() => editandoUsuario === u.id ? setEditandoUsuario(null) : iniciarEdicionUsuario(u)} aria-label={`Editar cuenta de ${u.nombre}`}>{editandoUsuario === u.id ? "Cancelar" : "Editar"}</button>
              <button type="button" className="boton boton-secundario" onClick={() => alternarUsuario(u)} aria-label={`${u.activo ? "Desactivar" : "Activar"} cuenta de ${u.nombre}`}>{u.activo ? "Desactivar" : "Activar"}</button>
              <button type="button" className="boton boton-secundario" onClick={() => borrarUsuario(u)} aria-label={`Borrar cuenta de ${u.nombre}`}>Borrar</button>
            </div>
            {editandoUsuario === u.id && (
              <form className="formulario" onSubmit={guardarEdicionUsuario}>
                <label>Nombre completo<input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required autoComplete="off" /></label>
                <div className="formulario-fila">
                  <label>Usuario<input type="text" value={editUsuario} onChange={(e) => setEditUsuario(e.target.value)} required autoComplete="off" /></label>
                  <label>Rol<select value={editRol} onChange={(e) => setEditRol(e.target.value)}><option value="cocina">Cocina</option><option value="profesor">Profesor</option><option value="coordinador">Coordinador</option><option value="estudiante">Estudiante</option><option value="admin">Administrador</option></select></label>
                </div>
                {editRol === "profesor" && (
                  <div className="formulario-fila formulario-fila-grid">
                    <label>Sede<select value={editSede} onChange={(e) => setEditSede(e.target.value)} required><option value="">Elige una sede</option>{sedes.map((s) => (<option key={s.id} value={s.nombre}>{s.nombre}</option>))}</select></label>
                    <label>Turno<select value={editTurno} onChange={(e) => setEditTurno(e.target.value)}><option>Almuerzo</option><option>Refrigerio</option><option>Ambas jornadas</option></select></label>
                    <label>Grado<select value={editGrado} onChange={(e) => setEditGrado(e.target.value)} required><option value="">Elige un grado</option>{GRADOS.map((grado) => (<option key={grado} value={grado}>{grado}</option>))}</select></label>
                  </div>
                )}
                <label>Clave / PIN (déjala vacía para no cambiarla)<input type="text" value={editClave} onChange={(e) => setEditClave(e.target.value)} minLength={4} placeholder="Dejar vacío para mantener la clave actual" autoComplete="off" /></label>
                <button type="submit" className="boton boton-primario">Guardar cambios</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
