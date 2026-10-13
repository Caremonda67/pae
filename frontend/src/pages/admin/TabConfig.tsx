import type { Sede } from "./types";

interface Props {
  config: { hora_limite_reserva: string | null; cupos_sede: Record<string, number> };
  horaLimite: string;
  setHoraLimite: (v: string) => void;
  cupos: Record<string, string>;
  setCupos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  configMensaje: { tipo: "exito" | "error"; texto: string } | null;
  sedes: Sede[];
  guardarConfig: (e: React.FormEvent) => Promise<void>;
}

export default function TabConfig({
  config, horaLimite, setHoraLimite, cupos, setCupos,
  configMensaje, sedes, guardarConfig,
}: Props) {
  return (
    <div className="admin-seccion">
      <h2 className="admin-subtitulo">Configuración del programa</h2>
      <p className="estado">
        Hora límite actual: {config.hora_limite_reserva || "sin definir"} · Los
        cupos 0 o vacíos significan "sin cupo".
      </p>
      <form className="formulario" onSubmit={guardarConfig}>
        <label>
          Hora límite para reservar o cancelar
          <input type="time" value={horaLimite} onChange={(e) => setHoraLimite(e.target.value)} />
        </label>
        <small className="campo-fijo">
          Antes de esta hora se permite reservar y cancelar del día actual; después, solo ver.
        </small>
        <h3 className="admin-subtitulo">Cupos de reservas por sede (por día)</h3>
        {sedes.length === 0 && <p className="estado">Aún no hay sedes registradas.</p>}
        {sedes.map((sede) => (
          <label key={sede.id}>
            Cupo de {sede.nombre}
            <input type="number" min={0} value={cupos[sede.nombre] ?? ""} onChange={(e) => setCupos((prev) => ({ ...prev, [sede.nombre]: e.target.value }))} />
          </label>
        ))}
        {configMensaje && (<p className={`estado ${configMensaje.tipo}`} role="alert">{configMensaje.texto}</p>)}
        <button type="submit" className="boton boton-primario">Guardar configuración</button>
      </form>
    </div>
  );
}
