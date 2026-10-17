import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import { GRADOS, horarioGrado } from "../../config/horarios";
import type { Beneficiario, Sede } from "./types";

interface Props {
  beneficiarios: Beneficiario[];
  sedes: Sede[];
  docBen: string;
  setDocBen: (v: string) => void;
  nombreBen: string;
  setNombreBen: (v: string) => void;
  sedeBen: string;
  setSedeBen: (v: string) => void;
  turnoBen: string;
  setTurnoBen: (v: string) => void;
  gradoBen: string;
  setGradoBen: (v: string) => void;
  pinBen: string;
  setPinBen: (v: string) => void;
  alergiasBen: string;
  setAlergiasBen: (v: string) => void;
  prefBen: string;
  setPrefBen: (v: string) => void;
  benError: string;
  benExito: string;
  pins: Record<number, string>;
  setPins: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  registrarBeneficiario: (e: React.FormEvent) => Promise<void>;
  asignarPin: (b: Beneficiario) => Promise<void>;
  borrarBeneficiario: (id: number) => Promise<void>;
}

export default function TabBeneficiarios({
  beneficiarios, sedes, docBen, setDocBen, nombreBen, setNombreBen,
  sedeBen, setSedeBen, turnoBen, setTurnoBen, gradoBen, setGradoBen,
  pinBen, setPinBen, alergiasBen, setAlergiasBen, prefBen, setPrefBen,
  benError, benExito, pins, setPins,
  registrarBeneficiario, asignarPin, borrarBeneficiario,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div id="panel-beneficiarios" role="tabpanel" aria-labelledby="tab-beneficiarios">
      <h2 className="admin-subtitulo">Registrar beneficiario</h2>
      <form className="formulario" onSubmit={registrarBeneficiario}>
        <label htmlFor="doc-ben">
          Documento
          <input id="doc-ben" type="text" value={docBen} onChange={(e) => setDocBen(e.target.value)} required placeholder="Ej: 1234567890" autoComplete="off" />
        </label>
        <label htmlFor="nombre-ben">
          Nombre completo
          <input id="nombre-ben" type="text" value={nombreBen} onChange={(e) => setNombreBen(e.target.value)} required placeholder="Nombre del estudiante" autoComplete="off" />
        </label>
        <div className="formulario-fila formulario-fila-grid">
          <label htmlFor="sede-ben">
            Sede
            <select id="sede-ben" value={sedeBen} onChange={(e) => setSedeBen(e.target.value)} required>
              <option value="" disabled>{sedes.length > 0 ? "Selecciona la sede" : "Sin sedes registradas"}</option>
              {sedes.map((s) => (<option key={s.id} value={s.nombre}>{s.nombre}</option>))}
            </select>
            {sedes.length === 0 && (<small className="campo-fijo">Aún no hay sedes registradas. Crea una desde la pestaña "Sedes".</small>)}
          </label>
          <label htmlFor="turno-ben">
            Turno
            <select id="turno-ben" value={turnoBen} onChange={(e) => setTurnoBen(e.target.value)}>
              <option>Almuerzo</option>
              <option>Refrigerio</option>
              <option>Ambas jornadas</option>
            </select>
            <small className="campo-fijo">Elige "Ambas jornadas" si el estudiante puede ir al Almuerzo y al Refrigerio.</small>
          </label>
          <label htmlFor="grado-ben">
            Grado
            <select id="grado-ben" value={gradoBen} onChange={(e) => setGradoBen(e.target.value)} aria-describedby={gradoBen && horarioGrado(gradoBen) ? "horario-grado-ben" : undefined}>
              <option value="">Sin grado</option>
              {GRADOS.map((grado) => (<option key={grado} value={grado}>{grado}</option>))}
            </select>
            {gradoBen && horarioGrado(gradoBen) && (<span id="horario-grado-ben" className="horario-grado">Refrigerio: {horarioGrado(gradoBen)}</span>)}
          </label>
        </div>
        <label htmlFor="pin-ben">
          PIN del estudiante (opcional)
          <input id="pin-ben" type="text" value={pinBen} onChange={(e) => setPinBen(e.target.value)} minLength={4} placeholder="Ej: 8161" autoComplete="off" />
          <small className="campo-fijo">Si lo pones (mínimo 4 caracteres), el estudiante podrá entrar a reservar con documento + PIN.</small>
        </label>
        <div className="formulario-fila formulario-fila-grid">
          <label htmlFor="alergias-ben">
            Alergias (opcional)
            <input id="alergias-ben" type="text" value={alergiasBen} onChange={(e) => setAlergiasBen(e.target.value)} placeholder="Ej: Maní, lactosa" autoComplete="off" />
            <small className="campo-fijo">La cocina las verá en el panel para evitar servirle ese plato.</small>
          </label>
          <label htmlFor="pref-ben">
            Preferencias (opcional)
            <input id="pref-ben" type="text" value={prefBen} onChange={(e) => setPrefBen(e.target.value)} placeholder="Ej: Vegetariano, sin sal" autoComplete="off" />
          </label>
        </div>
        {benError && <p className="estado error" role="alert">⚠️ {benError}</p>}
        {benExito && <p className="estado exito" aria-live="polite">{benExito}</p>}
        <button type="submit" className="boton boton-primario" disabled={sedes.length === 0}>Registrar beneficiario</button>
      </form>

      <h2 className="admin-subtitulo">Beneficiarios registrados ({beneficiarios.length})</h2>
      {beneficiarios.length === 0 && (<p className="estado">Aún no hay beneficiarios registrados.</p>)}
      <Buscador valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar por nombre, documento, sede, turno o grado…" />
      <div className="lista-reservas">
        {beneficiarios
          .filter((b) => {
            if (!busqueda.trim()) return true;
            const texto = `${b.nombre} ${b.documento} ${b.sede} ${b.turno} ${b.grado || ""} ${b.alergias || ""} ${b.preferencias || ""}`;
            return coincide(texto, busqueda);
          })
          .map((b) => (
          <article key={b.id} className="fila-reserva">
            <div>
              <strong>{b.nombre}</strong>
              <span className="fila-reserva-detalle">
                {b.sede} · {b.turno} · Doc. {b.documento}
                {b.grado ? ` · Grado ${b.grado}` : ""}
                {b.alergias ? ` · ⚠️ Alergias: ${b.alergias}` : ""}
                {b.preferencias ? ` · Prefiere: ${b.preferencias}` : ""}
              </span>
            </div>
            <div className="formulario-fila">
              <input type="text" value={pins[b.id] || ""} onChange={(e) => setPins((p) => ({ ...p, [b.id]: e.target.value }))} minLength={4} placeholder="PIN nuevo (4+)" aria-label={`PIN para ${b.nombre}`} />
              <button type="button" className="boton boton-secundario" onClick={() => asignarPin(b)} disabled={!(pins[b.id] || "").trim()} aria-label={`Asignar PIN a ${b.nombre}`}>Asignar PIN</button>
              <button type="button" className="boton boton-secundario" onClick={() => borrarBeneficiario(b.id)} aria-label={`Borrar beneficiario ${b.nombre}`}>Borrar</button>
            </div>
          </article>
         ))}
      </div>
    </div>
  );
}
