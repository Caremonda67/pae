// panel de administrador
// ahora el login es REAL: el usuario manda su usuario + clave al
// backend (/api/login), este los compara y devuelve un token con
// el rol. El panel guarda la sesion compartida y muestra solo las
// pestañas que le corresponden al rol que entro.
//
// Pestañas por rol:
// - admin: todas (cocina, beneficiarios, menu, avisos, galeria,
//   instituciones, sedes, notificaciones, mensajes, usuarios)
// - cocina: panel de cocina y menú
// - profesor: beneficiarios, avisos
// - coordinador: avisos, galeria, instituciones, notificaciones, mensajes
// - estudiante: no tiene panel (entra por Reserva)

import { useEffect, useRef, useState } from "react";
import Buscador from "../components/Buscador";
import FiltroReportes from "../components/FiltroReportes";
import { coincide } from "../config/busqueda";
import { fechaCorta } from "../config/fechas";
import { GRADOS, horarioGrado } from "../config/horarios";
import { API_URL } from "../config/api";
import { descargarExcel, construirHtmlExcel } from "../config/exportar";
import type { SeccionTabla, OpcionesExportar } from "../config/exportar";
import {
  leerSesion,
  guardarSesion,
  cerrarSesion,
  cabeceras,
} from "../config/sesion";

// un aviso que se muestra en la home
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

// resumen del panel compacto de cocina (ruta /api/reservas/panel)
interface PanelCocina {
  fecha: string;
  porJornada: Record<string, number>;
  porSede: Record<string, number>;
  total: number;
}

// sobrante de comida reportado por cocina (ruta /api/sobrantes)
interface Sobrante {
  id: number;
  fecha: string;
  sede: string;
  turno: string;
  porciones: number | null;
  peso_kg: number | null;
  creado_por?: string;
}

// jornadas para el reporte de sobrantes (mismo orden del panel)
const TURNOS_SOBRANTES = ["Almuerzo", "Refrigerio"] as const;

// reporte de desperdicio (ruta /api/reservas/reporte)
interface Reporte {
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
  porSede: Record<string, { reservas: number; asistieron: number }>;
  porTurno: Record<string, { reservas: number; asistieron: number }>;
}

// una reserva de la tabla diaria (ruta /api/reservas/diario)
interface ReservaDiaria {
  id: number;
  estudiante: string;
  documento: string;
  sede: string;
  turno: string;
  fecha: string;
  asistio: boolean;
}

// un estudiante reservado del grupo de un profesor (ruta /api/asistencia)
interface ReservaAsistencia {
  id: number;
  estudiante: string;
  documento: string;
  grado?: string | null;
  turno: string;
  asistio: boolean;
}

// un reporte de incidente o alergia de un estudiante (ruta /api/incidentes)
interface Incidente {
  id: number;
  tipo: string;
  estudiante: string;
  documento?: string | null;
  sede: string;
  grado?: string | null;
  descripcion: string;
  fecha: string;
  imagen?: string | null;
  reportado_por: string;
  resuelto: boolean;
  resuelto_por?: string | null;
  resuelto_at?: string | null;
  created_at: string;
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

interface Sede {
  id: number;
  nombre: string;
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
  documento?: string | null;
  imagen?: string | null;
  leido?: boolean;
  respuesta?: string | null;
  respuesta_at?: string | null;
  created_at: string;
}

// un mensaje del hilo de chat entre estudiante y admin
interface MensajeChat {
  id: number | string;
  remitente: "estudiante" | "admin";
  texto: string;
  imagen?: string | null;
  created_at?: string;
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

interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  activo: boolean;
  clave?: string | null;
  sede?: string | null;
  turno?: string | null;
  grado?: string | null;
}

// pestañas del panel
type Pestana =
  | "panel"
  | "beneficiarios"
  | "asistencia"
  | "incidentes"
  | "menu"
  | "avisos"
  | "galeria"
  | "instituciones"
  | "sedes"
  | "notificaciones"
  | "mensajes"
  | "reportes"
  | "usuarios";

// Fecha de hoy en formato YYYY-MM-DD (hora local del navegador)
function hoyLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

// Fecha YYYY-MM-DD -> "12/08/2026" (sin desfase de zona horaria)
function fechaCortaDia(fecha: string) {
  const [año, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${año}`;
}

// Convierte un archivo de imagen a base64 para mandarlo en el JSON
// del chat (así el admin puede adjuntar fotos en sus respuestas).
function aBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(archivo);
  });
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
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [menu, setMenu] = useState<MenuSemanaAdmin[]>([]);
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // panel compacto de cocina
  const [fechaPanel, setFechaPanel] = useState(() => hoyLocal());
  const [panelDia, setPanelDia] = useState<PanelCocina | null>(null);
  const [menuDia, setMenuDia] = useState<MenuItem[]>([]);
  const [panelCargando, setPanelCargando] = useState(false);

  // reporte de sobrantes del panel de cocina. El borrador guarda los
  // valores escritos por sede + jornada: "Sede||Almuerzo" -> {porciones, peso_kg}
  const [sobrantesCargando, setSobrantesCargando] = useState(false);
  const [sobrantesGuardando, setSobrantesGuardando] = useState(false);
  const [sobrantesBorrador, setSobrantesBorrador] = useState<
    Record<string, { porciones: string; peso_kg: string }>
  >({});
  const [sobranteError, setSobranteError] = useState("");
  const [sobranteExito, setSobranteExito] = useState("");

  // historial de sobrantes del reporte: todos los registros que caen
  // dentro del filtro de fechas elegido (sirve para ver qué días hubo
  // desperdicio y cuánto fue)
  const [sobrantesReporte, setSobrantesReporte] = useState<Sobrante[]>([]);
  // edicion de sobrantes desde el reporte: la sede + fecha en edicion,
  // con los valores de cada jornada para poder corregirlos
  const [editandoSobrantes, setEditandoSobrantes] = useState<{
    fecha: string;
    sede: string;
    jornadas: Record<string, { porciones: string; peso_kg: string }>;
  } | null>(null);
  const [sobrantesReporteMensaje, setSobrantesReporteMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  // reportes tecnicos (desperdicio, tabla diaria, exportar)
  const [totales, setTotales] = useState<Record<string, { reservas: number; asistieron: number }>>({});
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [diaria, setDiaria] = useState<ReservaDiaria[]>([]);
  const [fechaDiaria, setFechaDiaria] = useState(() => hoyLocal());
  const [diariaCargada, setDiariaCargada] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // formulario de usuario (cuenta del panel)
  const [nombreUsu, setNombreUsu] = useState("");
  const [usuarioUsu, setUsuarioUsu] = useState("");
  const [rolUsu, setRolUsu] = useState("cocina");
  const [claveUsu, setClaveUsu] = useState("");
  const [sedeUsu, setSedeUsu] = useState("");
  const [turnoUsu, setTurnoUsu] = useState("Almuerzo");
  const [gradoUsu, setGradoUsu] = useState("");
  const [usuError, setUsuError] = useState("");
  const [usuExito, setUsuExito] = useState("");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");

  // edicion de una cuenta existente (abre un formulario en la fila)
  const [editandoUsuario, setEditandoUsuario] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUsuario, setEditUsuario] = useState("");
  const [editRol, setEditRol] = useState("cocina");
  const [editClave, setEditClave] = useState("");
  const [editSede, setEditSede] = useState("");
  const [editTurno, setEditTurno] = useState("Almuerzo");
  const [editGrado, setEditGrado] = useState("");

  // asistencia del profesor: fecha elegida, grupo en sesion y reservados
  const [asistenciaFecha, setAsistenciaFecha] = useState(() => hoyLocal());
  const [asistenciaGrupo, setAsistenciaGrupo] = useState<{
    sede: string;
    turno: string;
    grado: string;
  } | null>(null);
  const [asistenciaReservas, setAsistenciaReservas] = useState<ReservaAsistencia[]>([]);
  const [asistenciaCargando, setAsistenciaCargando] = useState(false);
  const [asistenciaError, setAsistenciaError] = useState("");
  const [asistenciaExito, setAsistenciaExito] = useState("");

  // incidentes / alergias: reportes del profesor que ve el coordinador
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [incidentesFiltro, setIncidentesFiltro] = useState<"todos" | "pendientes" | "resueltos">("todos");
  const [incidenteCargando, setIncidenteCargando] = useState(false);
  const [incidenteError, setIncidenteError] = useState("");
  const [incidenteExito, setIncidenteExito] = useState("");
  // formulario del profesor: estudiantes de su grupo + datos del reporte
  const [incidenteEstudiantes, setIncidenteEstudiantes] = useState<
    { documento: string; nombre: string; grado?: string }[]
  >([]);
  const [incidenteDoc, setIncidenteDoc] = useState("");
  const [incidenteTipo, setIncidenteTipo] = useState("Incidente");
  const [incidenteDescripcion, setIncidenteDescripcion] = useState("");
  const [incidenteFecha, setIncidenteFecha] = useState(() => hoyLocal());
  const [incidenteImagen, setIncidenteImagen] = useState("");
  const [incidenteSubiendoFoto, setIncidenteSubiendoFoto] = useState(false);
  const [incidenteEnviando, setIncidenteEnviando] = useState(false);
  const [incidenteResolviendo, setIncidenteResolviendo] = useState<number | null>(null);
  // edicion inline de un reporte del profesor
  const [editandoIncidente, setEditandoIncidente] = useState<Incidente | null>(null);
  const [editIncidenteTipo, setEditIncidenteTipo] = useState("Incidente");
  const [editIncidenteDoc, setEditIncidenteDoc] = useState("");
  const [editIncidenteDescripcion, setEditIncidenteDescripcion] = useState("");
  const [editIncidenteFecha, setEditIncidenteFecha] = useState(() => hoyLocal());
  const [editIncidenteImagen, setEditIncidenteImagen] = useState("");
  const [editIncidenteSubiendoFoto, setEditIncidenteSubiendoFoto] = useState(false);
  const [editIncidenteEnviando, setEditIncidenteEnviando] = useState(false);
  // filtros del coordinador: rango de fechas y busqueda por estudiante
  const [incidentesDesde, setIncidentesDesde] = useState("");
  const [incidentesHasta, setIncidentesHasta] = useState("");
  const [incidentesBusqueda, setIncidentesBusqueda] = useState("");

  // chat de contacto: hilos abiertos, mensajes cargados y borradores.
  // Con el chat el admin puede responder varias veces (no solo una).
  const [hilos, setHilos] = useState<Record<number, MensajeChat[]>>({});
  const [hiloAbierto, setHiloAbierto] = useState<Record<number, boolean>>({});
  const [hiloCargando, setHiloCargando] = useState<Record<number, boolean>>({});
  const [hiloEnviando, setHiloEnviando] = useState<Record<number, boolean>>({});
  const [borradoresChat, setBorradoresChat] = useState<Record<number, string>>({});
  const [fotosChat, setFotosChat] = useState<Record<number, File | null>>({});
  const [borrandoHilo, setBorrandoHilo] = useState<Record<number, boolean>>({});
  const hilosRef = useRef(hilos);
  hilosRef.current = hilos;
  const hiloAbiertoRef = useRef(hiloAbierto);
  hiloAbiertoRef.current = hiloAbierto;

  // formulario de institucion
  const [nombreInst, setNombreInst] = useState("");
  const [instError, setInstError] = useState("");
  const [instExito, setInstExito] = useState("");

  // formulario de sede (registrar, editar y borrar)
  const [nombreSede, setNombreSede] = useState("");
  const [editandoSede, setEditandoSede] = useState<number | null>(null);
  const [editNombreSede, setEditNombreSede] = useState("");
  const [sedeError, setSedeError] = useState("");
  const [sedeExito, setSedeExito] = useState("");

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
  const [sedeBen, setSedeBen] = useState("");
  const [turnoBen, setTurnoBen] = useState("Almuerzo");
  const [gradoBen, setGradoBen] = useState("");
  const [pinBen, setPinBen] = useState("");
  const [benError, setBenError] = useState("");
  const [benExito, setBenExito] = useState("");

  // PIN que se escribe en la fila de un beneficiario ya registrado
  const [pins, setPins] = useState<Record<number, string>>({});

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // busquedas de cada pestana (se filtra en el navegador)
  const [busquedaBeneficiarios, setBusquedaBeneficiarios] = useState("");
  const [busquedaMenu, setBusquedaMenu] = useState("");
  const [busquedaAvisos, setBusquedaAvisos] = useState("");
  const [busquedaGaleria, setBusquedaGaleria] = useState("");
  const [busquedaInstituciones, setBusquedaInstituciones] = useState("");
  const [busquedaNotificaciones, setBusquedaNotificaciones] = useState("");
  const [busquedaMensajes, setBusquedaMensajes] = useState("");

  // Pide el token al backend con usuario + clave (/api/login)
  // El backend devuelve el token y el rol, que guardamos en la
  // sesion compartida para saber qué pestañas puede ver.
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

  // Cierra sesion (borra el token guardado)
  const salir = () => {
    cerrarSesion();
    setAutenticado(false);
    setRol("");
    setClave("");
  };

  // Carga todo: panel de cocina, avisos, mensajes, beneficiarios,
  // notificaciones y lo demás (las protegidas usan el token)
  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [
        respAvisos,
        respMensajes,
        respBeneficiarios,
        respNotificaciones,
        respMenu,
        respGaleria,
        respInstituciones,
        respSedes,
      ] = await Promise.all([
        fetch(`${API_URL}/api/avisos`),
        fetch(`${API_URL}/api/contacto`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/beneficiarios`),
        fetch(`${API_URL}/api/notificaciones`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/menus`),
        fetch(`${API_URL}/api/galeria`),
        fetch(`${API_URL}/api/instituciones`),
        fetch(`${API_URL}/api/sedes`),
      ]);

      const respuestas: [string, Response][] = [
        ["avisos", respAvisos],
        ["mensajes", respMensajes],
        ["beneficiarios", respBeneficiarios],
        ["notificaciones", respNotificaciones],
        ["menu", respMenu],
        ["galeria", respGaleria],
        ["instituciones", respInstituciones],
        ["sedes", respSedes],
      ];

      // Solo son obligatorios los datos que el rol puede ver. Los
      // demas endpoints pueden devolver 403 (por ejemplo el rol cocina
      // no puede leer mensajes ni notificaciones) y eso no es un error.
      const datosPorRol: Record<string, string[]> = {
        admin: ["avisos", "mensajes", "beneficiarios", "notificaciones", "menu", "galeria", "instituciones"],
        cocina: ["avisos", "beneficiarios", "menu"],
        profesor: ["avisos", "beneficiarios"],
        coordinador: ["avisos", "mensajes", "beneficiarios", "notificaciones", "menu", "galeria", "instituciones"],
      };
      const necesarios = datosPorRol[rol] || [];

      const fallo = respuestas.find(([nombre, r]) => !r.ok && necesarios.includes(nombre));

      if (fallo) {
        const [nombre, r] = fallo;
        if (r.status === 401) {
          // el token expiro o dejo de ser valido: volvemos al login
          salir();
          throw new Error("Tu sesión expiró. Vuelve a entrar con la clave.");
        }
        throw new Error(`No se pudieron cargar los datos (${nombre}: ${r.status})`);
      }

      setAvisos(respAvisos.ok ? await respAvisos.json() : []);
      setMensajes(respMensajes.ok ? await respMensajes.json() : []);
      setBeneficiarios(respBeneficiarios.ok ? await respBeneficiarios.json() : []);
      setNotificaciones(respNotificaciones.ok ? await respNotificaciones.json() : []);

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

      setGaleria(respGaleria.ok ? await respGaleria.json() : []);
      setInstituciones(respInstituciones.ok ? await respInstituciones.json() : []);
      setSedes(respSedes.ok ? await respSedes.json() : []);

      // Solo el admin ve las cuentas de usuario del panel
      if (leerSesion()?.rol === "admin") {
        const respUsuarios = await fetch(`${API_URL}/api/usuarios`, {
          headers: cabeceras(false),
        });
        if (respUsuarios.ok) setUsuarios(await respUsuarios.json());
      }
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

  // Si la sede elegida para el formulario de beneficiarios ya no esta
  // en la lista (por ejemplo sigue siendo el valor por defecto), se
  // selecciona automaticamente la primera sede registrada.
  useEffect(() => {
    if (sedes.length === 0) return;
    if (!sedes.some((s) => s.nombre === sedeBen)) setSedeBen(sedes[0].nombre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedes]);

  // Carga el panel compacto de cocina para la fecha elegida:
  // cuantas minutas por jornada y por sede + el menu del dia.
  const cargarPanel = async (fecha: string) => {
    setPanelCargando(true);
    try {
      const [respPanel, respMenu] = await Promise.all([
        fetch(`${API_URL}/api/reservas/panel?fecha=${fecha}`, {
          headers: cabeceras(false),
        }),
        fetch(`${API_URL}/api/menus/hoy?fecha=${fecha}`),
      ]);
      if (!respPanel.ok) throw new Error("No se pudo cargar el panel");
      setPanelDia(await respPanel.json());
      const menu = (await respMenu.json()) as { platos?: MenuItem[] };
      setMenuDia(menu.platos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setPanelCargando(false);
    }
  };

  // Carga el panel cada vez que cambia la fecha o al entrar. El panel de
  // cocina (minutas por jornada/sede) es solo para admin y cocina.
  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarPanel(fechaPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaPanel]);

  // Carga los sobrantes guardados de la fecha elegida en el panel de
  // cocina y los deja en el borrador para poder editarlos.
  const cargarSobrantes = async (fecha: string) => {
    setSobrantesCargando(true);
    setSobranteError("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/sobrantes?fecha=${fecha}`,
        { headers: cabeceras(false) }
      );
      if (!respuesta.ok) throw new Error("No se pudieron cargar los sobrantes");
      const datos = (await respuesta.json()) as Sobrante[];
      const borrador: Record<string, { porciones: string; peso_kg: string }> = {};
      for (const s of datos) {
        borrador[`${s.sede}||${s.turno}`] = {
          porciones: s.porciones !== null ? String(s.porciones) : "",
          peso_kg: s.peso_kg !== null ? String(s.peso_kg) : "",
        };
      }
      setSobrantesBorrador(borrador);
    } catch (err) {
      setSobranteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSobrantesCargando(false);
    }
  };

  // Carga los sobrantes del panel de cocina (solo admin y cocina pueden
  // leerlos) cada vez que cambia la fecha o al entrar.
  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarSobrantes(fechaPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaPanel]);

  // Actualiza un campo del borrador de sobrantes
  const cambiarSobrante = (
    sede: string,
    turno: string,
    campo: "porciones" | "peso_kg",
    valor: string
  ) => {
    setSobrantesBorrador((prev) => {
      const actual = prev[`${sede}||${turno}`] || { porciones: "", peso_kg: "" };
      return { ...prev, [`${sede}||${turno}`]: { ...actual, [campo]: valor } };
    });
  };

  // Guarda todos los sobrantes escritos (solo los que tienen algo).
  // Cada fila se guarda por separado con upsert (fecha + sede + jornada).
  const guardarSobrantes = async () => {
    setSobranteError("");
    setSobranteExito("");
    const filas: { sede: string; turno: string; porciones: string; peso_kg: string }[] = [];
    for (const sede of sedes) {
      for (const turno of TURNOS_SOBRANTES) {
        const datos = sobrantesBorrador[`${sede.nombre}||${turno}`];
        if (datos && (datos.porciones.trim() || datos.peso_kg.trim())) {
          filas.push({ sede: sede.nombre, turno, ...datos });
        }
      }
    }

    if (filas.length === 0) {
      setSobranteError("Escribe al menos una porción o peso para guardar.");
      return;
    }

    setSobrantesGuardando(true);
    try {
      await Promise.all(
        filas.map((fila) =>
          fetch(`${API_URL}/api/sobrantes`, {
            method: "POST",
            headers: cabeceras(true),
            body: JSON.stringify({
              fecha: fechaPanel,
              sede: fila.sede,
              turno: fila.turno,
              porciones: fila.porciones.trim() || null,
              peso_kg: fila.peso_kg.trim() || null,
            }),
          })
        )
      );
      setSobranteExito("Sobrantes guardados correctamente.");
    } catch (err) {
      setSobranteError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSobrantesGuardando(false);
    }
  };

  // Carga los reportes tecnicos (totales, desperdicio y sobrantes). Se
  // recargan cuando cambia el filtro de fechas (semana, mes o rango
  // personalizado) y tambien tras actualizar o borrar sobrantes.
  const cargarReportes = async () => {
    try {
      const parametros = new URLSearchParams();
      if (desde) parametros.set("desde", desde);
      if (hasta) parametros.set("hasta", hasta);
      const consulta = parametros.toString();

      const [respTotales, respReporte, respSobrantes] = await Promise.all([
        fetch(`${API_URL}/api/reservas/totales?${consulta}`),
        fetch(`${API_URL}/api/reservas/reporte?${consulta}`),
        fetch(`${API_URL}/api/sobrantes?${consulta}`, { headers: cabeceras(false) }),
      ]);
      if (!respTotales.ok || !respReporte.ok || !respSobrantes.ok) {
        throw new Error("No se pudieron cargar los reportes");
      }
      setTotales(await respTotales.json());
      setReporte(await respReporte.json());
      setSobrantesReporte(await respSobrantes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  useEffect(() => {
    // Solo admin y cocina ven los reportes tecnicos (sobrantes incluidos);
    // los demás roles no tienen permiso para leer /api/sobrantes.
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, desde, hasta]);

  // Mientras se ve la pestaña Mensajes, actualizamos la lista y los
  // hilos abiertos cada pocos segundos para no tener que recargar.
  useEffect(() => {
    if (!autenticado || pestana !== "mensajes") return;
    refrescarMensajes();
    const intervalo = setInterval(refrescarMensajes, 7000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  // Al abrir la pestana Asistencia, cargamos el grupo del profesor y
  // sus reservados del dia (con la fecha que este elegida).
  useEffect(() => {
    if (!autenticado || pestana !== "asistencia") return;
    cargarAsistencia(asistenciaFecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  // Al abrir la pestana Incidentes, cargamos los reportes (y, si es
  // profesor, los estudiantes de su grupo para el formulario).
  useEffect(() => {
    if (!autenticado || pestana !== "incidentes") return;
    cargarIncidentes();
    if (rol === "profesor") cargarEstudiantesIncidente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  // Carga la tabla diaria de cocina para una fecha (protegida)
  const cargarDiaria = async (fecha: string) => {
    setDiariaCargada(false);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/diario?fecha=${fecha}`,
        { headers: cabeceras(false) }
      );
      if (!respuesta.ok) throw new Error("No se pudo cargar la tabla diaria");
      const datos = await respuesta.json();
      setDiaria(datos.reservas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDiariaCargada(true);
    }
  };

  // Cuenta la tabla diaria por turno
  const conteoDiario = () => {
    const conteo: Record<string, number> = {};
    for (const r of diaria) {
      conteo[r.turno] = (conteo[r.turno] || 0) + 1;
    }
    return conteo;
  };

  // Carga los reservados del grupo del profesor para la fecha elegida
  // (solo los de su sede, turno y grado). Ruta /api/asistencia/grupo.
  const cargarAsistencia = async (fecha: string) => {
    setAsistenciaCargando(true);
    setAsistenciaError("");
    setAsistenciaExito("");
    try {
      const respuesta = await fetch(
        `${API_URL}/api/asistencia/grupo?fecha=${fecha}`,
        { headers: cabeceras(false) }
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo cargar la asistencia");
      }
      setAsistenciaGrupo(datos.grupo);
      setAsistenciaReservas(datos.reservas || []);
    } catch (err) {
      setAsistenciaError(err instanceof Error ? err.message : "Error desconocido");
      setAsistenciaReservas([]);
      setAsistenciaGrupo(null);
    } finally {
      setAsistenciaCargando(false);
    }
  };

  // Marca si un estudiante del grupo asistio (o no) y actualiza la lista
  const marcarAsistencia = async (reserva: ReservaAsistencia) => {
    const nuevoEstado = !reserva.asistio;
    setAsistenciaError("");
    setAsistenciaExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/asistencia/${reserva.id}`, {
        method: "PUT",
        headers: cabeceras(true),
        body: JSON.stringify({ asistio: nuevoEstado }),
      });
      if (!respuesta.ok) throw new Error("No se pudo marcar la asistencia");
      setAsistenciaReservas((lista) =>
        lista.map((r) => (r.id === reserva.id ? { ...r, asistio: nuevoEstado } : r))
      );
    } catch (err) {
      setAsistenciaError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Marca (o desmarca) a todos los reservados del día de una vez
  const marcarTodosAsistencia = async (asistio: boolean) => {
    setAsistenciaError("");
    setAsistenciaExito("");
    try {
      await Promise.all(
        asistenciaReservas
          .filter((r) => r.asistio !== asistio)
          .map((r) =>
            fetch(`${API_URL}/api/asistencia/${r.id}`, {
              method: "PUT",
              headers: cabeceras(true),
              body: JSON.stringify({ asistio }),
            })
          )
      );
      setAsistenciaReservas((lista) => lista.map((r) => ({ ...r, asistio })));
      setAsistenciaExito(asistio ? "✅ Todos marcados como asistieron." : "Asistencia desmarcada.");
    } catch (err) {
      setAsistenciaError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Carga los reportes de incidentes. El profesor solo ve los que el
  // mismo registro; el coordinador y el admin ven todos.
  const cargarIncidentes = async () => {
    setIncidenteCargando(true);
    setIncidenteError("");
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes`, {
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudieron cargar los reportes");
      }
      setIncidentes(datos || []);
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIncidenteCargando(false);
    }
  };

  // Si es profesor, carga los estudiantes de su grupo para poder
  // elegirlos en el formulario sin escribirlos a mano.
  const cargarEstudiantesIncidente = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/estudiantes`, {
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (respuesta.ok) setIncidenteEstudiantes(datos?.estudiantes || []);
    } catch {
      setIncidenteEstudiantes([]);
    }
  };

  // Registra un reporte de incidente o alergia (llega al coordinador)
  const reportarIncidente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidenteError("");
    setIncidenteExito("");
    setIncidenteEnviando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes`, {
        method: "POST",
        headers: cabeceras(true),
        body: JSON.stringify({
          tipo: incidenteTipo,
          documento: incidenteDoc,
          descripcion: incidenteDescripcion,
          fecha: incidenteFecha,
          imagen: incidenteImagen || null,
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo registrar el reporte");
      }
      setIncidenteExito(
        `✅ ${incidenteTipo} de ${datos.estudiante} reportado. El coordinador ya puede verlo.`
      );
      setIncidentes((lista) => [datos, ...lista]);
      setIncidenteDoc("");
      setIncidenteDescripcion("");
      setIncidenteTipo("Incidente");
      setIncidenteImagen("");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIncidenteEnviando(false);
    }
  };

  // Sube una foto adjunta de un reporte y guarda su URL en el estado
  const adjuntarFotoIncidente = async (
    archivo: File,
    setter: (url: string) => void,
    setSubiendo: (b: boolean) => void
  ) => {
    setSubiendo(true);
    try {
      const url = await subirImagen(archivo, setter);
      if (!url) throw new Error("No se pudo subir la foto");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error al subir la foto");
    } finally {
      setSubiendo(false);
    }
  };

  // El coordinador (o el admin) marca un reporte como resuelto (o lo reabre)
  const resolverIncidente = async (id: number, resuelto: boolean) => {
    setIncidenteError("");
    setIncidenteExito("");
    setIncidenteResolviendo(id);
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/${id}`, {
        method: "PUT",
        headers: cabeceras(true),
        body: JSON.stringify({ resuelto }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo actualizar el reporte");
      }
      setIncidentes((lista) => lista.map((i) => (i.id === id ? datos : i)));
      setIncidenteExito(resuelto ? "✅ Reporte marcado como resuelto." : "Reporte reabierto.");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIncidenteResolviendo(null);
    }
  };

  // Abre el formulario para editar un reporte propio del profesor
  const abrirEdicionIncidente = (inc: Incidente) => {
    setEditandoIncidente(inc);
    setEditIncidenteTipo(inc.tipo);
    setEditIncidenteDoc(inc.documento || "");
    setEditIncidenteDescripcion(inc.descripcion);
    setEditIncidenteFecha(inc.fecha);
    setEditIncidenteImagen(inc.imagen || "");
  };

  // Guarda los cambios de un reporte que el profesor está editando
  const guardarIncidenteEditado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoIncidente) return;
    setIncidenteError("");
    setIncidenteExito("");
    setEditIncidenteEnviando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/${editandoIncidente.id}`, {
        method: "PUT",
        headers: cabeceras(true),
        body: JSON.stringify({
          tipo: editIncidenteTipo,
          documento: editIncidenteDoc,
          descripcion: editIncidenteDescripcion,
          fecha: editIncidenteFecha,
          imagen: editIncidenteImagen || null,
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo guardar el reporte");
      }
      setIncidentes((lista) => lista.map((i) => (i.id === editandoIncidente.id ? datos : i)));
      setEditandoIncidente(null);
      setIncidenteExito("✅ Reporte actualizado.");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEditIncidenteEnviando(false);
    }
  };

  // Borra un reporte (el profesor solo los suyos; coordinador/admin cualquiera)
  const borrarIncidente = async (inc: Incidente) => {
    if (
      !window.confirm(
        `¿Borrar el ${inc.tipo.toLowerCase()} de ${inc.estudiante} del ${fechaCortaDia(inc.fecha)}?`
      )
    ) {
      return;
    }
    setIncidenteError("");
    setIncidenteExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/incidentes/${inc.id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo borrar el reporte");
      }
      setIncidentes((lista) => lista.filter((i) => i.id !== inc.id));
      setIncidenteExito("🗑️ Reporte borrado.");
    } catch (err) {
      setIncidenteError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Filtra los reportes segun el estado, el rango de fechas (coordinador)
  // y la busqueda por estudiante. La fecha se compara como texto YYYY-MM-DD.
  const incidentesVisibles = incidentes.filter((i) => {
    const porEstado =
      incidentesFiltro === "todos"
        ? true
        : incidentesFiltro === "pendientes"
          ? !i.resuelto
          : i.resuelto;
    const enRango =
      (!incidentesDesde || i.fecha >= incidentesDesde) &&
      (!incidentesHasta || i.fecha <= incidentesHasta);
    const coincideBusqueda =
      !incidentesBusqueda.trim() ||
      i.estudiante.toLowerCase().includes(incidentesBusqueda.trim().toLowerCase()) ||
      (i.documento || "").toLowerCase().includes(incidentesBusqueda.trim().toLowerCase());
    return porEstado && enRango && coincideBusqueda;
  });

  // Agrupa los sobrantes del reporte por fecha y sede: cada sede sale con
  // su propio total de porciones, kilos y jornadas del día. Devuelve las
  // filas de la fecha más reciente a la más antigua (y por sede en orden).
  const sobrantesPorFechaSede = () => {
    const porSede: Record<
      string,
      { fecha: string; sede: string; jornadas: string[]; porciones: number; peso_kg: number }
    > = {};
    for (const s of sobrantesReporte) {
      const clave = `${s.fecha}||${s.sede}`;
      const actual =
        porSede[clave] ||
        (porSede[clave] = {
          fecha: s.fecha,
          sede: s.sede,
          jornadas: [],
          porciones: 0,
          peso_kg: 0,
        });
      if (!actual.jornadas.includes(s.turno)) actual.jornadas.push(s.turno);
      actual.porciones += s.porciones ?? 0;
      actual.peso_kg += s.peso_kg ?? 0;
    }
    return Object.values(porSede).sort((a, b) =>
      a.fecha === b.fecha
        ? a.sede < b.sede
          ? -1
          : 1
        : a.fecha < b.fecha
          ? 1
          : -1
    );
  };

  // Abre el formulario para corregir los sobrantes de una sede en una
  // fecha: rellena las jornadas con los valores ya guardados.
  const abrirEdicionSobrantes = (fecha: string, sede: string) => {
    const jornadas: Record<string, { porciones: string; peso_kg: string }> = {};
    for (const s of sobrantesReporte) {
      if (s.fecha === fecha && s.sede === sede) {
        jornadas[s.turno] = {
          porciones: s.porciones?.toString() ?? "",
          peso_kg: s.peso_kg?.toString() ?? "",
        };
      }
    }
    setEditandoSobrantes({ fecha, sede, jornadas });
    setSobrantesReporteMensaje(null);
  };

  // Cambia un campo (porciones o peso) de una jornada del formulario de
  // edicion del reporte.
  const cambiarSobranteReporte = (
    turno: string,
    campo: "porciones" | "peso_kg",
    valor: string
  ) => {
    setEditandoSobrantes((prev) => {
      if (!prev) return prev;
      const actual = prev.jornadas[turno] || { porciones: "", peso_kg: "" };
      return {
        ...prev,
        jornadas: {
          ...prev.jornadas,
          [turno]: { ...actual, [campo]: valor },
        },
      };
    });
  };

  // Guarda los cambios de las jornadas editadas (upsert por sede+jornada)
  const guardarSobrantesEditados = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoSobrantes) return;
    setSobrantesReporteMensaje(null);
    try {
      for (const turno of TURNOS_SOBRANTES) {
        const datos = editandoSobrantes.jornadas[turno];
        if (!datos) continue;
        const respuesta = await fetch(`${API_URL}/api/sobrantes`, {
          method: "POST",
          headers: cabeceras(true),
          body: JSON.stringify({
            fecha: editandoSobrantes.fecha,
            sede: editandoSobrantes.sede,
            turno,
            porciones: datos.porciones,
            peso_kg: datos.peso_kg,
          }),
        });
        if (!respuesta.ok) {
          throw new Error("No se pudieron guardar los cambios");
        }
      }
      setEditandoSobrantes(null);
      setSobrantesReporteMensaje({
        tipo: "exito",
        texto: "Sobrantes actualizados correctamente.",
      });
      cargarReportes();
    } catch (err) {
      setSobrantesReporteMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error al guardar",
      });
    }
  };

  // Borra todos los sobrantes de una sede en una fecha (las dos jornadas)
  const borrarSobrantes = async (fecha: string, sede: string) => {
    if (!window.confirm(`¿Borrar los sobrantes del ${fechaCorta(fecha)} de ${sede}?`)) return;
    setSobrantesReporteMensaje(null);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/sobrantes?fecha=${encodeURIComponent(fecha)}&sede=${encodeURIComponent(sede)}`,
        { method: "DELETE", headers: cabeceras(false) }
      );
      if (!respuesta.ok) throw new Error("No se pudieron borrar los sobrantes");
      setEditandoSobrantes(null);
      setSobrantesReporteMensaje({
        tipo: "exito",
        texto: "Sobrantes eliminados correctamente.",
      });
      cargarReportes();
    } catch (err) {
      setSobrantesReporteMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error al borrar",
      });
    }
  };

  // Descarga un Excel con el resumen de reservas por fecha y el reporte
  // Construye las secciones del reporte a partir de los datos cargados
  // (lo usan tanto la descarga como la vista previa del documento)
  const construirSecciones = (): SeccionTabla[] => [
    {
      titulo: "Reservas por fecha",
      columnas: ["Fecha", "Reservadas", "Asistieron"],
      filas: Object.entries(totales)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([fecha, info]) => [fecha, info.reservas, info.asistieron]),
    },
    ...(reporte
      ? [
          {
            titulo: "Reporte general de desperdicio",
            columnas: ["Concepto", "Valor"],
            filas: [
              ["Total reservadas", reporte.totalReservas],
              ["Minutas servidas", reporte.minutasServidas],
              ["Minutas desperdiciadas", reporte.minutasDesperdiciadas],
              ["Porcentaje de desperdicio", `${reporte.porcentajeDesperdicio}%`],
            ],
          },
        ]
      : []),
    ...(sobrantesReporte.length > 0
      ? [
          {
            titulo: "Sobrantes registrados (desperdicio) por fecha y sede",
            columnas: ["Fecha", "Sede", "Jornadas", "Porciones", "Peso (kg)"],
            filas: sobrantesPorFechaSede().map((fila) => [
              fila.fecha,
              fila.sede,
              fila.jornadas.join(", "),
              fila.porciones,
              fila.peso_kg,
            ]),
          },
        ]
      : []),
  ];

  // Titulo y subtitulo del documento, segun el filtro de fechas elegido
  const opcionesReporte = (): OpcionesExportar => {
    const desdeHasta =
      desde && hasta
        ? `del ${desde} al ${hasta}`
        : desde
          ? `desde ${desde}`
          : hasta
            ? `hasta ${hasta}`
            : "todo el historial";

    return {
      titulo: "Reporte de Reservas y Desperdicio",
      subtitulo: `Resumen de minutas ${desdeHasta}`,
    };
  };

  // Descarga el reporte como Excel
  const exportarCSV = () => {
    descargarExcel(construirSecciones(), "reporte-pae.xls", opcionesReporte());
  };

  // Imprime / guarda en PDF la tabla diaria de cocina
  const imprimirDiaria = () => {
    window.print();
  };

  // Publica un aviso nuevo (si hay imagen subida, la adjunta)
  const publicarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoError("");
    setAvisoExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos`, {
        method: "POST",
        headers: cabeceras(),
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
        headers: cabeceras(false),
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

  // Guarda un plato nuevo del menu
  const registrarMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError("");
    setMenuExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/menus`, {
        method: "POST",
        headers: cabeceras(),
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
        headers: cabeceras(false),
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
        headers: cabeceras(),
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
        headers: cabeceras(false),
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
        headers: cabeceras(),
        body: JSON.stringify({
          documento: docBen,
          nombre: nombreBen,
          sede: sedeBen,
          turno: turnoBen,
          grado: gradoBen,
          pin: pinBen,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo registrar");
      }
      setDocBen("");
      setNombreBen("");
      setGradoBen("");
      setPinBen("");
      setBenExito("✅ Beneficiario registrado. Ya puede reservar su minuta.");
      cargarDatos();
    } catch (err) {
      setBenError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Asigna (o renueva) el PIN de un beneficiario ya registrado para que
  // pueda entrar a reservar con documento + PIN.
  const asignarPin = async (ben: Beneficiario) => {
    const pin = (pins[ben.id] || "").trim();
    if (!pin) return;
    setBenError("");
    setBenExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios/${ben.id}/pin`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ pin }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo asignar el PIN");
      setPins((p) => ({ ...p, [ben.id]: "" }));
      setBenExito(`✅ PIN asignado a ${ben.nombre}. Ya puede entrar a reservar.`);
    } catch (err) {
      setBenError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra un beneficiario
  const borrarBeneficiario = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/beneficiarios/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
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
        headers: cabeceras(),
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
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Registra una sede nueva
  const registrarSede = async (e: React.FormEvent) => {
    e.preventDefault();
    setSedeError("");
    setSedeExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/sedes`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ nombre: nombreSede }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo registrar la sede");
      }
      setNombreSede("");
      setSedeExito("✅ Sede registrada. Ya aparece en la reserva y en los beneficiarios.");
      cargarDatos();
    } catch (err) {
      setSedeError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Abre el formulario de edicion de una sede con su nombre actual
  const iniciarEdicionSede = (s: Sede) => {
    setEditandoSede(s.id);
    setEditNombreSede(s.nombre);
  };

  // Guarda el nuevo nombre de una sede
  const guardarEdicionSede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoSede === null) return;
    setSedeError("");
    setSedeExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/sedes/${editandoSede}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ nombre: editNombreSede }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo actualizar la sede");
      }
      setEditandoSede(null);
      setSedeExito("✅ Sede actualizada. Los beneficiarios y reservas se actualizaron.");
      cargarDatos();
    } catch (err) {
      setSedeError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra una sede
  const borrarSede = async (id: number) => {
    setSedeError("");
    setSedeExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/sedes/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo borrar la sede");
      }
      cargarDatos();
    } catch (err) {
      setSedeError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Crea una cuenta de usuario del panel (solo admin)
  const registrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsuError("");
    setUsuExito("");
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({
          nombre: nombreUsu,
          usuario: usuarioUsu,
          rol: rolUsu,
          clave: claveUsu,
          sede: rolUsu === "profesor" ? sedeUsu : undefined,
          turno: rolUsu === "profesor" ? turnoUsu : undefined,
          grado: rolUsu === "profesor" ? gradoUsu : undefined,
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo crear el usuario");
      }
      setNombreUsu("");
      setUsuarioUsu("");
      setClaveUsu("");
      setSedeUsu("");
      setGradoUsu("");
      setUsuExito("✅ Cuenta creada. Ese usuario ya puede entrar al panel.");
      cargarDatos();
    } catch (err) {
      setUsuError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Activa o desactiva una cuenta (solo admin)
  const alternarUsuario = async (usuario: Usuario) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ activo: !usuario.activo }),
      });
      if (!respuesta.ok) throw new Error("No se pudo actualizar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Borra una cuenta (solo admin)
  const borrarUsuario = async (usuario: Usuario) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/${usuario.id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo borrar");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Marca un mensaje de contacto como leido (o no leido)
  const alternarLeido = async (mensaje: Mensaje) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/${mensaje.id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ leido: !mensaje.leido }),
      });
      if (!respuesta.ok) throw new Error("No se pudo actualizar el mensaje");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Carga el hilo de una conversacion de contacto (mensajes del
  // estudiante y del admin).
  const cargarHilo = async (id: number) => {
    setHiloCargando((c) => ({ ...c, [id]: true }));
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/${id}/mensajes`, {
        headers: cabeceras(false),
      });
      if (respuesta.ok) {
        const datos = (await respuesta.json()) as MensajeChat[];
        setHilos((h) => ({ ...h, [id]: datos }));
      }
    } catch {
      // si falla, dejamos el hilo anterior
    } finally {
      setHiloCargando((c) => ({ ...c, [id]: false }));
    }
  };

  // Abre/cierra la conversacion de un mensaje
  const abrirHilo = (id: number) => {
    setHiloAbierto((a) => {
      const abierto = !a[id];
      if (abierto) cargarHilo(id);
      return { ...a, [id]: abierto };
    });
  };

  // El admin manda un mensaje al hilo. Se puede hacer varias veces:
  // no hay limite como antes (donde solo se podia responder una vez).
  const enviarMensajeAdmin = async (id: number) => {
    const texto = (borradoresChat[id] || "").trim();
    const foto = fotosChat[id];
    if (!texto && !foto) return;
    setHiloEnviando((e) => ({ ...e, [id]: true }));
    try {
      const cuerpo: Record<string, unknown> = { texto };
      if (foto) {
        cuerpo.imagenBase64 = await aBase64(foto);
        cuerpo.imagenNombre = foto.name;
      }
      const respuesta = await fetch(`${API_URL}/api/contacto/${id}/mensajes`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo enviar el mensaje");
      setBorradoresChat((b) => ({ ...b, [id]: "" }));
      setFotosChat((f) => ({ ...f, [id]: null }));
      cargarHilo(id);
      refrescarMensajes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setHiloEnviando((e) => ({ ...e, [id]: false }));
    }
  };

  // Borra la conversación completa. El estudiante también la pierde.
  const borrarConversacion = async (id: number) => {
    if (!window.confirm("¿Borrar esta conversación? No se puede deshacer.")) return;
    setBorrandoHilo((e) => ({ ...e, [id]: true }));
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo borrar la conversación");
      setMensajes((m) => m.filter((msj) => msj.id !== id));
      setHilos((h) => {
        const copia = { ...h };
        delete copia[id];
        return copia;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setBorrandoHilo((e) => ({ ...e, [id]: false }));
    }
  };

  // Refresca la lista de mensajes y los hilos abiertos. Asi los
  // mensajes nuevos del estudiante aparecen sin recargar la pagina.
  const refrescarMensajes = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto`, {
        headers: cabeceras(false),
      });
      if (respuesta.ok) setMensajes(await respuesta.json());
    } catch {
      // sin hacer nada: el proximo ciclo lo intenta de nuevo
    }
    for (const id of Object.keys(hilosRef.current)) {
      if (hiloAbiertoRef.current[Number(id)]) cargarHilo(Number(id));
    }
  };

  // Abre el formulario de edicion de una cuenta con sus datos actuales
  const iniciarEdicionUsuario = (u: Usuario) => {
    setEditandoUsuario(u.id);
    setEditNombre(u.nombre);
    setEditUsuario(u.usuario);
    setEditRol(u.rol);
    setEditClave(u.clave || "");
    setEditSede(u.sede || "");
    setEditTurno(u.turno || "Almuerzo");
    setEditGrado(u.grado || "");
  };

  // Guarda los cambios de una cuenta editada (solo admin)
  const guardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoUsuario === null) return;
    try {
      const cuerpo: Record<string, unknown> = {
        nombre: editNombre,
        usuario: editUsuario,
        rol: editRol,
      };
      // Si dejan la clave vacia, no se cambia la actual
      if (editClave) cuerpo.clave = editClave;
      // El grupo del profesor se envia junto al rol
      if (editRol === "profesor") {
        cuerpo.sede = editSede;
        cuerpo.turno = editTurno;
        cuerpo.grado = editGrado;
      }
      const respuesta = await fetch(`${API_URL}/api/usuarios/${editandoUsuario}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo actualizar la cuenta");
      setEditandoUsuario(null);
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

  // ---------- Panel de administrador ----------
  // Pestañas que puede ver cada rol:
  // admin ve todas, cocina solo su panel y el menú, profesor los
  // beneficiarios y avisos, coordinador el contenido público.
  const noLeidos = mensajes.filter((m) => !m.leido).length;
  const pestanasPorRol: Record<string, { id: Pestana; etiqueta: string }[]> = {
    admin: [
      { id: "panel", etiqueta: "🍳 Panel de cocina" },
      { id: "beneficiarios", etiqueta: "🎓 Beneficiarios" },
      { id: "menu", etiqueta: "🍽️ Menú" },
      { id: "avisos", etiqueta: "📢 Avisos" },
      { id: "galeria", etiqueta: "🖼️ Galería" },
      { id: "instituciones", etiqueta: "🏫 Instituciones" },
      { id: "sedes", etiqueta: "📍 Sedes" },
      { id: "notificaciones", etiqueta: "🔔 Notificaciones" },
      { id: "mensajes", etiqueta: `✉️ Mensajes${noLeidos > 0 ? ` (${noLeidos} sin leer)` : ""}` },
      { id: "reportes", etiqueta: "📊 Reportes" },
      { id: "usuarios", etiqueta: "🔐 Usuarios" },
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
      { id: "avisos", etiqueta: "📢 Avisos" },
      { id: "incidentes", etiqueta: "🚨 Incidentes" },
      { id: "galeria", etiqueta: "🖼️ Galería" },
      { id: "instituciones", etiqueta: "🏫 Instituciones" },
      { id: "notificaciones", etiqueta: "🔔 Notificaciones" },
      { id: "mensajes", etiqueta: `✉️ Mensajes${noLeidos > 0 ? ` (${noLeidos} sin leer)` : ""}` },
    ],
  };

  const pestanasVisibles = pestanasPorRol[rol] || [];

  // Si el rol no puede ver la pestaña elegida, volvemos a la primera
  const pestanaActiva = pestanasVisibles.some((p) => p.id === pestana)
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
      </div>

      {/* Pestañas */}
      <div
        className="admin-pestanas"
        role="tablist"
        aria-label="Secciones del panel"
      >
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
        <div id="panel-panel" role="tabpanel" aria-labelledby="tab-panel">
          {/* Selector de fecha para ver cuantas minutas preparar */}
          <div className="panel-fecha">
            <label htmlFor="fecha-panel">Fecha</label>
            <input
              id="fecha-panel"
              type="date"
              value={fechaPanel}
              onChange={(e) => setFechaPanel(e.target.value)}
            />
          </div>

          {panelCargando && <p className="estado">Cargando panel…</p>}

          {!panelCargando && panelDia && (
            <>
              {/* Total por jornada: lo que hay que preparar hoy */}
              <h2 className="admin-subtitulo">Minutas a preparar</h2>
              <div className="reporte-cajas">
                <div className="reporte-caja">
                  <span className="reporte-numero">{panelDia.porJornada.Almuerzo || 0}</span>
                  <span className="reporte-etiqueta">Almuerzos</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">{panelDia.porJornada.Refrigerio || 0}</span>
                  <span className="reporte-etiqueta">Refrigerios</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">{panelDia.total}</span>
                  <span className="reporte-etiqueta">Total del día</span>
                </div>
              </div>

              {/* Desglose por sede: cuantas raciones va a cada sede */}
              {Object.keys(panelDia.porSede || {}).length > 0 && (
                <>
                  <h3 className="reporte-subtitulo">Por sede</h3>
                  <div className="reporte-desglose">
                    {Object.entries(panelDia.porSede || {}).map(([sede, cantidad]) => (
                      <div key={sede} className="reporte-caja">
                        <span className="reporte-numero">{cantidad}</span>
                        <span className="reporte-etiqueta">{sede}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Reporte de sobrantes: lo que quedo sin servir por sede y jornada */}
              <div className="sobrantes">
                <h2 className="admin-subtitulo">Sobrantes del día</h2>
                <p className="estado">
                  Registra cuántas porciones y el peso (kg) de comida que
                  sobró en cada sede y jornada.
                </p>
                {sobrantesCargando && <p className="estado">Cargando sobrantes…</p>}
                {!sobrantesCargando &&
                  (sedes.length === 0 ? (
                    <p className="estado">
                      Aún no hay sedes registradas. Crea una desde la pestaña
                      "Sedes".
                    </p>
                  ) : (
                    <>
                      {sedes.map((s) => (
                        <div key={s.id} className="sobrante-sede">
                          <h3 className="sobrante-sede-nombre">{s.nombre}</h3>
                          {TURNOS_SOBRANTES.map((turno) => {
                            const clave = `${s.nombre}||${turno}`;
                            const datos = sobrantesBorrador[clave] || { porciones: "", peso_kg: "" };
                            return (
                              <div key={turno} className="sobrante-fila">
                                <span className="sobrante-turno">{turno}</span>
                                <label>
                                  Porciones sobrantes
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={datos.porciones}
                                    onChange={(e) =>
                                      cambiarSobrante(s.nombre, turno, "porciones", e.target.value)
                                    }
                                    placeholder="Ej: 12"
                                    aria-label={`Porciones sobrantes de ${turno} en ${s.nombre}`}
                                  />
                                </label>
                                <label>
                                  Peso (kg)
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={datos.peso_kg}
                                    onChange={(e) =>
                                      cambiarSobrante(s.nombre, turno, "peso_kg", e.target.value)
                                    }
                                    placeholder="Ej: 3.5"
                                    aria-label={`Peso sobrante de ${turno} en ${s.nombre}`}
                                  />
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      <div className="sobrante-acciones">
                        <button
                          type="button"
                          className="boton boton-primario"
                          onClick={guardarSobrantes}
                          disabled={sobrantesGuardando}
                        >
                          {sobrantesGuardando ? "Guardando…" : "Guardar sobrantes"}
                        </button>
                      </div>
                      {sobranteError && (
                        <p className="estado error" role="alert">⚠️ {sobranteError}</p>
                      )}
                      {sobranteExito && (
                        <p className="estado exito" role="status">✅ {sobranteExito}</p>
                      )}
                    </>
                  ))}
              </div>

              {/* Menu del dia: lo que toca cocinar */}
              {menuDia.length > 0 && (
                <>
                  <h2 className="admin-subtitulo">Menú del día</h2>
                  <div className="lista-totales">
                    {menuDia.map((plato) => (
                      <article key={plato.id} className="total-fecha">
                        <span className="total-fecha-nombre">{plato.jornada}</span>
                        <span className="total-fecha-cantidad">
                          {plato.platillo}
                        </span>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {panelDia.total === 0 && (
                <p className="estado">
                  No hay reservas para esa fecha. Revisa que la fecha sea hábil
                  (lunes a viernes) y que los estudiantes hayan reservado.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {!cargando && !error && pestanaActiva === "reportes" && (
        <div id="panel-reportes" role="tabpanel" aria-labelledby="tab-reportes">
          <FiltroReportes
            desde={desde}
            hasta={hasta}
            onCambio={(d, h) => { setDesde(d); setHasta(h); }}
          />

          {reporte && (
            <div className="reporte">
              <h2 className="admin-subtitulo">Reporte de desperdicio</h2>
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
                  <span className="reporte-numero">{reporte.minutasDesperdiciadas}</span>
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

              {/* Botones de exportacion */}
              <div className="centrar">
                <button type="button" className="boton boton-secundario" onClick={exportarCSV} aria-label="Exportar reporte a Excel">
                  ⬇️ Exportar Excel
                </button>
              </div>
            </div>
          )}

          {/* Sobrantes (desperdicio) registrados por cocina, agrupados por fecha y sede */}
          <h2 className="admin-subtitulo">Sobrantes registrados por fecha</h2>
          <p className="subtitulo">
            Los días en que se reportó desperdicio de comida en el período
            elegido, con el total de porciones y kilos por cada sede y fecha.
          </p>

          {sobrantesReporteMensaje && (
            <p className={`estado ${sobrantesReporteMensaje.tipo === "exito" ? "" : "error"}`}>
              {sobrantesReporteMensaje.tipo === "exito" ? "✅ " : "⚠️ "}
              {sobrantesReporteMensaje.texto}
            </p>
          )}

          {sobrantesReporte.length === 0 ? (
            <p className="estado">No hay sobrantes registrados en el período seleccionado.</p>
          ) : (
            <>
              <div className="reporte-cajas">
                <div className="reporte-caja">
                  <span className="reporte-numero">
                    {new Set(sobrantesReporte.map((s) => s.fecha)).size}
                  </span>
                  <span className="reporte-etiqueta">Días con reporte</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">
                    {sobrantesReporte.reduce((total, s) => total + (s.porciones ?? 0), 0)}
                  </span>
                  <span className="reporte-etiqueta">Porciones desperdiciadas</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">
                    {sobrantesReporte.reduce((total, s) => total + (s.peso_kg ?? 0), 0)}
                  </span>
                  <span className="reporte-etiqueta">Peso total (kg)</span>
                </div>
              </div>

              <div className="tabla-cocina">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Sede</th>
                      <th>Jornadas</th>
                      <th>Porciones</th>
                      <th>Peso (kg)</th>
                      {(rol === "admin" || rol === "cocina") && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sobrantesPorFechaSede().map((fila) => (
                      <tr key={`${fila.fecha}||${fila.sede}`}>
                        <td>{fechaCorta(fila.fecha)}</td>
                        <td>{fila.sede}</td>
                        <td>{fila.jornadas.join(", ")}</td>
                        <td>{fila.porciones}</td>
                        <td>{fila.peso_kg}</td>
                        {(rol === "admin" || rol === "cocina") && (
                          <td className="sobrante-acciones">
                            <button
                              type="button"
                              className="boton boton-secundario"
                              onClick={() => abrirEdicionSobrantes(fila.fecha, fila.sede)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              className="boton boton-peligro"
                              onClick={() => borrarSobrantes(fila.fecha, fila.sede)}
                            >
                              🗑️ Borrar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Formulario para corregir los sobrantes de una sede en una fecha */}
          {editandoSobrantes && (
            <form className="formulario" onSubmit={guardarSobrantesEditados}>
              <h3 className="admin-subtitulo">
                Editar sobrantes · {fechaCorta(editandoSobrantes.fecha)} ·{" "}
                {editandoSobrantes.sede}
              </h3>
              {TURNOS_SOBRANTES.map((turno) => {
                const valores = editandoSobrantes.jornadas[turno] || {
                  porciones: "",
                  peso_kg: "",
                };
                return (
                  <div key={turno} className="sobrante-fila">
                    <span className="sobrante-turno">{turno}</span>
                    <label>
                      Porciones
                      <input
                        type="number"
                        min="0"
                        value={valores.porciones}
                        onChange={(e) =>
                          cambiarSobranteReporte(turno, "porciones", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Peso (kg)
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={valores.peso_kg}
                        onChange={(e) =>
                          cambiarSobranteReporte(turno, "peso_kg", e.target.value)
                        }
                      />
                    </label>
                  </div>
                );
              })}
              <div className="sobrante-acciones">
                <button type="submit" className="boton boton-primario">
                  Guardar cambios
                </button>
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => setEditandoSobrantes(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Vista previa del documento que se exporta */}
          <div className="reporte">
            <h2 className="admin-subtitulo">Vista previa del reporte</h2>
            <p className="subtitulo">
              Así se verá el documento que se descarga como Excel. Se actualiza
              según el filtro de fechas elegido.
            </p>
            <iframe
              className="vista-previa"
              title="Vista previa del reporte"
              srcDoc={construirHtmlExcel(construirSecciones(), opcionesReporte())}
            />
          </div>

          {/* Tabla diaria para la cocina */}
          <hr className="separador" />
          <div className="tabla-diaria">
            <h2 className="admin-subtitulo">Tabla diaria de cocina</h2>
            <p className="subtitulo">
              Elige una fecha para ver cuántas minutas preparar por turno y
              quién reservó. Puedes imprimirla o guardarla en PDF.
            </p>

            <form
              className="formulario formulario-fila"
              onSubmit={(e) => {
                e.preventDefault();
                cargarDiaria(fechaDiaria);
              }}
            >
              <label htmlFor="fecha-diaria">
                Fecha
                <input
                  id="fecha-diaria"
                  type="date"
                  value={fechaDiaria}
                  onChange={(e) => setFechaDiaria(e.target.value)}
                />
              </label>
              <button type="submit" className="boton boton-primario">
                Ver minutas
              </button>
              {diariaCargada && (
                <button type="button" className="boton boton-secundario" onClick={imprimirDiaria} aria-label="Imprimir tabla diaria o guardar en PDF">
                  🖨️ Imprimir / PDF
                </button>
              )}
            </form>

            {diariaCargada && (
              <>
                {diaria.length === 0 ? (
                  <p className="estado">
                    No hay reservas para el {fechaDiaria}.
                  </p>
                ) : (
                  <>
                    <div className="reporte-desglose">
                      {Object.entries(conteoDiario()).map(([turno, cantidad]) => (
                        <div key={turno} className="reporte-caja">
                          <span className="reporte-numero">{cantidad}</span>
                          <span className="reporte-etiqueta">Minutas · {turno}</span>
                        </div>
                      ))}
                      <div className="reporte-caja">
                        <span className="reporte-numero">{diaria.length}</span>
                        <span className="reporte-etiqueta">Total del día</span>
                      </div>
                    </div>

                    <div className="tabla-cocina">
                      <table>
                        <thead>
                          <tr>
                            <th>Estudiante</th>
                            <th>Documento</th>
                            <th>Sede</th>
                            <th>Turno</th>
                            <th>Asistió</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diaria.map((r) => (
                            <tr key={r.id}>
                              <td>{r.estudiante}</td>
                              <td>{r.documento}</td>
                              <td>{r.sede}</td>
                              <td>{r.turno}</td>
                              <td>{r.asistio ? "✓" : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!cargando && !error && pestanaActiva === "beneficiarios" && (
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
            <div className="formulario-fila formulario-fila-grid">
              <label htmlFor="sede-ben">
                Sede
                <select id="sede-ben" value={sedeBen} onChange={(e) => setSedeBen(e.target.value)} required>
                  <option value="" disabled>
                    {sedes.length > 0 ? "Selecciona la sede" : "Sin sedes registradas"}
                  </option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.nombre}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                {sedes.length === 0 && (
                  <small className="campo-fijo">
                    Aún no hay sedes registradas. Crea una desde la pestaña "Sedes".
                  </small>
                )}
              </label>
              <label htmlFor="turno-ben">
                Turno
                <select id="turno-ben" value={turnoBen} onChange={(e) => setTurnoBen(e.target.value)}>
                  <option>Almuerzo</option>
                  <option>Refrigerio</option>
                  <option>Ambas jornadas</option>
                </select>
                <small className="campo-fijo">
                  Elige "Ambas jornadas" si el estudiante puede ir al Almuerzo y
                  al Refrigerio.
                </small>
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
            <label htmlFor="pin-ben">
              PIN del estudiante (opcional)
              <input
                id="pin-ben"
                type="text"
                value={pinBen}
                onChange={(e) => setPinBen(e.target.value)}
                minLength={4}
                placeholder="Ej: 8161"
                autoComplete="off"
              />
              <small className="campo-fijo">
                Si lo pones (mínimo 4 caracteres), el estudiante podrá entrar a
                reservar con documento + PIN.
              </small>
            </label>
            {benError && <p className="estado error" role="alert">⚠️ {benError}</p>}
            {benExito && <p className="estado exito" aria-live="polite">{benExito}</p>}
            <button type="submit" className="boton boton-primario" disabled={sedes.length === 0}>
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
                <div className="formulario-fila">
                  <input
                    type="text"
                    value={pins[b.id] || ""}
                    onChange={(e) =>
                      setPins((p) => ({ ...p, [b.id]: e.target.value }))
                    }
                    minLength={4}
                    placeholder="PIN nuevo (4+)"
                    aria-label={`PIN para ${b.nombre}`}
                  />
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => asignarPin(b)}
                    disabled={!(pins[b.id] || "").trim()}
                    aria-label={`Asignar PIN a ${b.nombre}`}
                  >
                    Asignar PIN
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => borrarBeneficiario(b.id)}
                    aria-label={`Borrar beneficiario ${b.nombre}`}
                  >
                    Borrar
                  </button>
                </div>
              </article>
             ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestanaActiva === "asistencia" && (
        <div id="panel-asistencia" role="tabpanel" aria-labelledby="tab-asistencia">
          <h2 className="admin-subtitulo">Asistencia de mi grupo</h2>
          <p className="subtitulo">
            Solo ves los reservados de tu grupo (sede, turno y grado).
            Marca quién asistió para que el reporte de desperdicio sea
            más exacto.
          </p>

          <form
            className="formulario formulario-fila"
            onSubmit={(e) => {
              e.preventDefault();
              cargarAsistencia(asistenciaFecha);
            }}
          >
            <label htmlFor="fecha-asistencia">
              Fecha
              <input
                id="fecha-asistencia"
                type="date"
                value={asistenciaFecha}
                onChange={(e) => setAsistenciaFecha(e.target.value)}
              />
            </label>
            <button type="submit" className="boton boton-primario">
              Ver grupo
            </button>
          </form>

          {asistenciaCargando && <p className="estado">Cargando…</p>}
          {asistenciaError && (
            <p className="estado error" role="alert">⚠️ {asistenciaError}</p>
          )}
          {asistenciaExito && (
            <p className="estado exito" aria-live="polite">{asistenciaExito}</p>
          )}

          {asistenciaGrupo && !asistenciaCargando && !asistenciaError && (
            <>
              <div className="reporte-desglose">
                <div className="reporte-caja">
                  <span className="reporte-numero">{asistenciaGrupo.sede}</span>
                  <span className="reporte-etiqueta">Sede</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">{asistenciaGrupo.turno}</span>
                  <span className="reporte-etiqueta">Turno</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">Grado {asistenciaGrupo.grado}</span>
                  <span className="reporte-etiqueta">Grupo</span>
                </div>
                <div className="reporte-caja">
                  <span className="reporte-numero">
                    {asistenciaReservas.filter((r) => r.asistio).length} de{" "}
                    {asistenciaReservas.length}
                  </span>
                  <span className="reporte-etiqueta">Asistieron</span>
                </div>
              </div>

              {asistenciaReservas.length === 0 ? (
                <p className="estado">
                  No hay reservas de tu grupo para el {fechaCorta(asistenciaFecha)}.
                </p>
              ) : (
                <>
                  <div className="formulario-fila">
                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => marcarTodosAsistencia(true)}
                    >
                      ✓ Marcar todos
                    </button>
                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => marcarTodosAsistencia(false)}
                    >
                      Desmarcar todos
                    </button>
                  </div>

                  <div className="tabla-cocina">
                    <table>
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Documento</th>
                          <th>Grado</th>
                          <th>Asistió</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistenciaReservas.map((r) => (
                          <tr key={r.id} className={r.asistio ? "fila-asistio" : undefined}>
                            <td>{r.estudiante}</td>
                            <td>{r.documento}</td>
                            <td>{r.grado ? `Grado ${r.grado}` : "—"}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={r.asistio}
                                onChange={() => marcarAsistencia(r)}
                                aria-label={`Marcar asistencia de ${r.estudiante}`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {!cargando && !error && pestanaActiva === "incidentes" && (
        <div id="panel-incidentes" role="tabpanel" aria-labelledby="tab-incidentes">
          <h2 className="admin-subtitulo">
            {rol === "profesor"
              ? "Reportar incidente o alergia"
              : "Incidentes y alergias de estudiantes"}
          </h2>

          {rol === "profesor" ? (
            <>
              <p className="subtitulo">
                Reporta un incidente o una alergia de un estudiante de tu
                grupo (puedes adjuntar una foto). El reporte queda visible
                para el coordinador, que puede marcarlo como resuelto.
              </p>

              <form className="formulario" onSubmit={reportarIncidente}>
                <div className="formulario-fila formulario-fila-grid">
                  <label>
                    Fecha
                    <input
                      type="date"
                      value={incidenteFecha}
                      onChange={(e) => setIncidenteFecha(e.target.value)}
                    />
                  </label>
                  <label>
                    Tipo
                    <select
                      value={incidenteTipo}
                      onChange={(e) => setIncidenteTipo(e.target.value)}
                    >
                      <option>Incidente</option>
                      <option>Alergia</option>
                    </select>
                  </label>
                </div>
                <label>
                  Estudiante
                  <select
                    value={incidenteDoc}
                    onChange={(e) => setIncidenteDoc(e.target.value)}
                    required
                  >
                    <option value="">Elige un estudiante de tu grupo</option>
                    {incidenteEstudiantes.map((est) => (
                      <option key={est.documento} value={est.documento}>
                        {est.nombre} {est.grado ? `· Grado ${est.grado}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Descripción
                  <textarea
                    value={incidenteDescripcion}
                    onChange={(e) => setIncidenteDescripcion(e.target.value)}
                    rows={3}
                    required
                    placeholder="Cuenta qué ocurrió…"
                  />
                </label>
                <label>
                  Foto adjunta
                  <input
                    type="file"
                    accept="image/*"
                    disabled={incidenteSubiendoFoto}
                    onChange={(e) => {
                      const archivo = e.target.files?.[0];
                      if (archivo) {
                        adjuntarFotoIncidente(archivo, setIncidenteImagen, setIncidenteSubiendoFoto);
                      }
                    }}
                  />
                </label>
                {incidenteImagen ? (
                  <div className="incidente-foto">
                    <img src={incidenteImagen} alt="Foto del reporte" />
                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => setIncidenteImagen("")}
                    >
                      Quitar foto
                    </button>
                  </div>
                ) : null}
                <button
                  type="submit"
                  className="boton boton-primario"
                  disabled={incidenteEnviando || incidenteSubiendoFoto}
                >
                  {incidenteEnviando
                    ? "Reportando…"
                    : incidenteSubiendoFoto
                      ? "Subiendo foto…"
                      : "Reportar"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="subtitulo">
                Reportes que dejan los profesores sobre los estudiantes de
                su grupo. Filtra por estado, rango de fechas o estudiante y
                márcalos como resueltos cuando estén atendidos.
              </p>

              <div className="formulario-fila">
                {(["todos", "pendientes", "resueltos"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`boton ${
                      incidentesFiltro === f ? "boton-primario" : "boton-secundario"
                    }`}
                    onClick={() => setIncidentesFiltro(f)}
                  >
                    {f === "todos" ? "Todos" : f === "pendientes" ? "Pendientes" : "Resueltos"}
                  </button>
                ))}
              </div>

              <div className="formulario-fila formulario-fila-grid">
                <label>
                  Desde
                  <input
                    type="date"
                    value={incidentesDesde}
                    onChange={(e) => setIncidentesDesde(e.target.value)}
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="date"
                    value={incidentesHasta}
                    onChange={(e) => setIncidentesHasta(e.target.value)}
                  />
                </label>
                <label>
                  Buscar estudiante
                  <input
                    type="text"
                    value={incidentesBusqueda}
                    onChange={(e) => setIncidentesBusqueda(e.target.value)}
                    placeholder="Nombre o documento…"
                  />
                </label>
              </div>
            </>
          )}

          {incidenteCargando && <p className="estado">Cargando reportes…</p>}
          {incidenteError && (
            <p className="estado error" role="alert">⚠️ {incidenteError}</p>
          )}
          {incidenteExito && (
            <p className="estado exito" aria-live="polite">{incidenteExito}</p>
          )}

          {/* Formulario para corregir un reporte propio del profesor */}
          {rol === "profesor" && editandoIncidente && (
            <form className="formulario" onSubmit={guardarIncidenteEditado}>
              <h3 className="admin-subtitulo">
                Editar reporte · {editandoIncidente.estudiante}
              </h3>
              <div className="formulario-fila formulario-fila-grid">
                <label>
                  Fecha
                  <input
                    type="date"
                    value={editIncidenteFecha}
                    onChange={(e) => setEditIncidenteFecha(e.target.value)}
                  />
                </label>
                <label>
                  Tipo
                  <select
                    value={editIncidenteTipo}
                    onChange={(e) => setEditIncidenteTipo(e.target.value)}
                  >
                    <option>Incidente</option>
                    <option>Alergia</option>
                  </select>
                </label>
              </div>
              <label>
                Estudiante
                <select
                  value={editIncidenteDoc}
                  onChange={(e) => setEditIncidenteDoc(e.target.value)}
                  required
                >
                  <option value="">Elige un estudiante de tu grupo</option>
                  {incidenteEstudiantes.map((est) => (
                    <option key={est.documento} value={est.documento}>
                      {est.nombre} {est.grado ? `· Grado ${est.grado}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Descripción
                <textarea
                  value={editIncidenteDescripcion}
                  onChange={(e) => setEditIncidenteDescripcion(e.target.value)}
                  rows={3}
                  required
                />
              </label>
              <label>
                Foto adjunta
                <input
                  type="file"
                  accept="image/*"
                  disabled={editIncidenteSubiendoFoto}
                  onChange={(e) => {
                    const archivo = e.target.files?.[0];
                    if (archivo) {
                      adjuntarFotoIncidente(
                        archivo,
                        setEditIncidenteImagen,
                        setEditIncidenteSubiendoFoto
                      );
                    }
                  }}
                />
              </label>
              {editIncidenteImagen ? (
                <div className="incidente-foto">
                  <img src={editIncidenteImagen} alt="Foto del reporte" />
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => setEditIncidenteImagen("")}
                  >
                    Quitar foto
                  </button>
                </div>
              ) : null}
              <div className="formulario-fila">
                <button
                  type="submit"
                  className="boton boton-primario"
                  disabled={editIncidenteEnviando || editIncidenteSubiendoFoto}
                >
                  {editIncidenteEnviando ? "Guardando…" : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => setEditandoIncidente(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!incidenteCargando && !incidenteError && incidentesVisibles.length === 0 ? (
            <p className="estado">
              {rol === "profesor"
                ? "Todavía no has reportado nada."
                : "No hay reportes con esos filtros."}
            </p>
          ) : (
            <div className="tabla-cocina">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Estudiante</th>
                    {rol !== "profesor" && <th>Sede</th>}
                    <th>Descripción</th>
                    <th>Foto</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentesVisibles.map((inc) => (
                    <tr key={inc.id} className={inc.resuelto ? "fila-resuelto" : undefined}>
                      <td>{fechaCortaDia(inc.fecha)}</td>
                      <td>
                        <span className={`chip chip-${inc.tipo.toLowerCase()}`}>
                          {inc.tipo}
                        </span>
                      </td>
                      <td>
                        {inc.estudiante}
                        {inc.grado ? ` · Grado ${inc.grado}` : ""}
                      </td>
                      {rol !== "profesor" && <td>{inc.sede}</td>}
                      <td>{inc.descripcion}</td>
                      <td>
                        {inc.imagen ? (
                          <a href={inc.imagen} target="_blank" rel="noreferrer">
                            <img
                              className="incidente-foto-mini"
                              src={inc.imagen}
                              alt={`Foto de ${inc.estudiante}`}
                            />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span
                          className={`incidente-estado ${
                            inc.resuelto ? "resuelto" : "pendiente"
                          }`}
                        >
                          {inc.resuelto ? "Resuelto" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <div className="formulario-fila">
                          {rol === "profesor" ? (
                            <>
                              <button
                                type="button"
                                className="boton boton-secundario"
                                onClick={() => abrirEdicionIncidente(inc)}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                type="button"
                                className="boton boton-peligro"
                                onClick={() => borrarIncidente(inc)}
                              >
                                🗑️ Borrar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="boton boton-secundario"
                                onClick={() => resolverIncidente(inc.id, !inc.resuelto)}
                                disabled={incidenteResolviendo === inc.id}
                              >
                                {incidenteResolviendo === inc.id
                                  ? "Guardando…"
                                  : inc.resuelto
                                    ? "Reabrir"
                                    : "Marcar resuelto"}
                              </button>
                              <button
                                type="button"
                                className="boton boton-peligro"
                                onClick={() => borrarIncidente(inc)}
                              >
                                🗑️ Borrar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!cargando && !error && pestanaActiva === "menu" && (
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

      {!cargando && !error && pestanaActiva === "avisos" && (
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

      {!cargando && !error && pestanaActiva === "galeria" && (
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

      {!cargando && !error && pestanaActiva === "instituciones" && (
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

      {!cargando && !error && pestanaActiva === "sedes" && (
        <div id="panel-sedes" role="tabpanel" aria-labelledby="tab-sedes">
          <h2 className="admin-subtitulo">Registrar sede</h2>
          <p className="subtitulo">
            Las sedes son los puntos donde se atiende a los estudiantes.
            Aparecen en la reserva, en el registro de beneficiarios y en el
            registro por sede de la página de inicio.
          </p>
          <form className="formulario" onSubmit={registrarSede}>
            <label htmlFor="nombre-sede">
              Nombre de la sede
              <input
                id="nombre-sede"
                type="text"
                value={nombreSede}
                onChange={(e) => setNombreSede(e.target.value)}
                required
                placeholder="Ej: Sede D"
                autoComplete="off"
              />
            </label>
            {sedeError && <p className="estado error" role="alert">⚠️ {sedeError}</p>}
            {sedeExito && <p className="estado exito" aria-live="polite">{sedeExito}</p>}
            <button type="submit" className="boton boton-primario">
              Registrar sede
            </button>
          </form>

          <h2 className="admin-subtitulo">
            Sedes registradas ({sedes.length})
          </h2>
          {sedes.length === 0 && (
            <p className="estado">Aún no hay sedes registradas.</p>
          )}
          <div className="lista-reservas">
            {sedes.map((s) => (
              <article key={s.id} className="fila-reserva">
                {editandoSede === s.id ? (
                  <form className="formulario" onSubmit={guardarEdicionSede}>
                    <label htmlFor={`editar-sede-${s.id}`}>
                      Nuevo nombre
                      <input
                        id={`editar-sede-${s.id}`}
                        type="text"
                        value={editNombreSede}
                        onChange={(e) => setEditNombreSede(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </label>
                    <div className="formulario-fila">
                      <button type="submit" className="boton boton-primario">
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="boton boton-secundario"
                        onClick={() => setEditandoSede(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <strong>{s.nombre}</strong>
                    </div>
                    <div className="formulario-fila">
                      <button
                        type="button"
                        className="boton boton-secundario"
                        onClick={() => iniciarEdicionSede(s)}
                        aria-label={`Renombrar sede ${s.nombre}`}
                      >
                        Renombrar
                      </button>
                      <button
                        type="button"
                        className="boton boton-secundario"
                        onClick={() => borrarSede(s.id)}
                        aria-label={`Borrar sede ${s.nombre}`}
                      >
                        Borrar
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestanaActiva === "notificaciones" && (
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

      {!cargando && !error && pestanaActiva === "mensajes" && (
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
              <article
                key={mensaje.id}
                className={`fila-mensaje${mensaje.leido ? "" : " no-leido"}`}
              >
                <div>
                  <strong>{mensaje.nombre}</strong>
                  {!mensaje.leido && <span className="badge-sin-leer">Nuevo</span>}
                  <span className="fila-reserva-detalle">
                    {mensaje.correo}
                    {mensaje.documento ? ` · Estudiante Doc. ${mensaje.documento}` : ""}
                  </span>
                  <p>{mensaje.mensaje}</p>
                  {mensaje.imagen && (
                    <a
                      href={mensaje.imagen}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mensaje-imagen"
                    >
                      <img src={mensaje.imagen} alt="Foto adjunta del mensaje" />
                    </a>
                  )}
                </div>
                <div className="formulario-fila">
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => alternarLeido(mensaje)}
                    aria-label={`${mensaje.leido ? "Marcar como no leído" : "Marcar como leído"} el mensaje de ${mensaje.nombre}`}
                  >
                    {mensaje.leido ? "Marcar no leído" : "✓ Marcar leído"}
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => abrirHilo(mensaje.id)}
                    aria-expanded={hiloAbierto[mensaje.id] || false}
                  >
                    {hiloAbierto[mensaje.id] ? "Ocultar conversación" : "Ver conversación"}
                  </button>
                  <button
                    type="button"
                    className="boton boton-peligro"
                    onClick={() => borrarConversacion(mensaje.id)}
                    disabled={borrandoHilo[mensaje.id] || false}
                  >
                    {borrandoHilo[mensaje.id] ? "Borrando…" : "🗑 Borrar"}
                  </button>
                </div>

                {hiloAbierto[mensaje.id] && (
                  <>
                    <div className="chat-burbujas">
                      {hiloCargando[mensaje.id] && !hilos[mensaje.id] && (
                        <p className="estado">Cargando conversación…</p>
                      )}
                      {(hilos[mensaje.id] || []).map((msj) => (
                        <div
                          key={msj.id}
                          className={`chat-burbuja ${msj.remitente === "estudiante" ? "estudiante" : "admin"}`}
                        >
                          <p>{msj.texto}</p>
                          {msj.imagen && (
                            <a
                              href={msj.imagen}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img src={msj.imagen} alt="Foto adjunta" />
                            </a>
                          )}
                          {msj.created_at && <small>{fechaCorta(msj.created_at)}</small>}
                        </div>
                      ))}
                      {hilos[mensaje.id] && hilos[mensaje.id].length === 1 && (
                        <p className="estado">
                          Aún no has respondido a este mensaje.
                        </p>
                      )}
                    </div>

                    <div className="chat-responder">
                      <input
                        value={borradoresChat[mensaje.id] || ""}
                        onChange={(e) =>
                          setBorradoresChat((b) => ({ ...b, [mensaje.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            enviarMensajeAdmin(mensaje.id);
                          }
                        }}
                        placeholder="Escribe tu respuesta y presiona Enter…"
                        aria-label={`Responder al mensaje de ${mensaje.nombre}`}
                      />
                      <label className="chat-foto" title="Adjuntar foto">
                        📎
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) =>
                            setFotosChat((f) => ({
                              ...f,
                              [mensaje.id]: e.target.files?.[0] || null,
                            }))
                          }
                          aria-label="Adjuntar foto a la respuesta"
                        />
                      </label>
                      <button
                        type="button"
                        className="boton boton-primario"
                        onClick={() => enviarMensajeAdmin(mensaje.id)}
                        disabled={
                          (!(borradoresChat[mensaje.id] || "").trim() && !fotosChat[mensaje.id]) ||
                          hiloEnviando[mensaje.id]
                        }
                      >
                        {hiloEnviando[mensaje.id] ? "Enviando…" : "Enviar"}
                      </button>
                    </div>
                    {fotosChat[mensaje.id] && (
                      <div className="chat-vista-previa">
                        <img
                          src={URL.createObjectURL(fotosChat[mensaje.id]!)}
                          alt="Vista previa de la foto"
                        />
                        <span>{fotosChat[mensaje.id]!.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFotosChat((f) => ({ ...f, [mensaje.id]: null }))
                          }
                          aria-label="Quitar la foto adjunta"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </>
                )}

                <span className="mensaje-fecha">
                  {mensaje.created_at ? mensaje.created_at.slice(0, 10) : ""}
                </span>
              </article>
            ))}
          </div>
        </div>
      )}

      {!cargando && !error && pestanaActiva === "usuarios" && (
        <div id="panel-usuarios" role="tabpanel" aria-labelledby="tab-usuarios">
          <h2 className="admin-subtitulo">Crear cuenta de usuario</h2>
          <p className="subtitulo">
            Cada cuenta da acceso al panel con el rol que elijas. Para los
            estudiantes la cuenta se crea automáticamente al registrarlos con
            PIN en la pestaña Beneficiarios.
          </p>
          <form className="formulario" onSubmit={registrarUsuario}>
            <label htmlFor="nombre-usu">
              Nombre completo
              <input
                id="nombre-usu"
                type="text"
                value={nombreUsu}
                onChange={(e) => setNombreUsu(e.target.value)}
                required
                placeholder="Nombre del usuario"
                autoComplete="off"
              />
            </label>
            <div className="formulario-fila">
              <label htmlFor="usuario-usu">
                Usuario
                <input
                  id="usuario-usu"
                  type="text"
                  value={usuarioUsu}
                  onChange={(e) => setUsuarioUsu(e.target.value)}
                  required
                  placeholder="Con qué nombre entrará"
                  autoComplete="off"
                />
              </label>
              <label htmlFor="rol-usu">
                Rol
                <select id="rol-usu" value={rolUsu} onChange={(e) => setRolUsu(e.target.value)}>
                  <option value="cocina">Cocina</option>
                  <option value="profesor">Profesor</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
            </div>
            {rolUsu === "profesor" && (
              <div className="formulario-fila formulario-fila-grid">
                <label htmlFor="sede-usu">
                  Sede
                  <select
                    id="sede-usu"
                    value={sedeUsu}
                    onChange={(e) => setSedeUsu(e.target.value)}
                    required
                  >
                    <option value="">Elige una sede</option>
                    {sedes.map((s) => (
                      <option key={s.id} value={s.nombre}>{s.nombre}</option>
                    ))}
                  </select>
                </label>
                <label htmlFor="turno-usu">
                  Turno
                  <select
                    id="turno-usu"
                    value={turnoUsu}
                    onChange={(e) => setTurnoUsu(e.target.value)}
                  >
                    <option>Almuerzo</option>
                    <option>Refrigerio</option>
                  </select>
                </label>
                <label htmlFor="grado-usu">
                  Grado
                  <select
                    id="grado-usu"
                    value={gradoUsu}
                    onChange={(e) => setGradoUsu(e.target.value)}
                    required
                  >
                    <option value="">Elige un grado</option>
                    {GRADOS.map((grado) => (
                      <option key={grado} value={grado}>{grado}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <label htmlFor="clave-usu">
              Clave
              <input
                id="clave-usu"
                type="text"
                value={claveUsu}
                onChange={(e) => setClaveUsu(e.target.value)}
                required
                minLength={4}
                placeholder="Mínimo 4 caracteres"
                autoComplete="new-password"
              />
            </label>
            {usuError && <p className="estado error" role="alert">⚠️ {usuError}</p>}
            {usuExito && <p className="estado exito" aria-live="polite">{usuExito}</p>}
            <button type="submit" className="boton boton-primario">
              Crear usuario
            </button>
          </form>

          <h2 className="admin-subtitulo">
            Cuentas creadas ({usuarios.length})
          </h2>
          {usuarios.length === 0 && (
            <p className="estado">Aún no hay cuentas creadas. Crea la primera arriba.</p>
          )}
          <Buscador
            valor={busquedaUsuarios}
            alCambiar={setBusquedaUsuarios}
            placeholder="Buscar por nombre, usuario o rol…"
          />
          <div className="lista-reservas">
            {usuarios
              .filter((u) => {
                if (!busquedaUsuarios.trim()) return true;
                const texto = `${u.nombre} ${u.usuario} ${u.rol}`;
                return coincide(texto, busquedaUsuarios);
              })
              .map((u) => (
              <article key={u.id} className="fila-reserva">
                <div>
                  <strong>{u.nombre}</strong>
                  <span className="fila-reserva-detalle">
                    {u.usuario} · {u.rol} · {u.activo ? "activo" : "desactivado"}
                    {u.clave ? ` · clave: ${u.clave}` : " · clave: no visible"}
                  </span>
                </div>
                <div className="formulario-fila">
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() =>
                      editandoUsuario === u.id
                        ? setEditandoUsuario(null)
                        : iniciarEdicionUsuario(u)
                    }
                    aria-label={`Editar cuenta de ${u.nombre}`}
                  >
                    {editandoUsuario === u.id ? "Cancelar" : "Editar"}
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => alternarUsuario(u)}
                    aria-label={`${u.activo ? "Desactivar" : "Activar"} cuenta de ${u.nombre}`}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => borrarUsuario(u)}
                    aria-label={`Borrar cuenta de ${u.nombre}`}
                  >
                    Borrar
                  </button>
                </div>

                {editandoUsuario === u.id && (
                  <form className="formulario" onSubmit={guardarEdicionUsuario}>
                    <label>
                      Nombre completo
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </label>
                    <div className="formulario-fila">
                      <label>
                        Usuario
                        <input
                          type="text"
                          value={editUsuario}
                          onChange={(e) => setEditUsuario(e.target.value)}
                          required
                          autoComplete="off"
                        />
                      </label>
                      <label>
                        Rol
                        <select
                          value={editRol}
                          onChange={(e) => setEditRol(e.target.value)}
                        >
                          <option value="cocina">Cocina</option>
                          <option value="profesor">Profesor</option>
                          <option value="coordinador">Coordinador</option>
                          <option value="estudiante">Estudiante</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </label>
                    </div>
                    {editRol === "profesor" && (
                      <div className="formulario-fila formulario-fila-grid">
                        <label>
                          Sede
                          <select value={editSede} onChange={(e) => setEditSede(e.target.value)} required>
                            <option value="">Elige una sede</option>
                            {sedes.map((s) => (
                              <option key={s.id} value={s.nombre}>{s.nombre}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Turno
                          <select value={editTurno} onChange={(e) => setEditTurno(e.target.value)}>
                            <option>Almuerzo</option>
                            <option>Refrigerio</option>
                          </select>
                        </label>
                        <label>
                          Grado
                          <select value={editGrado} onChange={(e) => setEditGrado(e.target.value)} required>
                            <option value="">Elige un grado</option>
                            {GRADOS.map((grado) => (
                              <option key={grado} value={grado}>{grado}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                    <label>
                      Clave / PIN (déjala vacía para no cambiarla)
                      <input
                        type="text"
                        value={editClave}
                        onChange={(e) => setEditClave(e.target.value)}
                        minLength={4}
                        placeholder={u.clave ? `Actual: ${u.clave}` : "Sin clave guardada"}
                        autoComplete="off"
                      />
                    </label>
                    <button type="submit" className="boton boton-primario">
                      Guardar cambios
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Admin;
