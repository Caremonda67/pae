// ============================================================
// Pagina de Administrador
// 1. Muestra un login sencillo (contraseña definida por nosotros)
// 2. Al ingresar, muestra el panel con el total de reservas por
//    fecha: asi la cocina sabe cuantas minutas preparar.
// ============================================================

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Clave del panel. Para una app de produccion real esto deberia
// validarse contra el backend, pero aqui lo dejamos simple para el proyecto.
const CLAVE_ADMIN = "pae2026";

interface Totales {
  [fecha: string]: number;
}

function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  const [totales, setTotales] = useState<Totales>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Verifica la clave del panel
  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (clave === CLAVE_ADMIN) {
      setAutenticado(true);
      setErrorLogin("");
      cargarTotales();
    } else {
      setErrorLogin("Clave incorrecta");
    }
  };

  // Consulta al backend el total de reservas agrupadas por fecha
  const cargarTotales = async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await fetch(`${API_URL}/api/reservas/totales`);
      if (!respuesta.ok) throw new Error("No se pudo cargar los datos");
      setTotales(await respuesta.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  // ---------- Pantalla de login ----------
  if (!autenticado) {
    return (
      <section className="admin-pagina">
        <h1>Panel de administrador</h1>
        <form className="formulario" onSubmit={entrar}>
          <label>
            Clave del panel
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              placeholder="Ingresa la clave"
            />
          </label>
          {errorLogin && <p className="estado error">⚠️ {errorLogin}</p>}
          <button type="submit" className="boton boton-primario">
            Ingresar
          </button>
        </form>
      </section>
    );
  }

  // ---------- Panel de cocina ----------
  return (
    <section className="admin-pagina">
      <div className="admin-cabecera">
        <h1>Panel de cocina</h1>
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() => setAutenticado(false)}
        >
          Salir
        </button>
      </div>

      <p className="subtitulo">
        Minutas a preparar por fecha. Así se cocina exactamente lo que se
        reservó.
      </p>

      <button type="button" className="boton boton-secundario" onClick={cargarTotales}>
        Actualizar datos
      </button>

      {cargando && <p className="estado">Cargando…</p>}
      {error && <p className="estado error">⚠️ {error}</p>}

      {!cargando && !error && (
        <div className="lista-totales">
          {Object.keys(totales).length === 0 && (
            <p className="estado">Aún no hay reservas registradas.</p>
          )}
          {Object.entries(totales)
            .sort((a, b) => (a[0] < b[0] ? -1 : 1))
            .map(([fecha, cantidad]) => (
              <article key={fecha} className="total-fecha">
                <span className="total-fecha-nombre">{fecha}</span>
                <span className="total-fecha-cantidad">{cantidad} minutas</span>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}

export default Admin;
