// ============================================================
// Pagina de inicio (Home)
// Presenta la marca PAE y el proposito del programa.
// ============================================================

import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="home">
      {/* Bloque hero: mensaje principal con accion */}
      <div className="hero-pae">
        <div className="hero-texto">
          <h1>Programa de Alimentación Escolar</h1>
          <p className="hero-sub">
            Reserva tu minuta, confirma tu asistencia y juntos reducimos el
            desperdicio de alimentos en nuestra institución.
          </p>
          <div className="hero-acciones">
            <Link to="/reserva" className="boton boton-primario">
              Reservar comida hoy
            </Link>
            <Link to="/menu" className="boton boton-secundario">
              Ver menú semanal
            </Link>
          </div>
        </div>
        <div className="hero-emoticon" aria-hidden="true">
          🍽️
        </div>
      </div>

      {/* Seccion de beneficios con 3 tarjetas */}
      <h2 className="titulo-seccion">¿Por qué reservar?</h2>
      <div className="tarjetas">
        <article className="tarjeta">
          <span className="tarjeta-icono" aria-hidden="true">
            📋
          </span>
          <h3>Prepara lo justo</h3>
          <p>
            La cocina sabe cuántos estudiantes comerán cada día y prepara solo
            esa cantidad de minutas.
          </p>
        </article>

        <article className="tarjeta">
          <span className="tarjeta-icono" aria-hidden="true">
            🌱
          </span>
          <h3>Menos desperdicio</h3>
          <p>
            Menos comida que se bota significa menos recursos perdidos y un
            impacto positivo en el medio ambiente.
          </p>
        </article>

        <article className="tarjeta">
          <span className="tarjeta-icono" aria-hidden="true">
            ⏱️
          </span>
          <h3>Menos filas</h3>
          <p>
            Al reservar, tu minuta está lista al llegar al restaurante escolar.
            Ahorra tiempo a estudiantes y personal.
          </p>
        </article>
      </div>
    </section>
  );
}

export default Home;
