// pagina del menu semanal
// los platos se cargan del backend con fetch y cada uno muestra
// su valoracion en estrellas. El estudiante puede calificar su
// plato con 1 a 5 estrellas y esa retroalimentacion ayuda a la
// cocina a mejorar el menu.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// URL del backend. En desarrollo local es http://localhost:4000
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Tipado de un plato del menu
interface MenuItem {
  id: number;
  dia: string;
  platillo: string;
  descripcion: string;
  calorias?: number;
  valoracion?: number | null;
  votos?: number;
}

const diasOrden = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
];

const ESTRELLAS = [1, 2, 3, 4, 5];

function Menu() {
  // menu: lista de platos cargados desde el backend
  const [menu, setMenu] = useState<MenuItem[]>([]);
  // cargando: controla el estado de carga (requisito UX del proyecto)
  const [cargando, setCargando] = useState(true);
  // error: guarda el mensaje si algo sale mal
  const [error, setError] = useState("");

  // documento para valorar (el mismo que usan para reservar)
  const [documento, setDocumento] = useState("");
  // plato que se esta calificando ahora mismo
  const [valorando, setValorando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: string } | null>(null);

  // useEffect se ejecuta una vez cuando la pagina se monta
  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/menus`);
        if (!respuesta.ok) throw new Error("No se pudo cargar el menú");
        const datos = await respuesta.json();
        setMenu(datos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    };
    cargarMenu();
  }, []);

  // Recarga el menu para actualizar los promedios
  const recargarMenu = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/menus`);
      if (!respuesta.ok) throw new Error("No se pudo cargar el menú");
      setMenu(await respuesta.json());
    } catch {
      // si falla, dejamos la lista como estaba
    }
  };

  // Guarda la valoracion de un plato
  const valorar = async (platoId: number, puntos: number) => {
    if (!documento.trim()) {
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
        body: JSON.stringify({ puntos, documento: documento.trim() }),
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
    return (
      <span className="estrellas-mostrar">
        {ESTRELLAS.map((n) => (
          <span key={n} className={n <= Math.round(valor) ? "estrella-llena" : "estrella-vacia"}>
            ★
          </span>
        ))}
        {valor > 0 && <small> {valor.toFixed(1)}</small>}
      </span>
    );
  };

  // Estrellas clicables para calificar
  const estrellasCalificar = (platoId: number) => (
    <span className="estrellas-calificar">
      {ESTRELLAS.map((n) => (
        <button
          key={n}
          type="button"
          className="estrella-boton"
          title={`${n} estrella${n === 1 ? "" : "s"}`}
          disabled={valorando === platoId}
          onClick={() => valorar(platoId, n)}
        >
          ★
        </button>
      ))}
    </span>
  );

  return (
    <section className="menu-pagina">
      <h1>Menú semanal</h1>
      <p className="subtitulo">
        Esto se servirá esta semana en el restaurante escolar. Reserva antes de
        la fecha para asegurar tu minuta.
      </p>

      {/* Estado de carga */}
      {cargando && <p className="estado">Cargando menú…</p>}

      {/* Estado de error */}
      {error && (
        <p className="estado error">
          ⚠️ {error}. Asegúrate de que el backend esté corriendo.
        </p>
      )}

      {/* Lista de platos ordenada por dia */}
      {!cargando && !error && (
        <>
          {/* Documento para poder valorar */}
          <label className="valorar-documento">
            Tu documento (para calificar platos)
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Escribe tu documento para valorar"
            />
          </label>

          {mensaje && (
            <p className={`estado ${mensaje.tipo}`}>
              {mensaje.tipo === "exito" ? "✅ " : "⚠️ "}
              {mensaje.texto}
            </p>
          )}

          <div className="lista-menu">
            {menu.length === 0 && (
              <p className="estado">Aún no hay platos publicados.</p>
            )}
            {diasOrden
              .map((dia) => menu.filter((item) => item.dia === dia))
              .flat()
              .map((item) => (
                <article key={item.id} className="plato">
                  <div>
                    <span className="plato-dia">{item.dia}</span>
                    <h3>{item.platillo}</h3>
                    <p>{item.descripcion}</p>
                    <div className="plato-valoracion">
                      {dibujarEstrellas(item.valoracion)}
                      {item.votos ? (
                        <small> · {item.votos} voto{item.votos === 1 ? "" : "s"}</small>
                      ) : null}
                    </div>
                    <div className="plato-calificar">
                      <small>Califica este plato:</small>
                      {estrellasCalificar(item.id)}
                    </div>
                  </div>
                  {item.calorias && (
                    <span className="plato-calorias">{item.calorias} kcal</span>
                  )}
                </article>
              ))}
          </div>
        </>
      )}

      <div className="centrar">
        <Link to="/reserva" className="boton boton-primario">
          Reservar mi minuta
        </Link>
      </div>
    </section>
  );
}

export default Menu;
