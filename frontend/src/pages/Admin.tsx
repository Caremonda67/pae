// panel de administrador
// ahora el login es REAL: el usuario manda su usuario + clave al
// backend (/api/login), este los compara y devuelve un token con
// el rol. El panel guarda la sesion compartida y muestra solo las
// pestañas que le corresponden al rol que entro.
//
// Pestañas por rol:
// - admin: todas (cocina, beneficiarios, menu, avisos, galeria,
//   instituciones, colaboradores, notificaciones, mensajes, usuarios)
// - cocina: panel de cocina y menú
// - profesor: beneficiarios, avisos
// - coordinador: avisos, galeria, instituciones, colaboradores,
//   notificaciones, mensajes
// - estudiante: no tiene panel (entra por Reserva)

import { useEffect, useState } from "react";
import Buscador from "../components/Buscador";
import FiltroReportes from "../components/FiltroReportes";
import { coincide } from "../config/busqueda";
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
  | "mensajes"
  | "reportes"
  | "usuarios";

// Fecha de hoy en formato YYYY-MM-DD (hora local del navegador)
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
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [menu, setMenu] = useState<MenuSemanaAdmin[]>([]);
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // panel compacto de cocina
  const [fechaPanel, setFechaPanel] = useState(() => hoyLocal());
  const [panelDia, setPanelDia] = useState<PanelCocina | null>(null);
  const [menuDia, setMenuDia] = useState<MenuItem[]>([]);
  const [panelCargando, setPanelCargando] = useState(false);

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
  const [usuError, setUsuError] = useState("");
  const [usuExito, setUsuExito] = useState("");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");

  // edicion de una cuenta existente (abre un formulario en la fila)
  const [editandoUsuario, setEditandoUsuario] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUsuario, setEditUsuario] = useState("");
  const [editRol, setEditRol] = useState("cocina");
  const [editClave, setEditClave] = useState("");

  // respuestas que se estan escribiendo en la pestana Mensajes
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});

  // formulario de institucion
  const [nombreInst, setNombreInst] = useState("");
  const [instError, setInstError] = useState("");
  const [instExito, setInstExito] = useState("");

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
  const [busquedaColaboradores, setBusquedaColaboradores] = useState("");
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
        respColaboradores,
      ] = await Promise.all([
        fetch(`${API_URL}/api/avisos`),
        fetch(`${API_URL}/api/contacto`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/beneficiarios`),
        fetch(`${API_URL}/api/notificaciones`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/menus`),
        fetch(`${API_URL}/api/galeria`),
        fetch(`${API_URL}/api/instituciones`),
        fetch(`${API_URL}/api/colaboradores`),
      ]);

      const respuestas: [string, Response][] = [
        ["avisos", respAvisos],
        ["mensajes", respMensajes],
        ["beneficiarios", respBeneficiarios],
        ["notificaciones", respNotificaciones],
        ["menu", respMenu],
        ["galeria", respGaleria],
        ["instituciones", respInstituciones],
        ["colaboradores", respColaboradores],
      ];

      // Solo son obligatorios los datos que el rol puede ver. Los
      // demas endpoints pueden devolver 403 (por ejemplo el rol cocina
      // no puede leer mensajes ni notificaciones) y eso no es un error.
      const datosPorRol: Record<string, string[]> = {
        admin: ["avisos", "mensajes", "beneficiarios", "notificaciones", "menu", "galeria", "instituciones", "colaboradores"],
        cocina: ["avisos", "beneficiarios", "menu"],
        profesor: ["avisos", "beneficiarios"],
        coordinador: ["avisos", "mensajes", "beneficiarios", "notificaciones", "menu", "galeria", "instituciones", "colaboradores"],
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

      setGaleria(await respGaleria.json());
      setInstituciones(await respInstituciones.json());
      setColaboradores(await respColaboradores.json());

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

  // Carga el panel cada vez que cambia la fecha o al entrar
  useEffect(() => {
    if (autenticado) cargarPanel(fechaPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaPanel]);

  // Carga los reportes tecnicos (totales y desperdicio). Se recargan
  // cuando cambia el filtro de fechas (semana, mes o rango personalizado).
  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const parametros = new URLSearchParams();
        if (desde) parametros.set("desde", desde);
        if (hasta) parametros.set("hasta", hasta);
        const consulta = parametros.toString();

        const [respTotales, respReporte] = await Promise.all([
          fetch(`${API_URL}/api/reservas/totales?${consulta}`),
          fetch(`${API_URL}/api/reservas/reporte?${consulta}`),
        ]);
        if (!respTotales.ok || !respReporte.ok) throw new Error("No se pudieron cargar los reportes");
        setTotales(await respTotales.json());
        setReporte(await respReporte.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    };
    if (autenticado) cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, desde, hasta]);

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
        }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error || "No se pudo crear el usuario");
      }
      setNombreUsu("");
      setUsuarioUsu("");
      setClaveUsu("");
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

  // Envia la respuesta del admin a un mensaje de contacto. Si el
  // mensaje era de un estudiante registrado, la ve al entrar.
  const responderMensaje = async (id: number) => {
    const texto = (respuestas[id] || "").trim();
    if (!texto) return;
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto/${id}/respuesta`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ respuesta: texto }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error || "No se pudo enviar la respuesta");
      setRespuestas((r) => ({ ...r, [id]: "" }));
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Abre el formulario de edicion de una cuenta con sus datos actuales
  const iniciarEdicionUsuario = (u: Usuario) => {
    setEditandoUsuario(u.id);
    setEditNombre(u.nombre);
    setEditUsuario(u.usuario);
    setEditRol(u.rol);
    setEditClave(u.clave || "");
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
      { id: "colaboradores", etiqueta: "👥 Colaboradores" },
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
      { id: "beneficiarios", etiqueta: "🎓 Beneficiarios" },
      { id: "avisos", etiqueta: "📢 Avisos" },
    ],
    coordinador: [
      { id: "avisos", etiqueta: "📢 Avisos" },
      { id: "galeria", etiqueta: "🖼️ Galería" },
      { id: "instituciones", etiqueta: "🏫 Instituciones" },
      { id: "colaboradores", etiqueta: "👥 Colaboradores" },
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

      {!cargando && !error && pestanaActiva === "colaboradores" && (
        <div id="panel-colaboradores" role="tabpanel" aria-labelledby="tab-colaboradores">
          <h2 className="admin-subtitulo">
            Colaboradores registrados ({colaboradores.length})
          </h2>
          <p className="subtitulo">
            Cada colaborador cuenta en la métrica de la página de inicio.
          </p>
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
                  {mensaje.respuesta && (
                    <div className="mensaje-respuesta">
                      <strong>Tu respuesta:</strong>
                      <p>{mensaje.respuesta}</p>
                    </div>
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
                </div>
                <textarea
                  className="respuesta-texto"
                  value={respuestas[mensaje.id] || ""}
                  onChange={(e) =>
                    setRespuestas((r) => ({ ...r, [mensaje.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Escribe tu respuesta para este mensaje…"
                />
                <div className="formulario-fila">
                  <button
                    type="button"
                    className="boton boton-primario"
                    onClick={() => responderMensaje(mensaje.id)}
                    disabled={!(respuestas[mensaje.id] || "").trim()}
                  >
                    Enviar respuesta
                  </button>
                </div>
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
