import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import type { Institucion } from "./types";

interface Props {
  instituciones: Institucion[];
  nombreInst: string;
  instError: string;
  instExito: string;
  setNombreInst: (v: string) => void;
  registrarInstitucion: (e: React.FormEvent) => Promise<void>;
  borrarInstitucion: (id: number) => Promise<void>;
}

export default function TabInstituciones({
  instituciones,
  nombreInst,
  instError,
  instExito,
  setNombreInst,
  registrarInstitucion,
  borrarInstitucion,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div id="panel-instituciones" role="tabpanel" aria-labelledby="tab-instituciones">
      <h2 className="admin-subtitulo">Registrar institución</h2>
      <p className="subtitulo">
        Cada institución cuenta en la métrica de la página de inicio.
      </p>
      <form className="formulario" onSubmit={registrarInstitucion}>
        <label>
          Nombre de la institución
          <input
            type="text"
            value={nombreInst}
            onChange={(e) => setNombreInst(e.target.value)}
            required
            placeholder="Ej: IE San José"
          />
        </label>
        {instError && <p className="estado error" role="alert">⚠️ {instError}</p>}
        {instExito && <p className="estado exito" aria-live="polite">{instExito}</p>}
        <button type="submit" className="boton boton-primario">
          Registrar institución
        </button>
      </form>

      <h2 className="admin-subtitulo">
        Instituciones registradas ({instituciones.length})
      </h2>
      {instituciones.length === 0 && (
        <p className="estado">Aún no hay instituciones registradas.</p>
      )}
      <Buscador
        valor={busqueda}
        alCambiar={setBusqueda}
        placeholder="Buscar por nombre…"
      />
      <div className="lista-reservas">
        {instituciones
          .filter((inst) => {
            if (!busqueda.trim()) return true;
            return coincide(inst.nombre, busqueda);
          })
          .map((inst) => (
          <article key={inst.id} className="fila-reserva">
            <div>
              <strong>{inst.nombre}</strong>
            </div>
             <button
               type="button"
               className="boton boton-secundario"
               onClick={() => borrarInstitucion(inst.id)}
               aria-label={`Borrar institución ${inst.nombre}`}
             >
               Borrar
             </button>
          </article>
        ))}
      </div>
    </div>
  );
}
