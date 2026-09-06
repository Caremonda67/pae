import { useMemo, useState } from "react";
import Buscador from "../../components/Buscador";
import { coincide } from "../../config/busqueda";
import { etiquetaDia, horaCorta } from "../../config/fechas";
import type { AuditoriaEntrada } from "./types";

interface Props {
  auditoria: AuditoriaEntrada[];
}

// Modulo al que pertenece una accion ("beneficiarios:crear" -> "beneficiarios").
function moduloDe(accion: string) {
  const parte = String(accion).split(":")[0].toLowerCase();
  const conocidos = ["beneficiarios", "sedes", "sobrantes", "usuarios", "turnos"];
  return conocidos.includes(parte) ? parte : "otros";
}

// Icono de cada modulo para los nodos de la linea de tiempo.
const ICONOS_MODULO: Record<string, string> = {
  beneficiarios: "👥",
  sedes: "🏫",
  sobrantes: "🍱",
  usuarios: "👤",
  turnos: "🕐",
  otros: "⚙️",
};

// Color segun el verbo: crear/guardar/asignar en verde, editar/pin en
// naranja y borrar/quitar en rojo.
function claseVerbo(accion: string) {
  const verbo = (String(accion).split(":")[1] || "").toLowerCase();
  if (["crear", "guardar", "asignar"].includes(verbo)) return "crear";
  if (["editar", "renombrar", "pin", "actualizar"].includes(verbo)) return "editar";
  if (["borrar", "quitar"].includes(verbo)) return "borrar";
  return "otro";
}

// Accion legible con participio: "usuarios:editar" -> "Usuario editado",
// "sedes:crear" -> "Sede creada". Si no hay etiqueta para la accion se
// cae al formato "Modulo · Verbo".
const ETIQUETAS_ACCION: Record<string, string> = {
  "beneficiarios:crear": "Beneficiario creado",
  "beneficiarios:editar": "Beneficiario editado",
  "beneficiarios:pin": "PIN de beneficiario actualizado",
  "beneficiarios:borrar": "Beneficiario eliminado",
  "sedes:crear": "Sede creada",
  "sedes:renombrar": "Sede renombrada",
  "sedes:borrar": "Sede eliminada",
  "sobrantes:guardar": "Sobrantes guardados",
  "sobrantes:borrar": "Sobrantes eliminados",
  "usuarios:crear": "Usuario creado",
  "usuarios:editar": "Usuario editado",
  "usuarios:borrar": "Usuario eliminado",
  "turnos:asignar": "Turno asignado",
  "turnos:quitar": "Turno quitado",
  "configuracion:actualizar": "Configuración actualizada",
};

function nombreAccion(accion: string) {
  const etiqueta = ETIQUETAS_ACCION[String(accion).toLowerCase()];
  if (etiqueta) return etiqueta;
  const [modulo, verbo] = String(accion).split(":");
  const capitalizar = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  return `${capitalizar(modulo)}${verbo ? ` · ${capitalizar(verbo)}` : ""}`;
}

// Etiquetas legibles para campos guardados con su nombre interno
// (el admin no debe ver "clave_hash" ni "hora_limite_reserva"). Nota:
// "activo" no está acá porque el detalle nuevo ya llega como
// "estado activo" y traducirlo de nuevo duplicaría el texto.
const ETIQUETAS_CAMPO: Record<string, string> = {
  alergias: "alergias",
  clave_hash: "contraseña/PIN",
  cupos_sede: "cupos por sede",
  documento: "documento",
  grado: "grado",
  hora_limite_reserva: "hora límite de reserva",
  nombre: "nombre",
  preferencias: "preferencia de menú",
  rol: "rol",
  sede: "sede",
  turno: "turno",
  usuario: "usuario",
};

// Convierte el detalle guardado (incluso los registros antiguos con
// "id 13 | clave_hash" o JSON de configuración) en texto legible.
function detalleLegible(detalle: string | null | undefined): string {
  if (!detalle) return "Sin detalle.";
  let texto = String(detalle).trim();

  const soloId = /^id \d+$/.test(texto);
  texto = texto.replace(/\bid \d+ \| ?/g, "");

  texto = texto.replace(/cupos_sede=(\{[^}]*\}|null|undefined)/g, (_, cuerpo) => {
    if (cuerpo === "null" || cuerpo === "undefined") return "cupos por sede: sin cupos";
    let cupos: Record<string, number> = {};
    try {
      cupos = JSON.parse(cuerpo);
    } catch {
      cupos = {};
    }
    const partes = Object.entries(cupos).map(([sede, cupo]) => `${sede} → ${cupo}`);
    return partes.length ? `cupos por sede: ${partes.join(", ")}` : "cupos por sede: sin cupos";
  });

  texto = texto.replace(/"([^"]+)"/g, "$1");

  texto = texto.replace(
    /\b(hora_limite_reserva|cupos_sede|clave_hash|alergias|preferencias|documento|grado|turno|sede|usuario|nombre|rol)\b/g,
    (m) => ETIQUETAS_CAMPO[m] || m
  );

  texto = texto.replace(/hora límite de reserva=([0-9:]+)/g, "hora límite de reserva: $1");
  texto = texto.replace(/hora límite de reserva=(null|undefined)/g, "hora límite de reserva: sin límite");

  // Lista simple de campos ("nombre, usuario, rol") -> "cambios en ..."
  if (
    !/^(cambi|asign|quit|cre|borr|edit|gén|elimin)/i.test(texto) &&
    texto.includes(",") &&
    /^[a-zñáéíóú/, ·]+$/i.test(texto)
  ) {
    texto = `cambios en: ${texto}`;
  }

  texto = texto.replace(/\(\)/g, "").trim();
  texto = texto.replace(/""/g, "«sin nombre»");
  if (soloId) return "registro interno";
  if (texto === "." || texto === "..") return "«sin nombre»";

  return texto || "Sin detalle.";
}

export default function TabAuditoria({ auditoria }: Props) {
  const [filtro, setFiltro] = useState("");
  const [modulo, setModulo] = useState("todos");

  const modulos = useMemo(() => {
    const set = new Set<string>();
    auditoria.forEach((a) => set.add(moduloDe(a.accion)));
    return ["todos", ...Array.from(set).sort()];
  }, [auditoria]);

  const visibles = useMemo(
    () =>
      auditoria.filter((a) => {
        if (modulo !== "todos" && moduloDe(a.accion) !== modulo) return false;
        if (!filtro.trim()) return true;
        const texto = `${a.accion} ${a.usuario || ""} ${a.detalle || ""} ${a.rol || ""}`;
        return coincide(texto, filtro);
      }),
    [auditoria, modulo, filtro]
  );

  // Agrupa por dia y ordena de mas reciente a mas antigua.
  const grupos = useMemo(() => {
    const ordenadas = [...visibles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const porDia = new Map<string, AuditoriaEntrada[]>();
    ordenadas.forEach((a) => {
      const dia = etiquetaDia(a.created_at) || "Sin fecha";
      const lista = porDia.get(dia) || [];
      lista.push(a);
      porDia.set(dia, lista);
    });
    return Array.from(porDia.entries());
  }, [visibles]);

  return (
    <div id="panel-auditoria" role="tabpanel" aria-labelledby="tab-auditoria">
      <h2 className="admin-subtitulo">
        Auditoría de acciones
        <span className="noti-contador">{auditoria.length}</span>
      </h2>

      {auditoria.length === 0 && <p className="estado">Sin registros.</p>}

      {auditoria.length > 0 && (
        <>
          <div className="audit-filtros" role="group" aria-label="Filtrar por módulo">
            {modulos.map((m) => (
              <button
                key={m}
                type="button"
                className={m === modulo ? "audit-filtro activa" : "audit-filtro"}
                onClick={() => setModulo(m)}
                aria-pressed={m === modulo}
              >
                {m === "todos"
                  ? `Todos (${auditoria.length})`
                  : `${ICONOS_MODULO[m] || "⚙️"} ${m.charAt(0).toUpperCase() + m.slice(1)}`}
              </button>
            ))}
          </div>

          <Buscador
            valor={filtro}
            alCambiar={setFiltro}
            placeholder="Filtrar por acción, usuario o detalle…"
          />

          <div className="audit-timeline">
            {grupos.map(([dia, entradas]) => (
              <section key={dia} className="audit-grupo" aria-label={dia}>
                <h3 className="audit-dia">
                  <span>{dia}</span>
                </h3>
                <ul className="audit-lista">
                  {entradas.map((a) => {
                    const mod = moduloDe(a.accion);
                    const verbo = claseVerbo(a.accion);
                    const hora = horaCorta(a.created_at);
                    return (
                      <li key={a.id} className="audit-item">
                        <span className={`audit-nodo ${verbo}`} aria-hidden="true">
                          {ICONOS_MODULO[mod] || "⚙️"}
                        </span>
                        <article className="audit-tarjeta">
                          <div className="audit-cabecera">
                            <span className={`chip chip-verbo ${verbo}`}>
                              {nombreAccion(a.accion)}
                            </span>
                            {hora && <time className="audit-hora">{hora}</time>}
                          </div>
                          <p className="audit-detalle">{detalleLegible(a.detalle)}</p>
                          <span className="fila-reserva-detalle audit-quien">
                            {a.usuario ? `👤 ${a.usuario}` : "• sistema"}
                            {a.rol ? ` (${a.rol})` : ""}
                          </span>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {grupos.length === 0 && <p className="estado">Sin resultados.</p>}
          </div>
        </>
      )}
    </div>
  );
}