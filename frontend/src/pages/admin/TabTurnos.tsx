import type { TurnoCocina, UsuarioCocina, Sede } from "./types";

interface Props {
  turnos: TurnoCocina[];
  listaCocina: UsuarioCocina[];
  fechaTurno: string;
  setFechaTurno: (v: string) => void;
  usuarioTurno: string;
  setUsuarioTurno: (v: string) => void;
  sedeTurno: string;
  setSedeTurno: (v: string) => void;
  turnosMensaje: { tipo: "exito" | "error"; texto: string } | null;
  sedes: Sede[];
  asignarTurno: (e: React.FormEvent) => Promise<void>;
  quitarTurno: (id: number) => Promise<void>;
}

export default function TabTurnos({
  turnos, listaCocina, fechaTurno, setFechaTurno,
  usuarioTurno, setUsuarioTurno, sedeTurno, setSedeTurno,
  turnosMensaje, sedes, asignarTurno, quitarTurno,
}: Props) {
  return (
    <div className="admin-seccion">
      <h2 className="admin-subtitulo">Turnos de cocina</h2>
      <form className="formulario" onSubmit={asignarTurno}>
        <div className="formulario-fila">
          <label>
            Fecha
            <input type="date" value={fechaTurno} onChange={(e) => setFechaTurno(e.target.value)} required />
          </label>
          <label>
            Personal de cocina
            <select value={usuarioTurno} onChange={(e) => setUsuarioTurno(e.target.value)} required>
              {listaCocina.length === 0 && (<option value="">No hay personal de cocina registrado</option>)}
              {listaCocina.map((c) => (<option key={c.id} value={c.usuario}>{c.nombre}</option>))}
            </select>
          </label>
          <label>
            Sede
            <select value={sedeTurno} onChange={(e) => setSedeTurno(e.target.value)} required>
              <option value="">Elige una sede</option>
              {sedes.map((s) => (<option key={s.id} value={s.nombre}>{s.nombre}</option>))}
            </select>
          </label>
        </div>
        {turnosMensaje && (<p className={`estado ${turnosMensaje.tipo}`} role="alert">{turnosMensaje.texto}</p>)}
        <button type="submit" className="boton boton-primario">Asignar turno</button>
      </form>
      <h3 className="admin-subtitulo">Turnos del día elegido</h3>
      {turnos.filter((t) => t.fecha === fechaTurno).length === 0 && (<p className="estado">No hay turnos asignados para este día.</p>)}
      <div className="lista-reservas">
        {turnos
          .filter((t) => t.fecha === fechaTurno)
          .map((t) => (
          <article key={t.id} className="fila-reserva">
            <div>
              <strong>{t.usuario}</strong>
              <span className="fila-reserva-detalle">{t.sede}</span>
            </div>
            <button type="button" className="boton boton-secundario" onClick={() => quitarTurno(t.id)} aria-label={`Quitar turno de ${t.usuario}`}>Quitar</button>
          </article>
        ))}
      </div>
    </div>
  );
}
