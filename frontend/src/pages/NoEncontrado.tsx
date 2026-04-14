// pagina de error 404
// aparece cuando alguien escribe una ruta que no existe
// en la aplicacion, con enlace para volver al inicio

import { Link } from "react-router-dom";

function NoEncontrado() {
  return (
    <section className="no-encontrado">
      <span className="no-encontrado-icono" aria-hidden="true">
        🍽️
      </span>
      <h1>404</h1>
      <p>Ups, esa página no existe o el enlace cambió.</p>
      <Link to="/" className="boton boton-primario">
        Volver al inicio
      </Link>
    </section>
  );
}

export default NoEncontrado;
