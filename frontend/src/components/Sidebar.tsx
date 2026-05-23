// barra lateral de navegacion, se copio el estilo de la referencia
// en celular se esconde y sale con el boton de hamburguesa

import { useState } from "react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  // abierto controla el menu en pantallas moviles
  const [abierto, setAbierto] = useState(false);

  const cerrar = () => setAbierto(false);
  const toggle = () => setAbierto((a) => !a);

  return (
    <>
      {/* Boton hamburguesa: solo visible en movil */}
      <button
        type="button"
        className="sidebar-boton"
        onClick={toggle}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        aria-controls="sidebar-nav"
      >
        {abierto ? "✕" : "☰"}
      </button>

      <aside id="sidebar-nav" className={`sidebar ${abierto ? "abierto" : ""}`} role="navigation" aria-label="Navegación principal">
        <div className="sidebar-marca">
          <span className="sidebar-logo">🍽️</span>
          <div>
            <strong>PAE</strong>
            <span className="sidebar-submarca">Programa de Alimentación Escolar</span>
          </div>
        </div>

        <nav className="sidebar-enlaces">
          <NavLink to="/" end onClick={cerrar}>
            <span className="nav-icono">🏠</span> Inicio
          </NavLink>
          <NavLink to="/sobre" onClick={cerrar}>
            <span className="nav-icono">📘</span> Sobre el PAE
          </NavLink>
          <NavLink to="/menu" onClick={cerrar}>
            <span className="nav-icono">🍽️</span> Menú semanal
          </NavLink>
          <NavLink to="/beneficiarios" onClick={cerrar}>
            <span className="nav-icono">👥</span> Beneficiarios
          </NavLink>
          <NavLink to="/noticias" onClick={cerrar}>
            <span className="nav-icono">📰</span> Noticias
          </NavLink>
          <NavLink to="/galeria" onClick={cerrar}>
            <span className="nav-icono">🖼️</span> Galería
          </NavLink>
          <NavLink to="/reportes" onClick={cerrar}>
            <span className="nav-icono">📋</span> Reportes
          </NavLink>
          <NavLink to="/estadisticas" onClick={cerrar}>
            <span className="nav-icono">📊</span> Estadísticas
          </NavLink>
          <NavLink to="/contacto" onClick={cerrar}>
            <span className="nav-icono">✉️</span> Contacto
          </NavLink>
        </nav>

        <div className="sidebar-acciones">
          <NavLink to="/reserva" onClick={cerrar} className="sidebar-boton-reserva">
            🥗 Reservar comida
          </NavLink>
          <NavLink to="/admin" onClick={cerrar} className="sidebar-enlace-admin">
            ⚙️ Administrador
          </NavLink>
        </div>
      </aside>

      {/* Fondo oscuro que cierra el menu en movil */}
      {abierto && (
        <div className="sidebar-fondo" onClick={() => setAbierto(false)} />
      )}
    </>
  );
}

export default Sidebar;
