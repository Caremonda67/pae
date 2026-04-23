// pagina principal, sigue la estructura de la referencia:
// hero, comida del dia, metricas, impacto, menu de la semana, avisos,
// galeria y cita
//
// Las metricas (estudiantes, instituciones, colaboradores) son REALES:
// se cuentan desde la base. La comida del dia viene de /api/menus/hoy
// que calcula la semana del mes y el dia actual.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface MenuItem {
  id: number;
  semana: number;
  dia: string;
  jornada: string;
  platillo: string;
  descripcion: string;
  calorias?: number;
  imagen?: string;
}

// lo que devuelve /api/menus/hoy
interface ComidaHoy {
  semana: number;
  dia: string;
  platos: MenuItem[];
}

const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Nombre del dia con la primera letra en mayuscula
function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Quita los acentos para comparar nombres de dias sin problemas
// (ej: "Miércoles" del formulario vs "Miercoles" del seed)
function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// un aviso que llega del backend
interface Aviso {
  id: number;
  titulo: string;
  texto: string;
  fecha?: string;
  imagen?: string;
}

// una foto de la galeria del programa (publicada por el admin)
interface FotoGaleria {
  id: number;
  titulo: string;
  imagen: string;
}

function Home() {
  // Menu completo (se usa para buscar y para la galeria)
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuError, setMenuError] = useState("");
  const [menuCargando, setMenuCargando] = useState(true);
  // Comida de hoy (semana del mes + dia actual, desde el backend)
  const [comidaHoy, setComidaHoy] = useState<ComidaHoy | null>(null);
  // Metricas reales de la base
  const [metricas, setMetricas] = useState({
    estudiantes: 0,
    instituciones: 0,
    colaboradores: 0,
  });
  // Avisos publicados por el administrador (vienen de la base)
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  // Fotos propias de la galeria (publicadas por el administrador)
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);
  const [buscador, setBuscador] = useState("");
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  // referencia al contenedor del buscador para detectar clic fuera
  const buscadorRef = useRef<HTMLDivElement>(null);
  const navegar = useNavigate();

  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/menus`);
        if (!respuesta.ok) throw new Error("No se pudo cargar el menú");
        setMenu(await respuesta.json());
      } catch (err) {
        setMenuError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setMenuCargando(false);
      }
    };
    cargarMenu();

    // Comida del dia de hoy (el backend calcula semana y dia)
    const cargarComidaHoy = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/menus/hoy`);
        if (respuesta.ok) setComidaHoy(await respuesta.json());
      } catch {
        setComidaHoy(null);
      }
    };
    cargarComidaHoy();

    // Metricas reales: estudiantes, instituciones y colaboradores
    const cargarMetricas = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/metricas`);
        if (respuesta.ok) setMetricas(await respuesta.json());
      } catch {
        // si falla se quedan en 0
      }
    };
    cargarMetricas();

    // Tambien cargamos los avisos publicados
    const cargarAvisos = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/avisos`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar los avisos");
        setAvisos(await respuesta.json());
      } catch {
        setAvisos([]);
      }
    };
    cargarAvisos();

    // Y las fotos de la galeria del programa
    const cargarGaleria = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/galeria`);
        if (!respuesta.ok) throw new Error("No se pudo cargar la galería");
        setGaleria(await respuesta.json());
      } catch {
        setGaleria([]);
      }
    };
    cargarGaleria();
  }, []);

  // Cierra el desplegable cuando se hace clic fuera del buscador
  useEffect(() => {
    const alClicFuera = (e: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) {
        setBuscadorAbierto(false);
      }
    };
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  // Filtra el menu segun lo que el usuario escriba en el buscador
  const menuFiltrado = menu.filter((item) => {
    const busqueda = buscador.trim().toLowerCase();
    if (!busqueda) return true;
    return (
      item.platillo.toLowerCase().includes(busqueda) ||
      item.dia.toLowerCase().includes(busqueda) ||
      item.descripcion.toLowerCase().includes(busqueda)
    );
  });

  // Resultados en vivo para el desplegable: platos y avisos
  const resultadosBusqueda = () => {
    const busqueda = buscador.trim().toLowerCase();
    if (!busqueda) return { platos: [], avisosResultado: [] };

    const platos = menu.filter(
      (item) =>
        item.platillo.toLowerCase().includes(busqueda) ||
        item.dia.toLowerCase().includes(busqueda) ||
        item.descripcion.toLowerCase().includes(busqueda)
    );

    const avisosResultado = avisos.filter(
      (aviso) =>
        aviso.titulo.toLowerCase().includes(busqueda) ||
        aviso.texto.toLowerCase().includes(busqueda)
    );

    return { platos, avisosResultado };
  };

  const { platos, avisosResultado } = resultadosBusqueda();
  const hayResultados = platos.length > 0 || avisosResultado.length > 0;
  const busquedaActiva = buscador.trim() !== "";

  // Menu de la semana actual: el de la semana del mes de hoy
  const menuSemana = comidaHoy
    ? menu.filter((item) => item.semana === comidaHoy.semana)
    : [];

  // Galeria combinada: fotos propias del admin + platos con foto +
  // avisos con foto. Cada una con su titulo como pie de foto.
  const fotosGaleria = [
    ...galeria.map((f) => ({ id: `g-${f.id}`, titulo: f.titulo, imagen: f.imagen })),
    ...menu
      .filter((item) => item.imagen)
      .map((item) => ({ id: `m-${item.id}`, titulo: item.platillo, imagen: item.imagen! })),
    ...avisos
      .filter((a) => a.imagen)
      .map((a) => ({ id: `a-${a.id}`, titulo: a.titulo, imagen: a.imagen! })),
  ].slice(0, 6);

  return (
    <div className="home-pae">
      {/* ===== HERO ===== */}
      <section className="hero-pae">
        <div className="hero-texto">
          <span className="hero-badge">Programa de Alimentación Escolar</span>
          <h1>Buena alimentación, mejor aprendizaje, mejor futuro.</h1>
          <p className="hero-sub">
            El PAE garantiza alimentación saludable para el bienestar y
            desarrollo de nuestros estudiantes.
          </p>

          {/* Buscador que filtra el menu y muestra resultados en vivo */}
          <div className="buscador-contenedor" ref={buscadorRef}>
            <div className="buscador">
              <span aria-hidden="true">🔍</span>
              <input
                type="search"
                placeholder="Buscar platillo, día o aviso..."
                value={buscador}
                onChange={(e) => {
                  setBuscador(e.target.value);
                  setBuscadorAbierto(true);
                }}
                onFocus={() => setBuscadorAbierto(true)}
              />
            </div>

            {buscadorAbierto && busquedaActiva && (
              <div className="buscador-resultados">
                {platos.length > 0 && (
                  <>
                    <span className="buscador-titulo">🍽️ Platos del menú</span>
                    {platos.map((plato) => (
                      <button
                        key={plato.id}
                        type="button"
                        className="buscador-resultado"
                        onClick={() => {
                          navegar("/menu");
                          setBuscadorAbierto(false);
                        }}
                      >
                        <strong>{plato.platillo}</strong>
                        <small>
                          {plato.dia} · {plato.jornada}
                        </small>
                      </button>
                    ))}
                  </>
                )}

                {avisosResultado.length > 0 && (
                  <>
                    <span className="buscador-titulo">📢 Avisos</span>
                    {avisosResultado.map((aviso) => (
                      <button
                        key={aviso.id}
                        type="button"
                        className="buscador-resultado"
                        onClick={() => {
                          navegar("/noticias");
                          setBuscadorAbierto(false);
                        }}
                      >
                        <strong>{aviso.titulo}</strong>
                        <small>{aviso.texto}</small>
                      </button>
                    ))}
                  </>
                )}

                {!hayResultados && (
                  <span className="buscador-vacio">
                    No se encontró nada para "{buscador}".
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="hero-acciones">
            <Link to="/reserva" className="boton boton-primario">
              Reservar mi comida
            </Link>
            <Link to="/sobre" className="boton boton-secundario">
              Conoce más
            </Link>
          </div>
        </div>

        <div className="hero-emoticon" aria-hidden="true">
          🍽️
        </div>
      </section>

      {/* ===== COMIDA DEL DIA (grande, con imagen) ===== */}
      {comidaHoy && comidaHoy.platos.length > 0 && (
        <section className="comida-dia">
          <div className="seccion-titulo">
            <h2>🍽️ Comida de hoy · {capitalizar(comidaHoy.dia)}</h2>
            <span className="comida-dia-semana">
              Semana {comidaHoy.semana} del mes
            </span>
          </div>
          <div className="comida-dia-lista">
            {comidaHoy.platos.map((plato) => (
              <article key={plato.id} className="comida-dia-tarjeta">
                {plato.imagen ? (
                  <img
                    className="comida-dia-imagen"
                    src={plato.imagen}
                    alt={plato.platillo}
                    loading="lazy"
                  />
                ) : (
                  <div className="comida-dia-imagen comida-dia-sin-foto">
                    🍽️
                  </div>
                )}
                <div className="comida-dia-info">
                  <span className="comida-dia-jornada">{plato.jornada}</span>
                  <h3>{plato.platillo}</h3>
                  <p>{plato.descripcion}</p>
                  {plato.calorias && (
                    <span className="etiqueta-comida">
                      🔥 {plato.calorias} kcal
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
          <Link to="/reserva" className="boton boton-primario">
            Reservar mi comida
          </Link>
        </section>
      )}

      {/* ===== METRICAS (reales, contadas desde la base) ===== */}
      <section className="metricas">
        <article className="metrica">
          <span className="metrica-numero">
            {metricas.estudiantes.toLocaleString("es-CO")}
          </span>
          <span className="metrica-etiqueta">Estudiantes beneficiarios</span>
          <span className="metrica-detalle">Registrados en el programa</span>
        </article>
        <article className="metrica">
          <span className="metrica-numero">
            {metricas.instituciones.toLocaleString("es-CO")}
          </span>
          <span className="metrica-etiqueta">Instituciones educativas</span>
          <span className="metrica-detalle">Cobertura actual</span>
        </article>
        <article className="metrica">
          <span className="metrica-numero">
            {metricas.colaboradores.toLocaleString("es-CO")}
          </span>
          <span className="metrica-etiqueta">Colaboradores del PAE</span>
          <span className="metrica-detalle">Equipo comprometido</span>
        </article>
      </section>

      {/* ===== IMPACTO ===== */}
      <section className="seccion-pae impacto">
        <div className="impacto-texto">
          <span className="seccion-etiqueta">Impacto del PAE</span>
          <h2>Nutriendo hoy, mejores mañanas</h2>
          <p>
            Una buena alimentación impulsa el aprendizaje y el desarrollo.
            Gracias al programa, nuestros estudiantes tienen la energía que
            necesitan para concentrarse y aprender.
          </p>
          <Link to="/beneficiarios" className="enlace-ver">
            Ver más →
          </Link>
        </div>
        <div className="impacto-caja">
          <span className="seccion-etiqueta">Cobertura del programa</span>
          <p>En el municipio, garantizando alimentación a la comunidad educativa.</p>
        </div>
      </section>

      {/* ===== MENU DE LA SEMANA (semana actual del mes) ===== */}
      <section className="seccion-pae">
        <div className="seccion-titulo">
          <h2>Menú de esta semana</h2>
          {comidaHoy && (
            <span className="comida-dia-semana">Semana {comidaHoy.semana} del mes</span>
          )}
          <Link to="/menu" className="enlace-ver">
            Ver completo →
          </Link>
        </div>

        {menuError && <p className="estado error">⚠️ {menuError}</p>}

        {/* Esqueleto de carga mientras llega el menu */}
        {menuCargando && (
          <div className="skeleton-lista">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton-fila">
                <span className="skeleton skeleton-dia" />
                <span className="skeleton skeleton-plato" />
              </div>
            ))}
          </div>
        )}

        {!menuCargando && menuSemana.length > 0 && (
          <div className="tabla-menu">
            {diasOrden
              .map((dia) => ({
                dia,
                platos: menuFiltrado.filter(
                  (item) => item.semana === comidaHoy?.semana && normalizar(item.dia) === normalizar(dia)
                ),
              }))
              .filter((grupo) => grupo.platos.length > 0)
              .map((grupo) => (
                <div key={grupo.dia} className="grupo-menu-dia">
                  <span className="fila-dia">{grupo.dia}</span>
                  <div className="grupo-menu-platos">
                    {grupo.platos.map((item) => (
                      <div key={item.id} className="fila-menu-jornada">
                        <span className="fila-jornada">{item.jornada}</span>
                        <span className="fila-platillo">{item.platillo}</span>
                        <span className="fila-descripcion">{item.descripcion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {buscador.trim() !== "" && menuFiltrado.length === 0 && (
              <p className="estado">No se encontró nada para "{buscador}".</p>
            )}
          </div>
        )}

        {!menuCargando && menu.length === 0 && (
          <p className="estado">El menú aún no está publicado.</p>
        )}
      </section>

      {/* ===== AVISOS ===== */}
      <section className="seccion-pae">
        <div className="seccion-titulo">
          <h2>Avisos importantes</h2>
          <Link to="/noticias" className="enlace-ver">
            Ver todos los avisos →
          </Link>
        </div>
        <div className="avisos">
          {avisos.length === 0 && (
            <p className="estado">Aún no hay avisos publicados.</p>
          )}
          {avisos.map((aviso) => (
            <article key={aviso.id} className="aviso">
              {aviso.imagen && (
                <img
                  className="aviso-imagen"
                  src={aviso.imagen}
                  alt={aviso.titulo}
                  loading="lazy"
                />
              )}
              <h3>{aviso.titulo}</h3>
              <p>{aviso.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ===== GALERIA ===== */}
      <section className="seccion-pae">
        <div className="seccion-titulo">
          <h2>Galería</h2>
          <Link to="/noticias" className="enlace-ver">
            Ver más →
          </Link>
        </div>
        {fotosGaleria.length === 0 ? (
          <p className="estado">
            Aún no hay fotos. El equipo sube imágenes del menú y del programa.
          </p>
        ) : (
          <div className="galeria">
            {fotosGaleria.map((foto) => (
              <figure key={foto.id} className="galeria-item">
                <img src={foto.imagen} alt={foto.titulo} loading="lazy" />
                <figcaption>{foto.titulo}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* ===== CITA ===== */}
      <section className="cita">
        <blockquote>
          "La educación es el arma más poderosa que puedes usar para cambiar el
          mundo."
        </blockquote>
        <p className="cita-autor">— Nelson Mandela</p>
      </section>
    </div>
  );
}

export default Home;
