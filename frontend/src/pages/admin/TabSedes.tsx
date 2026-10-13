import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import type { Sede } from "./types";

interface Props {
  sedes: Sede[];
  nombreSede: string;
  editandoSede: number | null;
  editNombreSede: string;
  sedeError: string;
  sedeExito: string;
  setNombreSede: (v: string) => void;
  setEditNombreSede: (v: string) => void;
  setEditandoSede: (v: number | null) => void;
  registrarSede: (e: React.FormEvent) => Promise<void>;
  iniciarEdicionSede: (s: Sede) => void;
  guardarEdicionSede: (e: React.FormEvent) => Promise<void>;
  borrarSede: (id: number) => Promise<void>;
}

export default function TabSedes({
  sedes,
  nombreSede,
  editandoSede,
  editNombreSede,
  sedeError,
  sedeExito,
  setNombreSede,
  setEditNombreSede,
  setEditandoSede,
  registrarSede,
  iniciarEdicionSede,
  guardarEdicionSede,
  borrarSede,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div id="panel-sedes" role="tabpanel" aria-labelledby="tab-sedes">
      <h2 className="admin-subtitulo">Registrar sede</h2>
      <p className="subtitulo">
        Las sedes son los puntos donde se atiende a los estudiantes.
        Aparecen en la reserva, en el registro de beneficiarios y en el
        registro por sede de la página de inicio.
      </p>
      <form className="formulario" onSubmit={registrarSede}>
        <label htmlFor="nombre-sede">
          Nombre de la sede
          <input
            id="nombre-sede"
            type="text"
            value={nombreSede}
            onChange={(e) => setNombreSede(e.target.value)}
            required
            placeholder="Ej: Sede D"
            autoComplete="off"
          />
        </label>
        {sedeError && <p className="estado error" role="alert">⚠️ {sedeError}</p>}
        {sedeExito && <p className="estado exito" aria-live="polite">{sedeExito}</p>}
        <button type="submit" className="boton boton-primario">
          Registrar sede
        </button>
      </form>

      <h2 className="admin-subtitulo">
        Sedes registradas ({sedes.length})
      </h2>
      {sedes.length === 0 && (
        <p className="estado">Aún no hay sedes registradas.</p>
      )}
      <Buscador valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar por nombre…" />
      <div className="lista-reservas">
        {sedes
          .filter((s) => !busqueda.trim() || coincide(s.nombre, busqueda))
          .map((s) => (
          <article key={s.id} className="fila-reserva">
            {editandoSede === s.id ? (
              <form className="formulario" onSubmit={guardarEdicionSede}>
                <label htmlFor={`editar-sede-${s.id}`}>
                  Nuevo nombre
                  <input
                    id={`editar-sede-${s.id}`}
                    type="text"
                    value={editNombreSede}
                    onChange={(e) => setEditNombreSede(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </label>
                <div className="formulario-fila">
                  <button type="submit" className="boton boton-primario">
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => setEditandoSede(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div>
                  <strong>{s.nombre}</strong>
                </div>
                <div className="formulario-fila">
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => iniciarEdicionSede(s)}
                    aria-label={`Renombrar sede ${s.nombre}`}
                  >
                    Renombrar
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => borrarSede(s.id)}
                    aria-label={`Borrar sede ${s.nombre}`}
                  >
                    Borrar
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
