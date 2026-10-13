import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import type { Notificacion } from "./types";

interface Props {
  notificaciones: Notificacion[];
}

export default function TabNotificaciones({ notificaciones }: Props) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div id="panel-notificaciones" role="tabpanel" aria-labelledby="tab-notificaciones">
      <h2 className="admin-subtitulo">
        Confirmaciones de reserva ({notificaciones.length})
      </h2>
      {notificaciones.length === 0 && (
        <p className="estado">Aún no hay notificaciones. Cuando un estudiante
          reserve, la confirmación aparece aquí.</p>
      )}
      <Buscador
        valor={busqueda}
        alCambiar={setBusqueda}
        placeholder="Buscar por tipo, destinatario o mensaje…"
      />
      <div className="lista-mensajes">
        {notificaciones
          .filter((nota) => {
            if (!busqueda.trim()) return true;
            const texto = `${nota.tipo} ${nota.destinatario || ""} ${nota.mensaje || ""}`;
            return coincide(texto, busqueda);
          })
          .map((nota) => (
          <article key={nota.id} className="fila-mensaje">
            <div>
              <strong>{nota.tipo} {nota.enviado ? "· ✅ enviada" : "· ⏳ pendiente"}</strong>
              <span className="fila-reserva-detalle">
                {nota.destinatario || "Sin correo"} ·{" "}
                {nota.created_at ? nota.created_at.slice(0, 10) : ""}
              </span>
              <p>{nota.mensaje}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
