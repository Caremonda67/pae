// ============================================================
// Barra de navegacion principal
// Responsive: en movil muestra un menu hamburguesa.
// ============================================================

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  // abierto controla si el menu hamburguesa esta desplegado en movil
  const [abierto, setAbierto] = useState(false);

  const cerrar = () => setAbierto(false);

  return (
    <header className="nav">
      <div className="nav-interior">
        <Link to="/" className="nav-logo" onClick={cerrar}>
          🍽️ PAE
        </Link>

        {/* Boton hamburguesa: solo visible en movil */}
        <button
          type="button"
          className="nav-hamburguesa"
          onClick={() => setAbierto(!abierto)}
          aria-label="Abrir menu"
        >
          ☰
        </button>

        {/* Los enlaces se muestran si abierto=true (movil) o siempre (pantalla grande) */}
        <nav className={`nav-enlaces ${abierto ? "abierto" : ""}`}>
          <NavLink to="/" end onClick={cerrar}>
            Inicio
          </NavLink>
          <NavLink to="/menu" onClick={cerrar}>
            Menú
          </NavLink>
          <NavLink to="/reserva" onClick={cerrar}>
            Reservar comida
          </NavLink>
          <NavLink to="/contacto" onClick={cerrar}>
            Contacto
          </NavLink>
          <NavLink to="/admin" onClick={cerrar} className="nav-admin">
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
