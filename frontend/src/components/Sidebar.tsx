// barra lateral de navegacion, se copio el estilo de la referencia
// en celular se esconde y sale con el boton de hamburguesa

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import InstalarApp from "./InstalarApp";
import { leerSesion, ROLES_LABEL } from "../config/sesion";

function Sidebar() {
  // abierto controla el menu en pantallas moviles
  const [abierto, setAbierto] = useState(false);
  // true cuando la pantalla es de movil (la sidebar se pliega)
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches
  );

  // Escucha los cambios de tamaño de pantalla para saber si es movil
  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 900px)");
    const alCambiar = (e: MediaQueryListEvent) => setEsMovil(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  const cerrar = () => setAbierto(false);
  const toggle = () => setAbierto((a) => !a);

  // Si hay una sesión activa (admin, cocina, etc.) mostramos el
  // enlace al panel con el nombre del rol en lugar de "Administrador"
  const sesion = leerSesion();
  const etiquetaPanel = sesion
    ? `⚙️ ${ROLES_LABEL[sesion.rol] || sesion.rol}`
    : "⚙️ Administrador";

  // En movil, cuando el menu esta cerrado lo sacamos del foco del
  // teclado y de los lectores de pantalla (esta oculto fuera de la
  // pantalla). En escritorio siempre es navegable.
  const sinInteraccion = esMovil && !abierto;

  return (
    <>
      {/* Boton hamburguesa: solo visible en movil */}
      <button
        type="button"
        className={`sidebar-boton ${abierto ? "abierto" : ""}`}
        onClick={toggle}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        aria-controls="sidebar-nav"
      >
        {abierto ? "✕" : "☰"}
      </button>

      <aside
        id="sidebar-nav"
        className={`sidebar ${abierto ? "abierto" : ""}`}
        role="navigation"
        aria-label="Navegación principal"
        inert={sinInteraccion || undefined}
      >
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
            {etiquetaPanel}
          </NavLink>
          <InstalarApp />
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
