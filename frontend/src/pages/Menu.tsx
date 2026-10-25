// Menu semanal rotativo (semana del mes x jornada) con puntuacion de
// platos. Con sesion de estudiante: favoritos (se avisa en el menu del
// dia) y etiquetas popular/recomendado. Filtro por variante.

import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { leerSesion, cabeceras } from "../config/sesion";

// Tipado de un plato del menu
interface MenuItem {
  id: number;
  semana: number;
  dia: string;
  jornada: string;
  platillo: string;
  descripcion: string;
  calorias?: number;
  imagen?: string;
  valoracion?: number | null;
  votos?: number;
  variante?: string;
  popular?: boolean;
  recomendado?: boolean;
  favorito?: boolean;
}

const diasOrden = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
];

const VARIANTES = [
  { valor: "Todos", etiqueta: "Todo" },
  { valor: "Estandar", etiqueta: "Estándar" },
  { valor: "Celiaco", etiqueta: "Celíaco" },
  { valor: "Vegetariano", etiqueta: "Vegetariano" },
  { valor: "Vegano", etiqueta: "Vegano" },
];

// Quita los acentos para comparar nombres de dias sin problemas
function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Semana del mes actual (igual que calcula el backend: ceil(dia/7), max 4)
function semanaActualDelMes() {
  const hoy = new Date();
  return Math.min(4, Math.ceil(hoy.getDate() / 7));
}

const ESTRELLAS = [1, 2, 3, 4, 5];

function Menu() {
  // menu: lista de platos cargados desde el backend
  const [menu, setMenu] = useState<MenuItem[]>([]);
  // semanaActiva: semana del mes que se esta viendo (por defecto la actual)
  const [semanaActiva, setSemanaActiva] = useState(semanaActualDelMes());
  // variante: filtro por tipo de dieta (Todos por defecto)
  const [variante, setVariante] = useState("Todos");
  // cargando: controla el estado de carga (requisito UX del proyecto)
  const [cargando, setCargando] = useState(true);
  // error: guarda el mensaje si algo sale mal
  const [error, setError] = useState("");

  // Sesion del estudiante (para marcar favoritos con su documento)
  const sesion = leerSesion();
  const esEstudiante = sesion?.rol === "estudiante";
  const documento = esEstudiante ? sesion.usuario : "";

  // documento para valorar (el mismo que usan para reservar)
  const [docValorar, setDocValorar] = useState("");
  // plato que se esta calificando ahora mismo
  const [valorando, setValorando] = useState<number | null>(null);
  // estrellas en vista previa mientras se pasa el raton
  const [previa, setPrevia] = useState<{ platoId: number; valor: number } | null>(null);
  // estrellas que el estudiante ya eligio (se quedan sombreadas)
  const [seleccionada, setSeleccionada] = useState<Record<number, number>>({});
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: string } | null>(null);

  // useEffect se ejecuta una vez cuando la pagina se monta
  useEffect(() => {
    const cargarMenu = async () => {
      try {
        // Con sesion de estudiante se marcan sus favoritos (el backend
        // solo los revela si el token coincide con el documento).
        const url = documento
          ? `${API_URL}/api/menus?documento=${encodeURIComponent(documento)}`
          : `${API_URL}/api/menus`;
        const respuesta = await fetch(url, documento ? { headers: cabeceras(false) } : undefined);
        if (!respuesta.ok) throw new Error("No se pudo cargar el menú");
        const datos = await respuesta.json();
        setMenu(datos);
        if (documento) setDocValorar(documento);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    };
    cargarMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Platos de la semana que se esta viendo, con el filtro de variante
  const menuSemana = menu.filter(
    (item) =>
      item.semana === semanaActiva &&
      (variante === "Todos" || item.variante === variante)
  );

  // Recarga el menu para actualizar los promedios (dejando los favoritos)
  const recargarMenu = async () => {
    try {
      const url = documento
        ? `${API_URL}/api/menus?documento=${encodeURIComponent(documento)}`
        : `${API_URL}/api/menus`;
      const respuesta = await fetch(url, documento ? { headers: cabeceras(false) } : undefined);
      if (!respuesta.ok) throw new Error("No se pudo cargar el menú");
      setMenu(await respuesta.json());
    } catch {
      // si falla, dejamos la lista como estaba
    }
  };

  // Marca o desmarca un plato como favorito (solo con sesion de estudiante)
  const alternarFavorito = async (plato: MenuItem) => {
    if (!documento) {
      setMensaje({
        texto: "Entra con tu documento y PIN en la página de reserva para marcar favoritos.",
        tipo: "error",
      });
      return;
    }
    const activo = !plato.favorito;
    // Cambio optimista para que el corazon responda al instante
    setMenu((lista) =>
      lista.map((m) => (m.id === plato.id ? { ...m, favorito: activo } : m))
    );
    setMensaje(null);
    try {
      const respuesta = await fetch(`${API_URL}/api/menus/${plato.id}/favorito`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ documento, activo }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo actualizar tu favorito");
      }
      setMensaje({
        texto: activo
          ? `❤️ ¡Ahora "${plato.platillo}" es tu favorito! Te avisaremos los días que toque.`
          : `Quitaste "${plato.platillo}" de tus favoritos.`,
        tipo: "exito",
      });
    } catch (err) {
      // Si fallo la peticion, revertimos el cambio optimista
      setMenu((lista) =>
        lista.map((m) => (m.id === plato.id ? { ...m, favorito: !activo } : m))
      );
      setMensaje({
        texto: err instanceof Error ? err.message : "Error desconocido",
        tipo: "error",
      });
    }
  };

  // Guarda la valoracion de un plato
  const valorar = async (platoId: number, puntos: number) => {
    if (!docValorar.trim()) {
      setMensaje({
        texto: "Escribe tu documento para poder calificar.",
        tipo: "error",
      });
      return;
    }

    setValorando(platoId);
    setMensaje(null);
    try {
      const respuesta = await fetch(`${API_URL}/api/menus/${platoId}/valorar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puntos, documento: docValorar.trim() }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar la valoración");
      }
      setMensaje({
        texto: `⭐ ¡Gracias por calificar con ${puntos} estrella${puntos === 1 ? "" : "s"}!`,
        tipo: "exito",
      });
      recargarMenu();
    } catch (err) {
      setMensaje({
        texto: err instanceof Error ? err.message : "Error desconocido",
        tipo: "error",
      });
    } finally {
      setValorando(null);
    }
  };

  // Dibuja las estrellas (llenas o vacias segun el promedio)
  const dibujarEstrellas = (valoracion: number | null | undefined) => {
    const valor = valoracion ?? 0;
    const redondeado = Math.round(valor);
    return (
      <span className="estrellas-mostrar">
        <span aria-label={`${valor.toFixed(1)} de 5 estrellas`}>
          {ESTRELLAS.map((n) => (
            <span key={n} className={n <= redondeado ? "estrella-llena" : "estrella-vacia"}>
              ★
            </span>
          ))}
        </span>
        {valor > 0 && <small> ({valor.toFixed(1)})</small>}
      </span>
    );
  };

  // Estrellas clicables para calificar. Al pasar el raton se sombrean
  // todas las estrellas hasta la señalada (vista previa) y al hacer clic
  // se sombrean las elegidas y quedan marcadas.
  const estrellasCalificar = (platoId: number) => {
    // la cantidad sombreada ahora mismo: la vista previa si existe,
    // si no la que el estudiante ya eligio
    const sombreadas =
      previa?.platoId === platoId ? previa.valor : seleccionada[platoId] || 0;

    return (
      <span
        className="estrellas-calificar"
        onMouseLeave={() => setPrevia(null)}
        role="radiogroup"
        aria-label={`Calificar plato con ${sombreadas} de 5 estrellas`}
      >
        {ESTRELLAS.map((n) => (
          <button
            key={n}
            type="button"
            className={`estrella-boton ${n <= sombreadas ? "llena" : ""}`}
            title={`${n} estrella${n === 1 ? "" : "s"}`}
            aria-label={`Calificar con ${n} estrella${n === 1 ? "" : "s"}`}
            disabled={valorando === platoId}
            onMouseEnter={() => setPrevia({ platoId, valor: n })}
            onClick={() => {
              setSeleccionada((prev) => ({ ...prev, [platoId]: n }));
              setPrevia(null);
              valorar(platoId, n);
            }}
          >
            ★
          </button>
        ))}
      </span>
    );
  };

  return (
    <section className="menu-pagina">
      <h1>Menú semanal</h1>
      <p className="subtitulo">
        El menú rota cada semana del mes y cada día se sirve una comida por
        jornada. Reserva antes de la fecha para asegurar tu minuta.
      </p>

      {/* Estado de carga */}
      {cargando && <p className="estado">Cargando menú…</p>}

      {/* Estado de error */}
      {error && (
        <p className="estado error" role="alert">
          ⚠️ {error}. Asegúrate de que el backend esté corriendo.
        </p>
      )}

      {/* Lista de platos de la semana elegida */}
      {!cargando && !error && (
        <>
          {/* Selector de semana del mes */}
          <div className="selector-semana" role="group" aria-label="Semana del mes">
            {[1, 2, 3, 4].map((semana) => (
              <button
                key={semana}
                type="button"
                className={semana === semanaActiva ? "activa" : ""}
                onClick={() => setSemanaActiva(semana)}
                aria-pressed={semana === semanaActiva}
              >
                Semana {semana}
              </button>
            ))}
          </div>

          {/* Filtro por variante (tipo de dieta) */}
          <div className="selector-semana" role="group" aria-label="Tipo de plato">
            {VARIANTES.map((v) => (
              <button
                key={v.valor}
                type="button"
                className={variante === v.valor ? "activa" : ""}
                onClick={() => setVariante(v.valor)}
                aria-pressed={variante === v.valor}
              >
                {v.etiqueta}
              </button>
            ))}
          </div>

          {/* Documento para poder valorar */}
          <label className="valorar-documento">
            Tu documento (para calificar platos)
            <input
              type="text"
              value={docValorar}
              onChange={(e) => setDocValorar(e.target.value)}
              placeholder="Escribe tu documento para valorar"
            />
          </label>

          {mensaje && (
            <p
              className={`estado ${mensaje.tipo}`}
              role={mensaje.tipo === "error" ? "alert" : "status"}
              aria-live={mensaje.tipo === "error" ? "assertive" : "polite"}
            >
              {mensaje.tipo === "exito" ? "✅ " : "⚠️ "}
              {mensaje.texto}
            </p>
          )}

          <div className="menu-dias">
            {menuSemana.length === 0 && (
              <p className="estado">
                No hay platos que coincidan con el filtro elegido para la
                semana {semanaActiva}.
              </p>
            )}
            {diasOrden.map((dia) => {
              const platosDia = menuSemana.filter(
                (item) => normalizar(item.dia) === normalizar(dia)
              );
              if (platosDia.length === 0) return null;
              return (
                <section key={dia} className="menu-dia">
                  <h2 className="menu-dia-titulo">{dia}</h2>
                  <div className="menu-dia-platos">
                    {platosDia.map((item) => (
                      <article key={item.id} className="plato">
                        {item.imagen && (
                          <img
                            className="plato-imagen"
                            src={item.imagen}
                            alt={item.platillo}
                            loading="lazy"
                          />
                        )}
                        <div className="plato-cuerpo">
                          <div className="plato-cabecera">
                            <span className="etiqueta-comida">{item.jornada}</span>
                            <span className="plato-dia">Semana {item.semana}</span>
                          </div>
                          <h3>{item.platillo}</h3>
                          {/* Etiquetas del plato */}
                          <div className="plato-etiquetas">
                            {item.variante && item.variante !== "Estandar" && (
                              <span className="etiqueta-variante">
                                {normalizar(item.variante) === "celiaco"
                                  ? "Sin gluten"
                                  : VARIANTES.find((v) => v.valor === item.variante)?.etiqueta || item.variante}
                              </span>
                            )}
                            {item.recomendado && (
                              <span className="etiqueta-recomendado">Recomendado</span>
                            )}
                            {item.popular && (
                              <span className="etiqueta-popular">Popular</span>
                            )}
                          </div>
                          <p>{item.descripcion}</p>
                          <div className="plato-pie">
                            <div className="plato-valoracion">
                              {dibujarEstrellas(item.valoracion)}
                              {item.votos ? (
                                <small> · {item.votos} voto{item.votos === 1 ? "" : "s"}</small>
                              ) : null}
                            </div>
                            {item.calorias && (
                              <span className="plato-calorias">{item.calorias} kcal</span>
                            )}
                          </div>
                        </div>
                        <div className="plato-calificar">
                          {esEstudiante && (
                            <button
                              type="button"
                              className={`boton-favorito ${item.favorito ? "activo" : ""}`}
                              onClick={() => alternarFavorito(item)}
                              aria-pressed={item.favorito}
                              aria-label={
                                item.favorito
                                  ? `Quitar ${item.platillo} de favoritos`
                                  : `Marcar ${item.platillo} como favorito`
                              }
                              title={
                                item.favorito
                                  ? "Quitar de favoritos"
                                  : "Marcar como favorito"
                              }
                            >
                              {item.favorito ? "❤️" : "🤍"}
                            </button>
                          )}
                          <small>Califica este plato:</small>
                          {estrellasCalificar(item.id)}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default Menu;