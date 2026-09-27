import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { guardarSesion, leerSesion, suscribirseASesion } from "../config/sesion";
import { CATEGORIAS_JUEGOS, etiquetaDispositivo, type Juego } from "./juegos/types";
import ModalSubirJuego from "./juegos/ModalSubirJuego";
import ReproductorJuego from "./juegos/ReproductorJuego";
import MisJuegos from "./juegos/MisJuegos";

export default function Juegos() {
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [categoria, setCategoria] = useState<string>("Todas");
  const [dispositivo, setDispositivo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"populares" | "recientes">("populares");
  const [verMisJuegos, setVerMisJuegos] = useState(false);
  const [novedadesAbiertas, setNovedadesAbiertas] = useState<number | null>(null);

  const [juegoJugando, setJuegoJugando] = useState<Juego | null>(null);
  const [modalSubir, setModalSubir] = useState(false);
  const [modalLogin, setModalLogin] = useState(false);
  const [loginUsuario, setLoginUsuario] = useState("");
  const [loginClave, setLoginClave] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginCargando, setLoginCargando] = useState(false);
  const [sesion, setSesion] = useState(() => leerSesion());

  const tieneSesion = Boolean(sesion);
  const esPersonalPAE = sesion?.rol === "admin" || sesion?.rol === "coordinador";
  const puedePublicar = Boolean(sesion && ["estudiante", "admin", "coordinador"].includes(sesion.rol));

  useEffect(() => {
    setSesion(leerSesion());
    return suscribirseASesion(() => setSesion(leerSesion()));
  }, []);

  const intentarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsuario.trim() || !loginClave) {
      setLoginError("Ingresa el usuario (documento para estudiantes) y la clave.");
      return;
    }
    setLoginCargando(true);
    setLoginError("");
    try {
      const respuesta = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: loginUsuario.trim(), clave: loginClave }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "Usuario o clave incorrectos");
      }
      guardarSesion({
        token: datos.token,
        rol: datos.rol,
        usuario: datos.usuario,
        nombre: datos.nombre,
      });
      setLoginUsuario("");
      setLoginClave("");
      setModalLogin(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoginCargando(false);
    }
  };

  const cargarJuegos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (categoria !== "Todas") params.append("categoria", categoria);
      if (dispositivo !== "todos") params.append("dispositivo", dispositivo);
      if (busqueda.trim()) params.append("q", busqueda.trim());
      params.append("orden", orden);

      const resp = await fetch(`${API_URL}/api/juegos?${params.toString()}`);
      if (!resp.ok) throw new Error("No se pudieron cargar los juegos");
      const data = await resp.json();
      setJuegos(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }, [categoria, dispositivo, busqueda, orden]);

  useEffect(() => {
    cargarJuegos();
  }, [cargarJuegos]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarJuegos();
  };

  const handleCerrarReproductor = useCallback(() => {
    setJuegoJugando(null);
  }, []);

  const handleIncrementarVistas = useCallback((id: number) => {
    setJuegos((prev) =>
      prev.map((j) => (j.id === id ? { ...j, vistas: (j.vistas || 0) + 1 } : j))
    );
    setJuegoJugando((actual) =>
      actual && actual.id === id ? { ...actual, vistas: (actual.vistas || 0) + 1 } : actual
    );
  }, []);

  return (
    <section className="arcade-pagina">
      <header className="arcade-hero">
        <div className="arcade-hero-decoraciones" aria-hidden="true">
          <span className="arcade-flotante flotante-1">🎮</span>
          <span className="arcade-flotante flotante-2">🍎</span>
          <span className="arcade-flotante flotante-3">⚡</span>
          <span className="arcade-flotante flotante-4">🏆</span>
          <span className="arcade-flotante flotante-5">🥕</span>
        </div>
        <div className="arcade-hero-contenido">
          <span className="arcade-tag">🎮 Zona de Gamificación Escolar</span>
          <h1>Arcade Educativo PAE</h1>
          <p className="subtitulo">
            Aprende sobre nutrición, alimentación balanceada y reducción del desperdicio a través de
            videojuegos interactivos creados por la comunidad estudiantil.
          </p>

          <div className="arcade-hero-acciones">
            {puedePublicar && (
              <button
                type="button"
                className={`boton boton-arcade-destacado ${verMisJuegos ? "boton-secundario" : "boton-primario"}`}
                onClick={() => setVerMisJuegos((v) => !v)}
              >
                🎮 {verMisJuegos ? "← Ver catálogo" : "Mis juegos"}
              </button>
            )}
            {!tieneSesion ? (
              <button
                type="button"
                className="boton boton-primario boton-arcade-destacado"
                onClick={() => setModalLogin(true)}
              >
                🔑 Inicia sesión para subir tu juego
              </button>
            ) : (
              !verMisJuegos && puedePublicar && (
                <button
                  type="button"
                  className="boton boton-primario boton-arcade-destacado"
                  onClick={() => setModalSubir(true)}
                >
                  🚀 {esPersonalPAE ? "Publicar juego (Equipo PAE)" : "Enviar mi videojuego"}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <div className="arcade-filtros">
        <form onSubmit={handleBuscar} className="arcade-busqueda">
          <input
            type="text"
            placeholder="Buscar por título, temática o autor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="boton boton-secundario">
            🔍 Buscar
          </button>
        </form>

        <div className="arcade-orden">
          <button
            type="button"
            className={`chip-orden ${orden === "populares" ? "activo" : ""}`}
            onClick={() => setOrden("populares")}
          >
            🔥 Más jugados
          </button>
          <button
            type="button"
            className={`chip-orden ${orden === "recientes" ? "activo" : ""}`}
            onClick={() => setOrden("recientes")}
          >
            ✨ Más recientes
          </button>
        </div>
      </div>

      {!verMisJuegos && (
        <nav className="arcade-categorias" aria-label="Categorías de juegos">
          {CATEGORIAS_JUEGOS.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`categoria-chip ${categoria === cat ? "seleccionada" : ""}`}
              onClick={() => setCategoria(cat)}
            >
              {cat}
            </button>
          ))}

          <div className="arcade-dispositivo-grupo">
            <span className="arcade-dispositivo-titulo">Dispositivo:</span>
            <button
              type="button"
              className={`categoria-chip dispositivo-chip ${dispositivo === "todos" ? "seleccionada" : ""}`}
              onClick={() => setDispositivo("todos")}
            >
              Todos
            </button>
            <button
              type="button"
              className={`categoria-chip dispositivo-chip ${dispositivo === "pc" ? "seleccionada" : ""}`}
              onClick={() => setDispositivo("pc")}
            >
              🖥️ PC
            </button>
            <button
              type="button"
              className={`categoria-chip dispositivo-chip ${dispositivo === "movil" ? "seleccionada" : ""}`}
              onClick={() => setDispositivo("movil")}
            >
              📱 Celular
            </button>
          </div>
        </nav>
      )}

      {verMisJuegos ? (
        <MisJuegos
          sesion={sesion}
          alEnviar={() => {
            setVerMisJuegos(false);
            cargarJuegos();
          }}
        />
      ) : cargando ? (
          <p className="estado">🎮 Cargando catálogo de juegos...</p>
        ) : error ? (
          <p className="estado error" role="alert">⚠️ {error}</p>
        ) : juegos.length === 0 ? (
        <div className="arcade-vacio">
          <span className="arcade-vacio-icono">🕹️</span>
          <h3>No se encontraron juegos en esta categoría</h3>
          <p>{esPersonalPAE ? "Publica un juego educativo oficial del PAE para esta categoría." : "Sé el primer estudiante en publicar un juego sobre este tema."}</p>
          {puedePublicar && (
            <button
              type="button"
              className="boton boton-primario"
              onClick={() => setModalSubir(true)}
            >
              {esPersonalPAE ? "🚀 Publicar juego (Equipo PAE)" : "🚀 Publicar mi juego ahora"}
            </button>
          )}
        </div>
      ) : (
        <div className="arcade-grid">
          {juegos.map((juego, index) => (
            <article
              key={juego.id}
              className="tarjeta-juego"
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="tarjeta-juego-portada" onClick={() => setJuegoJugando(juego)}>
                <img
                  src={juego.portada_url || "/placeholder-juego.svg"}
                  alt={`Portada de ${juego.titulo}`}
                  loading="lazy"
                />
                <span className="badge-categoria-tarjeta">{juego.categoria}</span>
                <span className="tarjeta-juego-vistas">🔥 {juego.vistas}</span>
                <span className="tarjeta-juego-dispositivo" title={etiquetaDispositivo(juego.dispositivo)}>
                  {juego.dispositivo === "pc" ? "🖥️" : juego.dispositivo === "movil" ? "📱" : "🖥️📱"}
                </span>
                {juego.actualizado_en && (
                  <span className="tarjeta-juego-actualizado">🔄 v{juego.version || "2.0"}</span>
                )}
                <div className="tarjeta-juego-overlay">
                  <span className="boton-play-icono">▶</span>
                  <span className="texto-play">Jugar ahora</span>
                </div>
              </div>

              <div className="tarjeta-juego-cuerpo">
                <h3 title={juego.titulo}>{juego.titulo}</h3>
                <p className="tarjeta-juego-desc">
                  {juego.descripcion || "¡Diviértete y aprende con este juego educativo del PAE!"}
                </p>

                {juego.actualizado_en && (
                  <div className="juego-novedades">
                    <button
                      type="button"
                      className="juego-novedades-boton"
                      onClick={() =>
                        setNovedadesAbiertas((actual) => (actual === juego.id ? null : juego.id))
                      }
                      aria-expanded={novedadesAbiertas === juego.id}
                    >
                      🔄 Actualizado en v{juego.version || "2.0"}
                      <span>{novedadesAbiertas === juego.id ? "▲ Ocultar" : "▼ Ver qué cambió"}</span>
                    </button>
                    {novedadesAbiertas === juego.id && (
                      <div className="juego-novedades-contenido">
                        <p>{juego.novedades || "El autor actualizó este juego, pero no dejó detalles."}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="tarjeta-juego-pie">
                  <span className="tarjeta-juego-autor">
                    Por: <strong>{juego.autor_nombre}</strong>
                    {juego.autor_grado ? ` · ${juego.autor_grado}` : ""}
                  </span>
                  <button
                    type="button"
                    className="boton boton-primario boton-chico"
                    onClick={() => setJuegoJugando(juego)}
                  >
                    Jugar 🎮
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {juegoJugando && (
        <ReproductorJuego
          juego={juegoJugando}
          alCerrar={handleCerrarReproductor}
          alIncrementarVistas={handleIncrementarVistas}
        />
      )}

      {modalSubir && (
        <ModalSubirJuego
          abierto={modalSubir}
          alCerrar={() => setModalSubir(false)}
          alJuegoCreado={() => {
            cargarJuegos();
          }}
        />
      )}

      {modalLogin && (
        <div className="modal-login-overlay" role="dialog" aria-modal="true" aria-label="Inicia sesión">
          <div className="caja-login-juegos">
            <button
              type="button"
              className="modal-juego-cerrar"
              aria-label="Cerrar"
              onClick={() => setModalLogin(false)}
            >
              ✕
            </button>
            <h2>Inicia sesión</h2>
            <p className="subtitulo-login">
              Estudiantes: documento + PIN. Personal del PAE: usuario y clave de su cuenta.
            </p>
            <form onSubmit={intentarLogin} className="form-login-juegos">
              <label>
                Usuario (documento para estudiantes)
                <input
                  type="text"
                  value={loginUsuario}
                  onChange={(e) => setLoginUsuario(e.target.value)}
                  autoComplete="username"
                  placeholder="Ej: 1111548041"
                />
              </label>
              <label>
                Clave / PIN
                <input
                  type="password"
                  value={loginClave}
                  onChange={(e) => setLoginClave(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Tu PIN o clave"
                />
              </label>
              {loginError && <p className="login-error" role="alert">⚠️ {loginError}</p>}
              <button
                type="submit"
                className="boton boton-primario boton-login-juegos"
                disabled={loginCargando}
              >
                {loginCargando ? "Entrando..." : "🔑 Iniciar sesión"}
              </button>
            </form>
            <p className="pista-login-juegos">
              Si eres estudiante y aún no tienes PIN, pídelo al equipo del PAE.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
