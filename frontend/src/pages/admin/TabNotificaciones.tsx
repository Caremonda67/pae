import { useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import { etiquetaDia, horaCorta } from "../../config/fechas";
import type { Notificacion } from "./types";

interface Props {
  notificaciones: Notificacion[];
}

// Icono segun el tipo de notificacion. Hoy solo se genera "reserva",
// pero el mapa queda listo para otros usos futuros del historial.
function iconoTipo(tipo: string) {
  const t = String(tipo).toLowerCase();
  if (t.includes("reserv")) return "💌";
  if (t.includes("alerg") || t.includes("incident")) return "⚠️";
  if (t.includes("sobrant") || t.includes("cocina")) return "🍱";
  return "📣";
}

// Nombre legible del tipo ("reserva" -> "Reserva").
function nombreTipo(tipo: string) {
  const t = String(tipo || "").trim();
  if (!t) return "Confirmación";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function TabNotificaciones({ notificaciones }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const enviadas = notificaciones.filter((n) => n.enviado).length;
  const pendientes = notificaciones.length - enviadas;

  const visibles = notificaciones.filter((nota) => {
    if (!busqueda.trim()) return true;
    const texto = `${nota.tipo} ${nota.destinatario || ""} ${nota.mensaje || ""}`;
    return coincide(texto, busqueda);
  });

  return (
    <div id="panel-notificaciones" role="tabpanel" aria-labelledby="tab-notificaciones">
      <h2 className="admin-subtitulo">
        Confirmaciones de reserva
        <span className="noti-contador">{notificaciones.length}</span>
      </h2>
      <p className="subtitulo">
        <strong>Pendiente</strong> = el correo de confirmación no se envió (no
        se pidió un correo, el envío no está configurado o falló); queda el
        registro aquí. <strong>Enviada</strong> = la confirmación llegó al
        correo del destinatario al reservar.
      </p>

      {notificaciones.length === 0 && (
        <p className="estado">Aún no hay notificaciones. Cuando un estudiante
          reserve, la confirmación aparece aquí.</p>
      )}

      {notificaciones.length > 0 && (
        <>
          <div className="noti-resumen" role="status">
            <span className="noti-resumen-item">
              <strong>{notificaciones.length}</strong> notificaciones
            </span>
            <span className="noti-resumen-item noti-enviada">
              ✅ <strong>{enviadas}</strong> enviadas
            </span>
            <span className="noti-resumen-item noti-pendiente">
              ⏳ <strong>{pendientes}</strong> pendientes
            </span>
          </div>

          <Buscador
            valor={busqueda}
            alCambiar={setBusqueda}
            placeholder="Buscar por tipo, destinatario o mensaje…"
          />

          <div className="lista-mensajes">
            {visibles.map((nota) => {
              const dia = etiquetaDia(nota.created_at);
              const hora = horaCorta(nota.created_at);
              return (
                <article key={nota.id} className="fila-mensaje noti-fila">
                  <span
                    className={nota.enviado ? "noti-icono enviada" : "noti-icono pendiente"}
                    aria-hidden="true"
                  >
                    {iconoTipo(nota.tipo)}
                  </span>
                  <div className="noti-cuerpo">
                    <div className="noti-cabecera">
                      <span className="chip chip-reserva">{nombreTipo(nota.tipo)}</span>
                      <span
                        className={nota.enviado ? "noti-estado enviada" : "noti-estado pendiente"}
                      >
                        {nota.enviado ? "✅ Enviada" : "⏳ Pendiente"}
                      </span>
                    </div>
                    <p className="noti-mensaje">{nota.mensaje}</p>
                    <span className="fila-reserva-detalle noti-meta">
                      ✉️ {nota.destinatario || "Sin correo"}
                      {dia && <span>· {dia}</span>}
                      {hora && <span>· {hora}</span>}
                    </span>
                  </div>
                </article>
              );
            })}
            {visibles.length === 0 && (
              <p className="estado">Sin resultados para “{busqueda}”.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}