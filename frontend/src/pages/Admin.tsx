// panel de administrador
// ahora el login es REAL: la clave se manda al backend, este la
// compara con ADMIN_CLAVE y devuelve un token que el panel guarda
// para llamar a las rutas protegidas. Ya no hay clave escrita en
// el codigo del navegador.
//
// Pestañas:
// - panel de cocina: minutas por fecha, asistencia y desperdicio
// - beneficiarios: registro de los estudiantes del programa
// - avisos: publicar y borrar noticias
// - notificaciones: confirmaciones de reserva enviadas
// - mensajes: los que llegan por el formulario de contacto

import { useEffect, useState } from "react";
import Buscador from "../components/Buscador";
import { coincide } from "../config/busqueda";
import { estadoReserva, GRADOS, horarioGrado } from "../config/horarios";
import { API_URL } from "../config/api";

// token guardado entre sesiones (el navegador lo conserva)
const TOKEN_KEY = "pae_admin_token";

function leerToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

// cabeceras con el token del admin para rutas protegidas
function cabeceras(token: string, cuerpo = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (cuerpo) headers["Content-Type"] = "application/json";
  return headers;
}

// una reserva que llega del backend
interface Reserva {
  id: number;
  estudiante: string;
  documento: string;
  sede: string;
  turno: string;
  fecha: string;
  asistio: boolean;
  grado?: string | null;
}

interface TotalFecha {
  reservas: number;
  asistieron: number;
}

interface Reporte {
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
  porSede: Record<string, { reservas: number; asistieron: number }>;
  porTurno: Record<string, { reservas: number; asistieron: number }>;
}

interface Aviso {
  id: number;
  titulo: string;
  texto: string;
  fecha?: string;
  imagen?: string;
}

// un plato del menu que llega del backend
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

// dia de la semana con su lista de platos
interface MenuDia {
  dia: string;
  platos: MenuItem[];
}

// una semana del mes con sus dias (menu rotativo)
interface MenuSemanaAdmin {
  semana: number;
  dias: MenuDia[];
}

interface Institucion {
  id: number;
  nombre: string;
}

interface Colaborador {
  id: number;
  nombre: string;
  rol?: string | null;
}

// plan diario de minutas a servir (ruta /api/reservas/plan)
interface PlanDia {
  fecha: string;
  porTurno: Record<string, number>;
  total: number;
}

// una foto de la galeria del programa
interface FotoGaleria {
  id: number;
  titulo: string;
  imagen: string;
  descripcion?: string;
}

interface Mensaje {
  id: number;
  nombre: string;
  correo: string;
  mensaje: string;
  created_at: string;
}

interface Beneficiario {
  id: number;
  documento: string;
  nombre: string;
  sede: string;
  turno: string;
  grado?: string;
}

interface Notificacion {
  id: number;
  tipo: string;
  destinatario: string;
  mensaje: string;
  enviado: boolean;
  created_at: string;
}

// pestañas del panel
type Pestana =
  | "panel"
  | "beneficiarios"
  | "menu"
  | "avisos"
  | "galeria"
  | "instituciones"
  | "colaboradores"
  | "notificaciones"
  | "mensajes";

function Admin() {
  const [autenticado, setAutenticado] = useState(leerToken() !== "");
  const [clave, setClave] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [pestana, setPestana] = useState<Pestana>("panel");

  const [totales, setTotales] = useState<Record<string, TotalFecha>>({});
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [menu, setMenu] = useState<MenuSemanaAdmin[]>([]);
  const [plan, setPlan] = useState<PlanDia[]>([]);
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  // formulario de institucion
  const [nombreInst, setNombreInst] = useState("");
  const [instError, setInstError] = useState("");
  const [instExito, setInstExito] = useState("");

  // formulario de colaborador
  const [nombreCol, setNombreCol] = useState("");
  const [rolCol, setRolCol] = useState("");
  const [colError, setColError] = useState("");
  const [colExito, setColExito] = useState("");

  // formulario de foto de galeria
  const [tituloGaleria, setTituloGaleria] = useState("");
  const [descripcionGaleria, setDescripcionGaleria] = useState("");
  const [imagenGaleria, setImagenGaleria] = useState("");
  const [subiendoImagenGaleria, setSubiendoImagenGaleria] = useState(false);
  const [galeriaError, setGaleriaError] = useState("");
  const [galeriaExito, setGaleriaExito] = useState("");

  // formulario de nuevo aviso
  const [tituloAviso, setTituloAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");
  const [fechaAviso, setFechaAviso] = useState("");
  const [imagenAviso, setImagenAviso] = useState("");
  const [subiendoImagenAviso, setSubiendoImagenAviso] = useState(false);
  const [avisoError, setAvisoError] = useState("");
  const [avisoExito, setAvisoExito] = useState("");

  // formulario de nuevo plato del menu
  const [semanaMenu, setSemanaMenu] = useState(1);
  const [diaMenu, setDiaMenu] = useState("Lunes");
  const [jornadaMenu, setJornadaMenu] = useState("Almuerzo");
  const [platilloMenu, setPlatilloMenu] = useState("");
  const [descripcionMenu, setDescripcionMenu] = useState("");
  const [caloriasMenu, setCaloriasMenu] = useState("");
  const [imagenMenu, setImagenMenu] = useState("");
  const [subiendoImagenMenu, setSubiendoImagenMenu] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [menuExito, setMenuExito] = useState("");

  // formulario de nuevo beneficiario
  const [docBen, setDocBen] = useState("");
  const [nombreBen, setNombreBen] = useState("");
  const [sedeBen, setSedeBen] = useState("Sede A");
  const [turnoBen, setTurnoBen] = useState("Almuerzo");
  const [gradoBen, setGradoBen] = useState("");
  const [benError, setBenError] = useState("");
  const [benExito, setBenExito] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // busquedas de cada pestana (se filtra en el navegador)
  const [busquedaReservas, setBusquedaReservas] = useState("");
  const [busquedaBeneficiarios, setBusquedaBeneficiarios] = useState("");
  const [busquedaMenu, setBusquedaMenu] = useState("");
  const [busquedaAvisos, setBusquedaAvisos] = useState("");
  const [busquedaGaleria, setBusquedaGaleria] = useState("");
  const [busquedaInstituciones, setBusquedaInstituciones] = useState("");
  const [busquedaColaboradores, setBusquedaColaboradores] = useState("");
  const [busquedaNotificaciones, setBusquedaNotificaciones] = useState("");
  const [busquedaMensajes, setBusquedaMensajes] = useState("");

  // Pide el token al backend comparando la clave con ADMIN_CLAVE
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoLogin(true);
    setErrorLogin("");
    try {
      const respuesta = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "Clave incorrecta");
      }
      localStorage.setItem(TOKEN_KEY, datos.token);
      setAutenticado(true);
    } catch (err) {
      setErrorLogin(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargandoLogin(false);
    }
  };

  // Cierra sesion (borra el token guardado)
  const salir = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAutenticado(false);
    setClave("");
  };

  // Carga todo: totales, reservas, reporte, avisos, mensajes,
  // beneficiarios y notificaciones (las protegidas usan el token)
  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    const token = leerToken();
    try {
      const [
        respTotales,
        respReservas,
        respReporte,
        respAvisos,
        respMensajes,
        respBeneficiarios,
        respNotificaciones,
        respMenu,
        respPlan,
        respGaleria,
        respInstituciones,
        respColaboradores,
      ] = await Promise.all([
        fetch(`${API_URL}/api/reservas/totales`),
        fetch(`${API_URL}/api/reservas`, { headers: cabeceras(token, false) }),
        fetch(`${API_URL}/api/reservas/reporte`),
        fetch(`${API_URL}/api/avisos`),
        fetch(`${API_URL}/api/contacto`, { headers: cabeceras(token, false) }),
        fetch(`${API_URL}/api/beneficiarios`),
        fetch(`${API_URL}/api/notificaciones`, { headers: cabeceras(token, false) }),
        fetch(`${API_URL}/api/menus`),
        fetch(`${API_URL}/api/reservas/plan?dias=7`),
        fetch(`${API_URL}/api/galeria`),
        fetch(`${API_URL}/api/instituciones`),
        fetch(`${API_URL}/api/colaboradores`),
      ]);

      const respuestas: [string, Response][] = [
        ["totales", respTotales],
        ["reservas", respReservas],
        ["reporte", respReporte],
        ["avisos", respAvisos],
        ["mensajes", respMensajes],
        ["beneficiarios", respBeneficiarios],
        ["notificaciones", respNotificaciones],
        ["menu", respMenu],
        ["plan", respPlan],
        ["galeria", respGaleria],
        ["instituciones", respInstituciones],
        ["colaboradores", respColaboradores],
      ];

      const fallo = respuestas.find(([, r]) => !r.ok);

      if (fallo) {
        const [nombre, r] = fallo;
        if (r.status === 401) {
          // el token expiro o dejo de ser valido: volvemos al login
          salir();
          throw new Error("Tu sesión expiró. Vuelve a entrar con la clave.");
        }
        throw new Error(`No se pudieron cargar los datos (${nombre}: ${r.status})`);
      }

      setTotales(await respTotales.json());
      setReservas(await respReservas.json());
      setReporte(await respReporte.json());
      setAvisos(await respAvisos.json());
      setMensajes(await respMensajes.json());
      setBeneficiarios(await respBeneficiarios.json());
      setNotificaciones(await respNotificaciones.json());

      // Agrupamos el menu por semana del mes y luego por dia
      const menus = (await respMenu.json()) as MenuItem[];
      const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      const normalizar = (t: string) =>
        t
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const semanas = [...new Set(menus.map((m) => m.semana))].sort((a, b) => a - b);
      setMenu(
        semanas.map((semana) => ({
          semana,
          dias: diasOrden
            .map((dia) => ({
              dia,
              platos: menus.filter(
                (m) => m.semana === semana && normalizar(m.dia) === normalizar(dia)
              ),
            }))
            .filter((d) => d.platos.length > 0),
        }))
      );

      setPlan(await respPlan.json());
      setGaleria(await respGaleria.json());
      setInstituciones(await respInstituciones.json());
      setColaboradores(await respColaboradores.json());
    } catch (err) {
      // si el token expiro o es invalido, pedimos login de nuevo
      if (err instanceof Error && err.message.includes("No se pudieron cargar")) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    } finally {
      setCargando(false);
    }
  };

  // Carga los datos apenas se abre el panel con una sesion ya guardada
  // (por ejemplo al recargar la pagina). Sin esto la pantalla se ve
  // vacia hasta que se vuelve a entrar con la clave.
  useEffect(() => {
    if (autenticado) cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  // Marca una reserva como asistida (o la desmarca)
  const marcarAsistencia = async (reserva: Reserva) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/reservas/${reserva.id}`, {
        method: "PUT",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({ asistio: !reserva.asistio }),
      });
      if (!respuesta.ok) throw new Error("No se pudo actualizar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Publica un aviso nuevo (si hay imagen subida, la adjunta)
  const publicarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoError("");
    setAvisoExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({
          titulo: tituloAviso,
          texto: textoAviso,
          fecha: fechaAviso,
          imagen: imagenAviso || null,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo publicar el aviso");
      }
      setTituloAviso("");
      setTextoAviso("");
      setFechaAviso("");
      setImagenAviso("");
      setAvisoExito("✅ Aviso publicado. Ya aparece en la página y el bot lo conoce.");
      cargarDatos();
    } catch (err) {
      setAvisoError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra un aviso
  const borrarAviso = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Sube una imagen al servidor y devuelve la URL publica.
  // Se usa tanto para las fotos del menu como para las de avisos.
  const subirImagen = async (archivo: File, setter: (url: string) => void) => {
    // Convierte la imagen a base64 para enviarla en el JSON
    const aBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result));
        lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
        lector.readAsDataURL(file);
      });

    try {
      const base64 = await aBase64(archivo);
      const respuesta = await fetch(`${API_URL}/api/archivos/subir`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({ base64, nombre: archivo.name }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo subir la imagen");
      }
      const datos = await respuesta.json();
      setter(datos.url);
      return datos.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      return "";
    }
  };

  // Guarda un plato nuevo del menu
  const registrarMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError("");
    setMenuExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/menus`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({
          semana: semanaMenu,
          dia: diaMenu,
          jornada: jornadaMenu,
          platillo: platilloMenu,
          descripcion: descripcionMenu,
          calorias: caloriasMenu ? Number(caloriasMenu) : null,
          imagen: imagenMenu || null,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar el plato");
      }
      setPlatilloMenu("");
      setDescripcionMenu("");
      setCaloriasMenu("");
      setImagenMenu("");
      setMenuExito("✅ Plato agregado al menú.");
      cargarDatos();
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra un plato del menu
  const borrarPlato = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/menus/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar el plato");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Guarda una foto nueva en la galeria
  const publicarFotoGaleria = async (e: React.FormEvent) => {
    e.preventDefault();
    setGaleriaError("");
    setGaleriaExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/galeria`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({
          titulo: tituloGaleria,
          imagen: imagenGaleria,
          descripcion: descripcionGaleria,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar la foto");
      }
      setTituloGaleria("");
      setDescripcionGaleria("");
      setImagenGaleria("");
      setGaleriaExito("✅ Foto publicada en la galería de la página de inicio.");
      cargarDatos();
    } catch (err) {
      setGaleriaError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra una foto de la galeria
  const borrarFotoGaleria = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/galeria/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar la foto");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Registra un beneficiario nuevo
  const registrarBeneficiario = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenError("");
    setBenExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({
          documento: docBen,
          nombre: nombreBen,
          sede: sedeBen,
          turno: turnoBen,
          grado: gradoBen,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo registrar");
      }
      setDocBen("");
      setNombreBen("");
      setGradoBen("");
      setBenExito("✅ Beneficiario registrado. Ya puede reservar su minuta.");
      cargarDatos();
    } catch (err) {
      setBenError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra un beneficiario
  const borrarBeneficiario = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Registra una institucion nueva
  const registrarInstitucion = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstError("");
    setInstExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/instituciones`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({ nombre: nombreInst }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo registrar la institución");
      }
      setNombreInst("");
      setInstExito("✅ Institución registrada. Ya cuenta en la métrica de la página.");
      cargarDatos();
    } catch (err) {
      setInstError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra una institucion
  const borrarInstitucion = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Registra un colaborador nuevo
  const registrarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setColError("");
    setColExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/colaboradores`, {
        method: "POST",
        headers: cabeceras(leerToken()),
        body: JSON.stringify({ nombre: nombreCol, rol: rolCol }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo registrar el colaborador");
      }
      setNombreCol("");
      setRolCol("");
      setColExito("✅ Colaborador registrado. Ya cuenta en la métrica de la página.");
      cargarDatos();
    } catch (err) {
      setColError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra un colaborador
  const borrarColaborador = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/colaboradores/${id}`, {
        method: "DELETE",
        headers: cabeceras(leerToken(), false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // ---------- Pantalla de login ----------
  if (!autenticado) {
    return (
      <section className="admin-pagina">
        <h1>Panel de administrador</h1>
        <form className="formulario" onSubmit={entrar} aria-label="Login de administrador">
          <label htmlFor="clave-admin">
            Clave del panel
            <input
              id="clave-admin"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              placeholder="Ingresa la clave"
              autoComplete="current-password"
            />
          </label>
          {errorLogin && <p className="estado error" role="alert">⚠️ {errorLogin}</p>}
          <button type="submit" className="boton boton-primario" disabled={cargandoLogin}>
            {cargandoLogin ? "Verificando…" : "Ingresar"}
          </button>
        </form>
      </section>
    );
  }

  // ---------- Panel de administrador ----------
  return (
    <section className="admin-pagina">
      <div className="admin-cabecera">
        <h1>Panel de administrador</h1>
        <button type="button" className="boton boton-secundario" onClick={salir}>
          Salir
        </button>
      </div>

      {/* Pestañas */}
      <div
        className="admin-pestanas"
        role="tablist"
        aria-label="Secciones del panel de administrador"
      >
        <button
          type="button"
          role="tab"
          id="tab-panel"
          className={pestana === "panel" ? "activa" : ""}
          onClick={() => setPestana("panel")}
          aria-selected={pestana === "panel"}
          aria-controls="panel-panel"
          tabIndex={pestana === "panel" ? 0 : -1}
        >
          🍳 Panel de cocina
        </button>
        <button
          type="button"
          role="tab"
          id="tab-beneficiarios"
          className={pestana === "beneficiarios" ? "activa" : ""}
          onClick={() => setPestana("beneficiarios")}
          aria-selected={pestana === "beneficiarios"}
          aria-controls="panel-beneficiarios"
          tabIndex={pestana === "beneficiarios" ? 0 : -1}
        >
          🎓 Beneficiarios
        </button>
        <button
          type="button"
          role="tab"
          id="tab-menu"
          className={pestana === "menu" ? "activa" : ""}
          onClick={() => setPestana("menu")}
          aria-selected={pestana === "menu"}
          aria-controls="panel-menu"
          tabIndex={pestana === "menu" ? 0 : -1}
        >
          🍽️ Menú
        </button>
        <button
          type="button"
          role="tab"
          id="tab-avisos"
          className={pestana === "avisos" ? "activa" : ""}
          onClick={() => setPestana("avisos")}
          aria-selected={pestana === "avisos"}
          aria-controls="panel-avisos"
          tabIndex={pestana === "avisos" ? 0 : -1}
        >
          📢 Avisos
        </button>
        <button
          type="button"
          role="tab"
          id="tab-galeria"
          className={pestana === "galeria" ? "activa" : ""}
          onClick={() => setPestana("galeria")}
          aria-selected={pestana === "galeria"}
          aria-controls="panel-galeria"
          tabIndex={pestana === "galeria" ? 0 : -1}
        >
          🖼️ Galería
        </button>
        <button
          type="button"
          role="tab"
          id="tab-instituciones"
          className={pestana === "instituciones" ? "activa" : ""}
          onClick={() => setPestana("instituciones")}
          aria-selected={pestana === "instituciones"}
          aria-controls="panel-instituciones"
          tabIndex={pestana === "instituciones" ? 0 : -1}
        >
          🏫 Instituciones
        </button>
        <button
          type="button"
          role="tab"
          id="tab-colaboradores"
          className={pestana === "colaboradores" ? "activa" : ""}
          onClick={() => setPestana("colaboradores")}
          aria-selected={pestana === "colaboradores"}
          aria-controls="panel-colaboradores"
          tabIndex={pestana === "colaboradores" ? 0 : -1}
        >
          👥 Colaboradores
        </button>
        <button
          type="button"
          role="tab"
          id="tab-notificaciones"
          className={pestana === "notificaciones" ? "activa" : ""}
          onClick={() => setPestana("notificaciones")}
          aria-selected={pestana === "notificaciones"}
          aria-controls="panel-notificaciones"
          tabIndex={pestana === "notificaciones" ? 0 : -1}
        >
          🔔 Notificaciones
        </button>
        <button
          type="button"
          role="tab"
          id="tab-mensajes"
          className={pestana === "mensajes" ? "activa" : ""}
          onClick={() => setPestana("mensajes")}
          aria-selected={pestana === "mensajes"}
          aria-controls="panel-mensajes"
          tabIndex={pestana === "mensajes" ? 0 : -1}
        >
          ✉️ Mensajes ({mensajes.length})
        </button>
      </div>

      {error && (
        <p className="estado error" role="alert" aria-live="assertive">
          ⚠️ {error}
        </p>
      )}

      {cargando && <p className="estado">Cargando…</p>}

      {!cargando && !error && pestana === "panel" && (
        <div id="panel-panel" role="tabpanel" aria-labelledby="tab-panel">
          {reporte && (
            <div className="reporte">
              <h2>Reporte de desperdicio</h2>
              <div className="reporte-cajas">
                <div className="reporte-caja">
                  <span className="reporte-numero">{reporte.totalReservas}</span>
                  <span className="reporte-etiqueta">Minutas reservadas</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">{reporte.minutasServidas}</span>
                  <span className="reporte-etiqueta">Minutas servidas</span>
                </div>
                <div className="reporte-caja desperdicio">
                  <span className="reporte-numero">
                    {reporte.minutasDesperdiciadas}
                  </span>
                  <span className="reporte-etiqueta">Sin asistir ({reporte.porcentajeDesperdicio}%)</span>
                </div>
              </div>

              {/* Desglose por sede y turno */}
              <h3 className="reporte-subtitulo">Desglose por sede</h3>
              <div className="reporte-desglose">
                {Object.entries(reporte.porSede || {}).map(([sede, info]) => (
                  <div key={sede} className="reporte-caja">
                    <span className="reporte-numero">{info.reservas}</span>
                    <span className="reporte-etiqueta">{sede} · {info.asistieron} asistieron</span>
                  </div>
                ))}
              </div>
              <h3 className="reporte-subtitulo">Desglose por turno</h3>
              <div className="reporte-desglose">
                {Object.entries(reporte.porTurno || {}).map(([turno, info]) => (
                  <div key={turno} className="reporte-caja">
                    <span className="reporte-numero">{info.reservas}</span>
                    <span className="reporte-etiqueta">{turno} · {info.asistieron} asistieron</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="admin-subtitulo">Plan de las próximas 7 días</h2>
          <p className="subtitulo">
            Cuántas minutas hay que preparar por día y por turno (las reservas
            se hacen con antelación).
          </p>
          {plan.length === 0 && (
            <p className="estado">No hay reservas en los próximos 7 días.</p>
          )}
          <div className="lista-totales">
            {plan.map((dia) => (
              <article key={dia.fecha} className="total-fecha">
                <span className="total-fecha-nombre">{dia.fecha}</span>
                <span className="total-fecha-cantidad">
                  {Object.entries(dia.porTurno)
                    .map(([turno, cantidad]) => `${turno}: ${cantidad}`)
                    .join(" · ")}
                </span>
                <span className="total-fecha-cantidad">
                  {dia.total} minutas en total
                </span>
              </article>
            ))}
          </div>

          <h2 className="admin-subtitulo">Minutas a preparar por fecha</h2>
          <div className="lista-totales">
            {Object.keys(totales).length === 0 && (
              <p className="estado">Aún no hay reservas registradas.</p>
            )}
            {Object.entries(totales)
              .sort((a, b) => (a[0] < b[0] ? -1 : 1))
              .map(([fecha, total]) => (
                <article key={fecha} className="total-fecha">
                  <span className="total-fecha-nombre">{fecha}</span>
                  <span className="total-fecha-cantidad">
                    {total.reservas} minutas · {total.asistieron} asistieron
                  </span>
                </article>
              ))}
          </div>

          <h2 className="admin-subtitulo">Reservas</h2>
          {reservas.length === 0 && (
            <p className="estado">Aún no hay reservas registradas.</p>
          )}
          <Buscador
            valor={busquedaReservas}
            alCambiar={setBusquedaReservas}
            placeholder="Buscar por estudiante, documento, sede, turno o fecha…"
          />
          <div className="lista-reservas">
            {reservas
              .slice()
              .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
              .filter((reserva) => {
                if (!busquedaReservas.trim()) return true;
                const texto = `${reserva.estudiante} ${reserva.documento} ${reserva.sede} ${reserva.turno} ${reserva.fecha} ${reserva.grado || ""}`;
                return coincide(texto, busquedaReservas);
              })
              .map((reserva) => {
                const estado = estadoReserva(reserva);
                return (
                  <article key={reserva.id} className="fila-reserva">
                    <div>
                      <strong>{reserva.estudiante}</strong>
                      <span className="fila-reserva-detalle">
                        {reserva.sede} · {reserva.turno} · {reserva.fecha}
                        {reserva.grado ? ` · Grado ${reserva.grado}` : ""}
                      </span>
                      <span className={`estado-reserva ${estado}`}>
                        {estado === "completada" ? "✓ Completada" : "⏳ Pendiente"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`asistencia ${reserva.asistio ? "asistio" : ""}`}
                      onClick={() => marcarAsistencia(reserva)}
                      aria-pressed={reserva.asistio}
                    >
                      {reserva.asistio ? "✓ Asistió" : "Marcar asistencia"}
                    </button>
                  </article>
                );
              })}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "beneficiarios" && (
        <div id="panel-beneficiarios" role="tabpanel" aria-labelledby="tab-beneficiarios">
          <h2 className="admin-subtitulo">Registrar beneficiario</h2>
          <form className="formulario" onSubmit={registrarBeneficiario}>
            <label htmlFor="doc-ben">
              Documento
              <input
                id="doc-ben"
                type="text"
                value={docBen}
                onChange={(e) => setDocBen(e.target.value)}
                required
                placeholder="Ej: 1234567890"
                autoComplete="off"
              />
            </label>
            <label htmlFor="nombre-ben">
              Nombre completo
              <input
                id="nombre-ben"
                type="text"
                value={nombreBen}
                onChange={(e) => setNombreBen(e.target.value)}
                required
                placeholder="Nombre del estudiante"
                autoComplete="off"
              />
            </label>
            <div className="formulario-fila">
              <label htmlFor="sede-ben">
                Sede
                <select id="sede-ben" value={sedeBen} onChange={(e) => setSedeBen(e.target.value)}>
                  <option>Sede A</option>
                  <option>Sede B</option>
                  <option>Sede C</option>
                </select>
              </label>
              <label htmlFor="turno-ben">
                Turno
                <select id="turno-ben" value={turnoBen} onChange={(e) => setTurnoBen(e.target.value)}>
                  <option>Almuerzo</option>
                  <option>Refrigerio</option>
                </select>
              </label>
              <label htmlFor="grado-ben">
                Grado
                <select
                  id="grado-ben"
                  value={gradoBen}
                  onChange={(e) => setGradoBen(e.target.value)}
                  aria-describedby={gradoBen && horarioGrado(gradoBen) ? "horario-grado-ben" : undefined}
                >
                  <option value="">Sin grado</option>
                  {GRADOS.map((grado) => (
                    <option key={grado} value={grado}>
                      {grado}
                    </option>
                  ))}
                </select>
                {gradoBen && horarioGrado(gradoBen) && (
                  <span id="horario-grado-ben" className="horario-grado">
                    Refrigerio: {horarioGrado(gradoBen)}
                  </span>
                )}
              </label>
            </div>
            {benError && <p className="estado error" role="alert">⚠️ {benError}</p>}
            {benExito && <p className="estado exito" aria-live="polite">{benExito}</p>}
            <button type="submit" className="boton boton-primario">
              Registrar beneficiario
            </button>
          </form>

          <h2 className="admin-subtitulo">
            Beneficiarios registrados ({beneficiarios.length})
          </h2>
          {beneficiarios.length === 0 && (
            <p className="estado">Aún no hay beneficiarios registrados.</p>
          )}
          <Buscador
            valor={busquedaBeneficiarios}
            alCambiar={setBusquedaBeneficiarios}
            placeholder="Buscar por nombre, documento, sede, turno o grado…"
          />
          <div className="lista-reservas">
            {beneficiarios
              .filter((b) => {
                if (!busquedaBeneficiarios.trim()) return true;
                const texto = `${b.nombre} ${b.documento} ${b.sede} ${b.turno} ${b.grado || ""}`;
                return coincide(texto, busquedaBeneficiarios);
              })
              .map((b) => (
              <article key={b.id} className="fila-reserva">
                <div>
                  <strong>{b.nombre}</strong>
                  <span className="fila-reserva-detalle">
                    {b.sede} · {b.turno} · Doc. {b.documento}
                    {b.grado ? ` · Grado ${b.grado}` : ""}
                  </span>
                </div>
                 <button
                   type="button"
                   className="boton boton-secundario"
                   onClick={() => borrarBeneficiario(b.id)}
                   aria-label={`Borrar beneficiario ${b.nombre}`}
                 >
                   Borrar
                 </button>
              </article>
             ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "menu" && (
        <div id="panel-menu" role="tabpanel" aria-labelledby="tab-menu">
          <h2 className="admin-subtitulo">Agregar plato al menú</h2>
          <form className="formulario" onSubmit={registrarMenu}>
            <div className="formulario-fila">
              <label>
                Semana del mes
                <select
                  value={semanaMenu}
                  onChange={(e) => setSemanaMenu(Number(e.target.value))}
                >
                  <option value={1}>Semana 1</option>
                  <option value={2}>Semana 2</option>
                  <option value={3}>Semana 3</option>
                  <option value={4}>Semana 4</option>
                </select>
              </label>
              <label>
                Día
                <select value={diaMenu} onChange={(e) => setDiaMenu(e.target.value)}>
                  <option>Lunes</option>
                  <option>Martes</option>
                  <option>Miércoles</option>
                  <option>Jueves</option>
                  <option>Viernes</option>
                </select>
              </label>
              <label>
                Jornada
                <select
                  value={jornadaMenu}
                  onChange={(e) => setJornadaMenu(e.target.value)}
                >
                  <option>Almuerzo</option>
                  <option>Refrigerio</option>
                </select>
              </label>
              <label>
                Calorías (opcional)
                <input
                  type="number"
                  value={caloriasMenu}
                  onChange={(e) => setCaloriasMenu(e.target.value)}
                  placeholder="Ej: 650"
                />
              </label>
            </div>
            <label>
              Platillo
              <input
                type="text"
                value={platilloMenu}
                onChange={(e) => setPlatilloMenu(e.target.value)}
                required
                placeholder="Ej: Arroz con pollo"
              />
            </label>
            <label>
              Descripción
              <textarea
                value={descripcionMenu}
                onChange={(e) => setDescripcionMenu(e.target.value)}
                required
                rows={3}
                placeholder="Describe los alimentos…"
              />
            </label>
            <label>
              Foto del plato (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const archivo = e.target.files?.[0];
                  if (!archivo) return;
                  setSubiendoImagenMenu(true);
                  setMenuError("");
                  await subirImagen(archivo, setImagenMenu);
                  setSubiendoImagenMenu(false);
                }}
              />
              {subiendoImagenMenu && <small className="campo-fijo">Subiendo imagen…</small>}
              {imagenMenu && (
                <small className="campo-fijo">✅ Imagen lista para guardar.</small>
              )}
            </label>
            {menuError && <p className="estado error" role="alert">⚠️ {menuError}</p>}
            {menuExito && <p className="estado exito" aria-live="polite">{menuExito}</p>}
            <button
              type="submit"
              className="boton boton-primario"
              disabled={subiendoImagenMenu}
            >
              Guardar plato
            </button>
          </form>

          <h2 className="admin-subtitulo">Menú por semana</h2>
          {menu.length === 0 && (
            <p className="estado">El menú está vacío. Agrega los platos de la semana.</p>
          )}
          <Buscador
            valor={busquedaMenu}
            alCambiar={setBusquedaMenu}
            placeholder="Buscar por comida, descripción, día, jornada…"
          />
          <div className="lista-reservas">
            {menu.map((semana) => (
              <div key={semana.semana} className="menu-semana-admin">
                <h3>Semana {semana.semana} del mes</h3>
                {semana.dias.map((dia) => {
                  const platosFiltrados = dia.platos.filter((plato) => {
                    if (!busquedaMenu.trim()) return true;
                    const texto = `${plato.platillo} ${plato.descripcion} ${plato.jornada || ""} ${plato.calorias || ""} ${dia.dia} semana ${semana.semana}`;
                    return coincide(texto, busquedaMenu);
                  });
                  if (platosFiltrados.length === 0) return null;
                  return (
                    <div key={dia.dia} className="menu-dia-admin">
                      <h4>{dia.dia}</h4>
                      {platosFiltrados.map((plato) => (
                      <article key={plato.id} className="fila-reserva">
                        <div className="fila-menu-contenido">
                          {plato.imagen && (
                            <img
                              className="miniatura-menu"
                              src={plato.imagen}
                              alt={plato.platillo}
                            />
                          )}
                          <div>
                            <strong>{plato.platillo}</strong>
                            <span className="fila-reserva-detalle">
                              {plato.descripcion}
                              {plato.calorias ? ` · ${plato.calorias} kcal` : ""}
                              {plato.jornada ? ` · ${plato.jornada}` : ""}
                            </span>
                          </div>
                        </div>
                         <button
                           type="button"
                           className="boton boton-secundario"
                           onClick={() => borrarPlato(plato.id)}
                           aria-label={`Borrar plato ${plato.platillo}`}
                         >
                           Borrar
                         </button>
                      </article>
                    ))}
                  </div>
                );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "avisos" && (
        <div id="panel-avisos" role="tabpanel" aria-labelledby="tab-avisos">
          <h2 className="admin-subtitulo">Publicar aviso</h2>
          <form className="formulario" onSubmit={publicarAviso}>
            <label>
              Título
              <input
                type="text"
                value={tituloAviso}
                onChange={(e) => setTituloAviso(e.target.value)}
                required
                placeholder="Ej: Suspensión del servicio"
              />
            </label>
            <label>
              Texto
              <textarea
                value={textoAviso}
                onChange={(e) => setTextoAviso(e.target.value)}
                required
                rows={3}
                placeholder="Describe el aviso…"
              />
            </label>
            <label>
              Etiqueta (opcional)
              <input
                type="text"
                value={fechaAviso}
                onChange={(e) => setFechaAviso(e.target.value)}
                placeholder="Ej: Novedad, Recordatorio"
              />
            </label>
            <label>
              Imagen (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const archivo = e.target.files?.[0];
                  if (!archivo) return;
                  setSubiendoImagenAviso(true);
                  setAvisoError("");
                  await subirImagen(archivo, setImagenAviso);
                  setSubiendoImagenAviso(false);
                }}
              />
              {subiendoImagenAviso && <small className="campo-fijo">Subiendo imagen…</small>}
              {imagenAviso && (
                <small className="campo-fijo">✅ Imagen lista para publicar.</small>
              )}
            </label>
            {avisoError && <p className="estado error" role="alert">⚠️ {avisoError}</p>}
            {avisoExito && <p className="estado exito" aria-live="polite">{avisoExito}</p>}
            <button
              type="submit"
              className="boton boton-primario"
              disabled={subiendoImagenAviso}
            >
              Publicar aviso
            </button>
          </form>

          <h2 className="admin-subtitulo">Avisos publicados</h2>
          {avisos.length === 0 && <p className="estado">No hay avisos.</p>}
          <Buscador
            valor={busquedaAvisos}
            alCambiar={setBusquedaAvisos}
            placeholder="Buscar por título o texto…"
          />
          <div className="lista-avisos-admin">
            {avisos
              .filter((aviso) => {
                if (!busquedaAvisos.trim()) return true;
                const texto = `${aviso.titulo} ${aviso.texto} ${aviso.fecha || ""}`;
                return coincide(texto, busquedaAvisos);
              })
              .map((aviso) => (
              <article key={aviso.id} className="fila-aviso-admin">
                <div className="fila-menu-contenido">
                  {aviso.imagen && (
                    <img
                      className="miniatura-menu"
                      src={aviso.imagen}
                      alt={aviso.titulo}
                    />
                  )}
                  <div>
                    <strong>{aviso.titulo}</strong>
                    <span className="fila-reserva-detalle">
                      {aviso.fecha ? `${aviso.fecha} · ` : ""}
                      {aviso.texto}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => borrarAviso(aviso.id)}
                  aria-label={`Borrar aviso ${aviso.titulo}`}
                >
                  Borrar
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "galeria" && (
        <div id="panel-galeria" role="tabpanel" aria-labelledby="tab-galeria">
          <h2 className="admin-subtitulo">Publicar foto en la galería</h2>
          <p className="subtitulo">
            Estas fotos aparecen en la página de inicio junto con las de los
            platos y los avisos. Súbele el título y elige la imagen.
          </p>
          <form className="formulario" onSubmit={publicarFotoGaleria}>
            <label>
              Título
              <input
                type="text"
                value={tituloGaleria}
                onChange={(e) => setTituloGaleria(e.target.value)}
                required
                placeholder="Ej: Entrega de minutas, jornada deportiva"
              />
            </label>
            <label>
              Descripción
              <textarea
                value={descripcionGaleria}
                onChange={(e) => setDescripcionGaleria(e.target.value)}
                rows={3}
                placeholder="Ej: Estudiantes disfrutando el refrigerio de la semana"
              />
            </label>
            <label>
              Imagen
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const archivo = e.target.files?.[0];
                  if (!archivo) return;
                  setSubiendoImagenGaleria(true);
                  setGaleriaError("");
                  await subirImagen(archivo, setImagenGaleria);
                  setSubiendoImagenGaleria(false);
                }}
                required
              />
              {subiendoImagenGaleria && <small className="campo-fijo">Subiendo imagen…</small>}
              {imagenGaleria && (
                <small className="campo-fijo">✅ Imagen lista para publicar.</small>
              )}
            </label>
            {galeriaError && <p className="estado error" role="alert">⚠️ {galeriaError}</p>}
            {galeriaExito && <p className="estado exito" aria-live="polite">{galeriaExito}</p>}
            <button
              type="submit"
              className="boton boton-primario"
              disabled={subiendoImagenGaleria}
            >
              Publicar foto
            </button>
          </form>

          <h2 className="admin-subtitulo">Fotos publicadas ({galeria.length})</h2>
          {galeria.length === 0 && (
            <p className="estado">Aún no hay fotos en la galería.</p>
          )}
          <Buscador
            valor={busquedaGaleria}
            alCambiar={setBusquedaGaleria}
            placeholder="Buscar por título…"
          />
          <div className="galeria-admin">
            {galeria
              .filter((foto) => {
                if (!busquedaGaleria.trim()) return true;
                return (
                  coincide(foto.titulo, busquedaGaleria) ||
                  coincide(foto.descripcion || "", busquedaGaleria)
                );
              })
              .map((foto) => (
              <article key={foto.id} className="fila-galeria-admin">
                <img src={foto.imagen} alt={foto.titulo} />
                <div className="fila-galeria-info">
                  <strong>{foto.titulo}</strong>
                  {foto.descripcion && <small>{foto.descripcion}</small>}
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => borrarFotoGaleria(foto.id)}
                    aria-label={`Borrar foto ${foto.titulo}`}
                  >
                    Borrar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "instituciones" && (
        <div id="panel-instituciones" role="tabpanel" aria-labelledby="tab-instituciones">
          <h2 className="admin-subtitulo">Registrar institución</h2>
          <p className="subtitulo">
            Cada institución cuenta en la métrica de la página de inicio.
          </p>
          <form className="formulario" onSubmit={registrarInstitucion}>
            <label>
              Nombre de la institución
              <input
                type="text"
                value={nombreInst}
                onChange={(e) => setNombreInst(e.target.value)}
                required
                placeholder="Ej: IE San José"
              />
            </label>
            {instError && <p className="estado error" role="alert">⚠️ {instError}</p>}
            {instExito && <p className="estado exito" aria-live="polite">{instExito}</p>}
            <button type="submit" className="boton boton-primario">
              Registrar institución
            </button>
          </form>

          <h2 className="admin-subtitulo">
            Instituciones registradas ({instituciones.length})
          </h2>
          {instituciones.length === 0 && (
            <p className="estado">Aún no hay instituciones registradas.</p>
          )}
          <Buscador
            valor={busquedaInstituciones}
            alCambiar={setBusquedaInstituciones}
            placeholder="Buscar por nombre…"
          />
          <div className="lista-reservas">
            {instituciones
              .filter((inst) => {
                if (!busquedaInstituciones.trim()) return true;
                return coincide(inst.nombre, busquedaInstituciones);
              })
              .map((inst) => (
              <article key={inst.id} className="fila-reserva">
                <div>
                  <strong>{inst.nombre}</strong>
                </div>
                 <button
                   type="button"
                   className="boton boton-secundario"
                   onClick={() => borrarInstitucion(inst.id)}
                   aria-label={`Borrar institución ${inst.nombre}`}
                 >
                   Borrar
                 </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "colaboradores" && (
        <div id="panel-colaboradores" role="tabpanel" aria-labelledby="tab-colaboradores">
          <h2 className="admin-subtitulo">Registrar colaborador</h2>
          <p className="subtitulo">
            Cada colaborador cuenta en la métrica de la página de inicio.
          </p>
          <form className="formulario" onSubmit={registrarColaborador}>
            <div className="formulario-fila">
              <label>
                Nombre completo
                <input
                  type="text"
                  value={nombreCol}
                  onChange={(e) => setNombreCol(e.target.value)}
                  required
                  placeholder="Nombre del colaborador"
                />
              </label>
              <label>
                Rol (opcional)
                <input
                  type="text"
                  value={rolCol}
                  onChange={(e) => setRolCol(e.target.value)}
                  placeholder="Ej: Coordinador, Manipuladora"
                />
              </label>
            </div>
            {colError && <p className="estado error" role="alert">⚠️ {colError}</p>}
            {colExito && <p className="estado exito" aria-live="polite">{colExito}</p>}
            <button type="submit" className="boton boton-primario">
              Registrar colaborador
            </button>
          </form>

          <h2 className="admin-subtitulo">
            Colaboradores registrados ({colaboradores.length})
          </h2>
          {colaboradores.length === 0 && (
            <p className="estado">Aún no hay colaboradores registrados.</p>
          )}
          <Buscador
            valor={busquedaColaboradores}
            alCambiar={setBusquedaColaboradores}
            placeholder="Buscar por nombre o rol…"
          />
          <div className="lista-reservas">
            {colaboradores
              .filter((col) => {
                if (!busquedaColaboradores.trim()) return true;
                const texto = `${col.nombre} ${col.rol || ""}`;
                return coincide(texto, busquedaColaboradores);
              })
              .map((col) => (
              <article key={col.id} className="fila-reserva">
                <div>
                  <strong>{col.nombre}</strong>
                  <span className="fila-reserva-detalle">
                    {col.rol || "Sin rol"}
                  </span>
                </div>
                 <button
                   type="button"
                   className="boton boton-secundario"
                   onClick={() => borrarColaborador(col.id)}
                   aria-label={`Borrar colaborador ${col.nombre}`}
                 >
                   Borrar
                 </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "notificaciones" && (
        <div id="panel-notificaciones" role="tabpanel" aria-labelledby="tab-notificaciones">
          <h2 className="admin-subtitulo">
            Confirmaciones de reserva ({notificaciones.length})
          </h2>
          {notificaciones.length === 0 && (
            <p className="estado">Aún no hay notificaciones. Cuando un estudiante
              reserve, la confirmación aparece aquí.</p>
          )}
          <Buscador
            valor={busquedaNotificaciones}
            alCambiar={setBusquedaNotificaciones}
            placeholder="Buscar por tipo, destinatario o mensaje…"
          />
          <div className="lista-mensajes">
            {notificaciones
              .filter((nota) => {
                if (!busquedaNotificaciones.trim()) return true;
                const texto = `${nota.tipo} ${nota.destinatario || ""} ${nota.mensaje || ""}`;
                return coincide(texto, busquedaNotificaciones);
              })
              .map((nota) => (
              <article key={nota.id} className="fila-mensaje">
                <div>
                  <strong>{nota.tipo} {nota.enviado ? "· ✅ enviada" : "· ⏳ pendiente"}</strong>
                  <span className="fila-reserva-detalle">
                    {nota.destinatario || "Sin correo"} ·{" "}
                    {nota.created_at ? nota.created_at.slice(0, 10) : ""}
                  </span>
                  <p>{nota.mensaje}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestana === "mensajes" && (
        <div id="panel-mensajes" role="tabpanel" aria-labelledby="tab-mensajes">
          <h2 className="admin-subtitulo">Mensajes de contacto</h2>
          {mensajes.length === 0 && (
            <p className="estado">Aún no hay mensajes de contacto.</p>
          )}
          <Buscador
            valor={busquedaMensajes}
            alCambiar={setBusquedaMensajes}
            placeholder="Buscar por nombre, correo o mensaje…"
          />
          <div className="lista-mensajes">
            {mensajes
              .filter((mensaje) => {
                if (!busquedaMensajes.trim()) return true;
                const texto = `${mensaje.nombre} ${mensaje.correo} ${mensaje.mensaje}`;
                return coincide(texto, busquedaMensajes);
              })
              .map((mensaje) => (
              <article key={mensaje.id} className="fila-mensaje">
                <div>
                  <strong>{mensaje.nombre}</strong>
                  <span className="fila-reserva-detalle">{mensaje.correo}</span>
                  <p>{mensaje.mensaje}</p>
                </div>
                <span className="mensaje-fecha">
                  {mensaje.created_at ? mensaje.created_at.slice(0, 10) : ""}
                </span>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Admin;
