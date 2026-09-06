import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import {
  leerSesion,
  guardarSesion,
  cerrarSesion,
  cabeceras,
} from "../config/sesion";

import type {
  Aviso, Beneficiario, Configuracion, FotoGaleria,
  Institucion, Mensaje, MenuItem,
  Pestana,
  Sede, TurnoCocina, Usuario, UsuarioCocina,
  MenuSemanaAdmin,
} from "./admin/types";

import TabPanelCocina from "./admin/TabPanelCocina";
import TabTablero from "./admin/TabTablero";
import TabBeneficiarios from "./admin/TabBeneficiarios";
import TabAsistencia from "./admin/TabAsistencia";
import { useAsistencia } from "./admin/hooks/useAsistencia";
import TabIncidentes from "./admin/TabIncidentes";
import TabMenu from "./admin/TabMenu";
import TabAvisos from "./admin/TabAvisos";
import TabGaleria from "./admin/TabGaleria";
import TabInstituciones from "./admin/TabInstituciones";
import TabSedes from "./admin/TabSedes";
import TabTurnos from "./admin/TabTurnos";
import TabNotificaciones from "./admin/TabNotificaciones";
import TabMensajes from "./admin/TabMensajes";
import { useMensajes } from "./admin/hooks/useMensajes";
import { useMenu } from "./admin/hooks/useMenu";
import { useAvisos } from "./admin/hooks/useAvisos";
import { useGaleria } from "./admin/hooks/useGaleria";
import { useBeneficiarios } from "./admin/hooks/useBeneficiarios";
import { useInstituciones } from "./admin/hooks/useInstituciones";
import { useSedes } from "./admin/hooks/useSedes";
import { useTurnos } from "./admin/hooks/useTurnos";
import { useConfig } from "./admin/hooks/useConfig";
import TabReportes from "./admin/TabReportes";
import { useReportes } from "./admin/hooks/useReportes";
import TabUsuarios from "./admin/TabUsuarios";
import { useUsuarios } from "./admin/hooks/useUsuarios";
import TabConfig from "./admin/TabConfig";
import TabAuditoria from "./admin/TabAuditoria";
import { useNotificaciones } from "./admin/hooks/useNotificaciones";
import { useAuditoria } from "./admin/hooks/useAuditoria";
import { useIncidentes } from "./admin/hooks/useIncidentes";
import { usePanelCocina } from "./admin/hooks/usePanelCocina";
import { useTablero } from "./admin/hooks/useTablero";


function hoyLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

function Admin() {
  const [autenticado, setAutenticado] = useState(leerSesion() !== null);
  const [rol, setRol] = useState(leerSesion()?.rol || "");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [pestana, setPestana] = useState<Pestana>("panel");

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [menu, setMenu] = useState<MenuSemanaAdmin[]>([]);
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [config, setConfig] = useState<Configuracion>({
    hora_limite_reserva: null,
    cupos_sede: {},
  });
  const [horaLimite, setHoraLimite] = useState("");
  const [cupos, setCupos] = useState<Record<string, string>>({});

  const [turnos, setTurnos] = useState<TurnoCocina[]>([]);
  const [listaCocina, setListaCocina] = useState<UsuarioCocina[]>([]);
  const [fechaTurno, setFechaTurno] = useState(() => hoyLocal());
  const [usuarioTurno, setUsuarioTurno] = useState("");


  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoLogin(true);
    setErrorLogin("");
    try {
      const respuesta = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
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
      setRol(datos.rol);
      setAutenticado(true);
    } catch (err) {
      setErrorLogin(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargandoLogin(false);
    }
  };

  const salir = () => {
    cerrarSesion();
    setAutenticado(false);
    setRol("");
    setClave("");
  };

  const subirImagen = async (archivo: File, setter: (url: string) => void) => {
    const toBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result));
        lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
        lector.readAsDataURL(file);
      });

    try {
      const base64 = await toBase64(archivo);
      const respuesta = await fetch(`${API_URL}/api/archivos/subir`, {
        method: "POST",
        headers: cabeceras(),
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


  const incidente = useIncidentes({
    rol,
    autenticado,
    pestana,
    subirImagen,
  });


  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const datosPorRol: Record<string, string[]> = {
        admin: ["avisos", "mensajes", "beneficiarios", "menu", "galeria", "instituciones"],
        cocina: ["menu"],
        profesor: ["avisos", "beneficiarios"],
        coordinador: ["avisos", "mensajes", "beneficiarios", "menu", "galeria", "instituciones"],
      };
      // Solo se piden los datos que el rol necesita (mas sedes, que las
      // usan los formularios del panel). Los endpoints privados no se
      // tocan si el rol no los requiere.
      const necesarios = [...(datosPorRol[rol] || []), "sedes"];

      const rutas: Record<string, string> = {
        avisos: `${API_URL}/api/avisos/todos`,
        mensajes: `${API_URL}/api/contacto`,
        beneficiarios: `${API_URL}/api/beneficiarios`,
        menu: `${API_URL}/api/menus/todos`,
        galeria: `${API_URL}/api/galeria`,
        instituciones: `${API_URL}/api/instituciones`,
        sedes: `${API_URL}/api/sedes`,
      };

      const respuestas = await Promise.all(
        necesarios.map(
          async (nombre) =>
            [nombre, await fetch(rutas[nombre], { headers: cabeceras(false) })] as [
              string,
              Response
            ]
        )
      );

      const fallo = respuestas.find(([, r]) => !r.ok);

      if (fallo) {
        const [nombre, r] = fallo;
        if (r.status === 401) {
          salir();
          throw new Error("Tu sesión expiró. Vuelve a entrar con la clave.");
        }
        throw new Error(`No se pudieron cargar los datos (${nombre}: ${r.status})`);
      }

      const datos = Object.fromEntries(
        await Promise.all(
          respuestas.map(
            async ([nombre, r]) =>
              [nombre, r.ok ? await r.json() : []] as [string, unknown]
          )
        )
      ) as Record<string, unknown>;

      setAvisos((datos.avisos || []) as Aviso[]);
      setMensajes((datos.mensajes || []) as Mensaje[]);
      setBeneficiarios((datos.beneficiarios || []) as Beneficiario[]);

      if (Array.isArray(datos.menu)) {
        const menus = datos.menu as MenuItem[];
        const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
        const normalizar = (t: string) =>
          t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
      }

      setGaleria((datos.galeria || []) as FotoGaleria[]);
      setInstituciones((datos.instituciones || []) as Institucion[]);
      setSedes((datos.sedes || []) as Sede[]);

      if (leerSesion()?.rol === "admin") {
        const respConfig = await fetch(`${API_URL}/api/settings`, {
          headers: cabeceras(false),
        });
        if (respConfig.ok) {
          const datosConfig = (await respConfig.json()) as Configuracion;
          setConfig(datosConfig);
          setHoraLimite(datosConfig.hora_limite_reserva || "");
          const cuposIniciales: Record<string, string> = {};
          for (const [sede, cupo] of Object.entries(datosConfig.cupos_sede || {})) {
            cuposIniciales[sede] = String(cupo);
          }
          setCupos(cuposIniciales);
        }
      }

      if (rol === "admin" || rol === "coordinador") {
        const respTurnos = await fetch(`${API_URL}/api/turnos`, {
          headers: cabeceras(false),
        });
        if (respTurnos.ok) setTurnos(await respTurnos.json());

        const respCocina = await fetch(`${API_URL}/api/usuarios/cocina`, {
          headers: cabeceras(false),
        });
        if (respCocina.ok) {
          const cocina = (await respCocina.json()) as UsuarioCocina[];
          setListaCocina(cocina);
          if (cocina.length > 0 && !cocina.some((c) => c.usuario === usuarioTurno)) {
            setUsuarioTurno(cocina[0].usuario);
          }
        }
      }


      if (leerSesion()?.rol === "admin") {
        const respUsuarios = await fetch(`${API_URL}/api/usuarios`, {
          headers: cabeceras(false),
        });
        if (respUsuarios.ok) setUsuarios(await respUsuarios.json());
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("No se pudieron cargar")) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    } finally {
      setCargando(false);
    }

  };


  useEffect(() => {
    if (autenticado) cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);



  const asistencia = useAsistencia({ autenticado, pestana });
  const reportesTab = useReportes({
    rol,
    autenticado,
    pestana,
    setError,
  });

  const usuarioTab = useUsuarios({
    usuarios,
    sedes,
    cargarDatos,
    setError,
  });

  const mensajesTab = useMensajes({
    mensajes,
    setMensajes,
    autenticado,
    pestana,
    cargarDatos,
    setError,
  });

  const menuTab = useMenu({ menu, subirImagen, cargarDatos, setError });
  const avisosTab = useAvisos({ avisos, subirImagen, cargarDatos, setError });
  const galeriaTab = useGaleria({ galeria, subirImagen, cargarDatos, setError });

  const beneficiariosTab = useBeneficiarios({ beneficiarios, sedes, cargarDatos, setError });
  const institucionesTab = useInstituciones({ instituciones, cargarDatos, setError });
  const sedesTab = useSedes({ sedes, cargarDatos });

  const turnosTab = useTurnos({
    turnos,
    listaCocina,
    fechaTurno,
    setFechaTurno,
    usuarioTurno,
    setUsuarioTurno,
    sedes,
    cargarDatos,
    setError,
  });
  const configTab = useConfig({
    config,
    horaLimite,
    setHoraLimite,
    cupos,
    setCupos,
    sedes,
    cargarDatos,
  });

  const panelCocinaTab = usePanelCocina({ autenticado, rol, sedes, setError });
  const tableroTab = useTablero({ autenticado, rol, setError });
  const notificacionesTab = useNotificaciones({ autenticado, pestana });
  const auditoriaTab = useAuditoria({ autenticado, pestana, rol });


  // ---- Pantalla de login ----
  if (!autenticado) {
    return (
      <section className="admin-pagina">
        <h1>Panel de administrador</h1>
        <form className="formulario" onSubmit={entrar} aria-label="Login del panel">
          <label htmlFor="usuario-admin">
            Usuario
            <input
              id="usuario-admin"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              placeholder="Tu usuario (o 'admin')"
              autoComplete="username"
            />
          </label>
          <label htmlFor="clave-admin">
            Clave
            <input
              id="clave-admin"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              placeholder="Tu clave (o la del panel)"
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

  // ---- Panel de administrador ----
  const noLeidos = mensajes.filter((m) => !m.leido).length;
  const pestanasPorRol: Record<string, { id: Pestana; etiqueta: string }[]> = {
    admin: [
      { id: "panel", etiqueta: "🍳 Panel de cocina" },
      { id: "tablero", etiqueta: "📋 Tablero del día" },
      { id: "beneficiarios", etiqueta: "🎓 Beneficiarios" },
      { id: "menu", etiqueta: "🍽️ Menú" },
      { id: "avisos", etiqueta: "📢 Avisos" },
      { id: "galeria", etiqueta: "🖼️ Galería" },
      { id: "instituciones", etiqueta: "🏫 Instituciones" },
      { id: "sedes", etiqueta: "📍 Sedes" },
      { id: "turnos", etiqueta: "🧑‍🍳 Turnos de cocina" },
      { id: "notificaciones", etiqueta: "🔔 Notificaciones" },
      { id: "mensajes", etiqueta: `✉️ Mensajes${noLeidos > 0 ? ` (${noLeidos} sin leer)` : ""}` },
      { id: "reportes", etiqueta: "📊 Reportes" },
      { id: "usuarios", etiqueta: "🔐 Usuarios" },
      { id: "config", etiqueta: "⚙️ Configuración" },
      { id: "auditoria", etiqueta: "🗒️ Auditoría" },
    ],
    cocina: [
      { id: "panel", etiqueta: "🍳 Panel de cocina" },
      { id: "menu", etiqueta: "🍽️ Menú" },
      { id: "reportes", etiqueta: "📊 Reportes" },
    ],
    profesor: [
      { id: "asistencia", etiqueta: "📋 Asistencia" },
      { id: "incidentes", etiqueta: "🚨 Incidentes" },
      { id: "beneficiarios", etiqueta: "🎓 Beneficiarios" },
      { id: "avisos", etiqueta: "📢 Avisos" },
    ],
    coordinador: [
      { id: "tablero", etiqueta: "📋 Tablero del día" },
      { id: "beneficiarios", etiqueta: "🎓 Beneficiarios" },
      { id: "turnos", etiqueta: "🧑‍🍳 Turnos de cocina" },
      { id: "avisos", etiqueta: "📢 Avisos" },
      { id: "incidentes", etiqueta: "🚨 Incidentes" },
      { id: "galeria", etiqueta: "🖼️ Galería" },
      { id: "instituciones", etiqueta: "🏫 Instituciones" },
      { id: "notificaciones", etiqueta: "🔔 Notificaciones" },
      { id: "mensajes", etiqueta: `✉️ Mensajes${noLeidos > 0 ? ` (${noLeidos} sin leer)` : ""}` },
      { id: "reportes", etiqueta: "📊 Reportes" },
    ],
  };

  const pestanasVisibles = pestanasPorRol[rol] || [];
  const pestanaActiva =
    pestanasVisibles.length === 0
      ? null
      : pestanasVisibles.some((p) => p.id === pestana)
        ? pestana
        : pestanasVisibles[0]?.id || "panel";

  return (
    <section className="admin-pagina">
      <div className="admin-cabecera">
        <h1>Panel {rol === "admin" ? "de administrador" : "del programa"}</h1>
        {leerSesion()?.nombre && (
          <p className="admin-bienvenida">
            Sesión: {leerSesion()?.nombre} ({rol})
          </p>
        )}
        <button type="button" className="boton boton-secundario" onClick={salir}>
          Salir
        </button>

      {pestanasVisibles.length === 0 && (
        <p className="estado" role="status">
          ℹ️ Tu rol de estudiante no tiene secciones en el panel. Para
          reservar tu minuta usa la opción «Reservar comida».
        </p>
      )}
      </div>

      <div className="admin-pestanas" role="tablist" aria-label="Secciones del panel">
        {pestanasVisibles.map(({ id, etiqueta }) => (
          <button
            type="button"
            role="tab"
            key={id}
            id={`tab-${id}`}
            className={pestanaActiva === id ? "activa" : ""}
            onClick={() => setPestana(id)}
            aria-selected={pestanaActiva === id}
            aria-controls={`panel-${id}`}
            tabIndex={pestanaActiva === id ? 0 : -1}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {error && (
        <p className="estado error" role="alert" aria-live="assertive">
          ⚠️ {error}
        </p>
      )}

      {cargando && <p className="estado">Cargando…</p>}

      {!cargando && !error && pestanaActiva === "panel" && (
        <TabPanelCocina {...panelCocinaTab} />
      )}

      {!cargando && !error && pestanaActiva === "tablero" && (
        <TabTablero {...tableroTab} />
      )}

      {!cargando && !error && pestanaActiva === "beneficiarios" && (
        <TabBeneficiarios {...beneficiariosTab} />
      )}

{!cargando && !error && pestanaActiva === "asistencia" && (
  <TabAsistencia {...asistencia} />
)}
{!cargando && !error && pestanaActiva === "incidentes" && (
  <TabIncidentes rol={rol} {...incidente} />
)}
      {!cargando && !error && pestanaActiva === "menu" && (
        <TabMenu {...menuTab} />
      )}

      {!cargando && !error && pestanaActiva === "avisos" && (
        <TabAvisos {...avisosTab} />
      )}

      {!cargando && !error && pestanaActiva === "galeria" && (
        <TabGaleria {...galeriaTab} />
      )}

      {!cargando && !error && pestanaActiva === "instituciones" && (
        <TabInstituciones {...institucionesTab} />
      )}

      {!cargando && !error && pestanaActiva === "sedes" && (
        <TabSedes {...sedesTab} />
      )}

      {!cargando && !error && pestanaActiva === "notificaciones" && (
        <TabNotificaciones {...notificacionesTab} />
      )}

{!cargando && !error && pestanaActiva === "mensajes" && (
  <TabMensajes {...mensajesTab} />
)}

      {!cargando && !error && pestanaActiva === "reportes" && (
  <TabReportes {...reportesTab} />
)}

      {!cargando && !error && pestanaActiva === "usuarios" && (
  <TabUsuarios {...usuarioTab} />
)}

      {pestana === "config" && (
        <TabConfig {...configTab} />
      )}

      {pestana === "turnos" && (
        <TabTurnos {...turnosTab} />
      )}

      {pestana === "auditoria" && (
        <TabAuditoria {...auditoriaTab} />
      )}
    </section>
  );
}

export default Admin;
