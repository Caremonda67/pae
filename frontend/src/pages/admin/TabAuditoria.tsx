import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import type { AuditoriaEntrada } from "./types";

interface Props {
  auditoria: AuditoriaEntrada[];
}

export default function TabAuditoria({ auditoria }: Props) {
  const [filtro, setFiltro] = useState("");

  return (
    <div className="admin-seccion">
      <h2 className="admin-subtitulo">Auditoría de acciones</h2>
      <Buscador
        valor={filtro}
        alCambiar={setFiltro}
        placeholder="Filtrar por acción, usuario o detalle…"
      />
      {auditoria.length === 0 && <p className="estado">Sin registros.</p>}
      <div className="lista-reservas">
        {auditoria
          .filter((a) => {
            if (!filtro.trim()) return true;
            const texto = `${a.accion} ${a.usuario || ""} ${a.detalle || ""} ${a.rol || ""}`;
            return coincide(texto, filtro);
          })
          .map((a) => (
            <article key={a.id} className="fila-reserva">
              <div>
                <strong>{a.accion}</strong>
                <span className="fila-reserva-detalle">
                  {a.detalle || ""}
                  {a.usuario ? ` · por ${a.usuario}` : ""}
                  {a.rol ? ` (${a.rol})` : ""}
                  {a.created_at ? ` · ${new Date(a.created_at).toLocaleString()}` : ""}
                </span>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
