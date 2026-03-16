// pagina principal, sigue la estructura de la referencia:
// hero, metricas, impacto, menu de la semana, avisos, galeria y cita

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface MenuItem {
  id: number;
  dia: string;
  platillo: string;
  descripcion: string;
  calorias?: number;
}

const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Avisos importantes (datos de ejemplo; en el futuro vienen del admin)
const AVISOS = [
  {
    titulo: "Suspensión del servicio",
    texto: "Viernes 6 de junio no habrá servicio por jornada pedagógica.",
  },
  {
    titulo: "Reunión informativa",
    texto: "Jueves 12 de junio a las 8:00 a.m. en el auditorio de la Institución.",
  },
  {
    titulo: "Actualización de datos",
    texto: "Recuerda mantener actualizada la información de los estudiantes.",
  },
];

function Home() {
  // Menu de la semana (se muestra una vista previa)
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuError, setMenuError] = useState("");
  const [buscador, setBuscador] = useState("");

  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/menus`);
        if (!respuesta.ok) throw new Error("No se pudo cargar el menú");
        setMenu(await respuesta.json());
      } catch (err) {
        setMenuError(err instanceof Error ? err.message : "Error desconocido");
      }
    };
    cargarMenu();
  }, []);

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

          {/* Buscador decorativo del sitio */}
          <div className="buscador">
            <span aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Buscar en el PAE..."
              value={buscador}
              onChange={(e) => setBuscador(e.target.value)}
            />
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

      {/* ===== METRICAS ===== */}
      <section className="metricas">
        <article className="metrica">
          <span className="metrica-numero">1.254</span>
          <span className="metrica-etiqueta">Estudiantes beneficiarios</span>
          <span className="metrica-detalle">Este año</span>
        </article>
        <article className="metrica">
          <span className="metrica-numero">23</span>
          <span className="metrica-etiqueta">Instituciones educativas</span>
          <span className="metrica-detalle">Cobertura actual</span>
        </article>
        <article className="metrica">
          <span className="metrica-numero">125</span>
          <span className="metrica-etiqueta">Colaboradores del PAE</span>
          <span className="metrica-detalle">Comprometidos</span>
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

      {/* ===== MENU DE LA SEMANA ===== */}
      <section className="seccion-pae">
        <div className="seccion-titulo">
          <h2>Menú de esta semana</h2>
          <Link to="/menu" className="enlace-ver">
            Ver completo →
          </Link>
        </div>

        {menuError && <p className="estado error">⚠️ {menuError}</p>}

        {menu.length > 0 && (
          <div className="tabla-menu">
            {diasOrden
              .map((dia) => menu.find((item) => item.dia === dia))
              .filter(Boolean)
              .map((item) => (
                <article key={item!.id} className="fila-menu">
                  <span className="fila-dia">{item!.dia}</span>
                  <span className="fila-platillo">{item!.platillo}</span>
                  <span className="fila-descripcion">{item!.descripcion}</span>
                </article>
              ))}
          </div>
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
          {AVISOS.map((aviso) => (
            <article key={aviso.titulo} className="aviso">
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
        <div className="galeria">
          <div className="galeria-item">🍎 Alimentación balanceada</div>
          <div className="galeria-item">📚 Aprendizaje con energía</div>
          <div className="galeria-item">🤝 Equipo PAE</div>
        </div>
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
