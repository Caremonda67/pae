// ============================================================
// Pagina de Menu (Catalogo)
// Muestra el menu semanal del PAE. Los datos vienen del backend
// (Express + Supabase) mediante fetch.
// ============================================================

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
}

const diasOrden = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
];

function Menu() {
  // menu: lista de platos cargados desde el backend
  const [menu, setMenu] = useState<MenuItem[]>([]);
  // cargando: controla el estado de carga (requisito UX del proyecto)
  const [cargando, setCargando] = useState(true);
  // error: guarda el mensaje si algo sale mal
  const [error, setError] = useState("");

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
                </div>
                {item.calorias && (
                  <span className="plato-calorias">{item.calorias} kcal</span>
                )}
              </article>
            ))}
        </div>
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
