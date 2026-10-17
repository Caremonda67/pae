import { useEffect, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { fechaCorta } from "../config/fechas";
import { descargarExcel } from "../config/exportar";
import {
  leerSesion,
  guardarSesion,
  cerrarSesion,
  cabeceras,
} from "../config/sesion";

import type {
  Aviso, Beneficiario, Configuracion, FotoGaleria, Incidente,
  Institucion, Mensaje, MensajeChat, MenuItem, Notificacion,
  PanelCocina, Pestana, Reporte, ReservaAsistencia, ReservaDiaria,
  Sobrante, Sede, TableroDia, TurnoCocina, Usuario, UsuarioCocina,
  AuditoriaEntrada, MenuSemanaAdmin, Tendencia,
} from "./admin/types";
import type { SeccionTabla, OpcionesExportar } from "../config/exportar";

import TabPanelCocina from "./admin/TabPanelCocina";
import TabTablero from "./admin/TabTablero";
import TabBeneficiarios from "./admin/TabBeneficiarios";
import TabAsistencia from "./admin/TabAsistencia";
import TabIncidentes from "./admin/TabIncidentes";
import TabMenu from "./admin/TabMenu";
import TabAvisos from "./admin/TabAvisos";
import TabGaleria from "./admin/TabGaleria";
import TabInstituciones from "./admin/TabInstituciones";
import TabSedes from "./admin/TabSedes";
import TabTurnos from "./admin/TabTurnos";
import TabNotificaciones from "./admin/TabNotificaciones";
import TabMensajes from "./admin/TabMensajes";
import TabReportes from "./admin/TabReportes";
import TabUsuarios from "./admin/TabUsuarios";
import TabConfig from "./admin/TabConfig";
import TabAuditoria from "./admin/TabAuditoria";

import { TURNOS_SOBRANTES } from "./admin/types";

function hoyLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

function fechaCortaDia(fecha: string) {
  const [año, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${año}`;
}

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

  const [config, setConfig] = useState<Configuracion>({
    hora_limite_reserva: null,
    cupos_sede: {},
  });
  const [horaLimite, setHoraLimite] = useState("");
  const [cupos, setCupos] = useState<Record<string, string>>({});
  const [configMensaje, setConfigMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const [turnos, setTurnos] = useState<TurnoCocina[]>([]);
  const [listaCocina, setListaCocina] = useState<UsuarioCocina[]>([]);
  const [fechaTurno, setFechaTurno] = useState(() => hoyLocal());
  const [usuarioTurno, setUsuarioTurno] = useState("");
  const [sedeTurno, setSedeTurno] = useState("");
  const [turnosMensaje, setTurnosMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const [auditoria, setAuditoria] = useState<AuditoriaEntrada[]>([]);

  const [fechaPanel, setFechaPanel] = useState(() => hoyLocal());
  const [panelDia, setPanelDia] = useState<PanelCocina | null>(null);
  const [menuDia, setMenuDia] = useState<MenuItem[]>([]);
  const [panelCargando, setPanelCargando] = useState(false);

  const [fechaTablero, setFechaTablero] = useState(() => hoyLocal());
  const [tablero, setTablero] = useState<TableroDia | null>(null);
  const [tableroCargando, setTableroCargando] = useState(false);

  const [sobrantesCargando, setSobrantesCargando] = useState(false);
  const [sobrantesGuardando, setSobrantesGuardando] = useState(false);
  const [sobrantesBorrador, setSobrantesBorrador] = useState<
    Record<string, { porciones: string; peso_kg: string }>
  >({});
  const [sobranteError, setSobranteError] = useState("");
  const [sobranteExito, setSobranteExito] = useState("");

  const [sobrantesReporte, setSobrantesReporte] = useState<Sobrante[]>([]);
  const [editandoSobrantes, setEditandoSobrantes] = useState<{
    fecha: string;
    sede: string;
    jornadas: Record<string, { porciones: string; peso_kg: string }>;
  } | null>(null);
  const [sobrantesReporteMensaje, setSobrantesReporteMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  const [totales, setTotales] = useState<Record<string, { reservas: number; asistieron: number }>>({});
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [diaria, setDiaria] = useState<ReservaDiaria[]>([]);
  const [fechaDiaria, setFechaDiaria] = useState(() => hoyLocal());
  const [diariaCargada, setDiariaCargada] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  // Tendencia: pronostico de demanda vs sobrantes reales (grafico)
  const [tendencia, setTendencia] = useState<Tendencia | null>(null);
  const [tendenciaCargando, setTendenciaCargando] = useState(false);

  const [nombreUsu, setNombreUsu] = useState("");
  const [usuarioUsu, setUsuarioUsu] = useState("");
  const [rolUsu, setRolUsu] = useState("cocina");
  const [claveUsu, setClaveUsu] = useState("");
  const [sedeUsu, setSedeUsu] = useState("");
  const [turnoUsu, setTurnoUsu] = useState("Almuerzo");
  const [gradoUsu, setGradoUsu] = useState("");
  const [usuError, setUsuError] = useState("");
  const [usuExito, setUsuExito] = useState("");

  const [editandoUsuario, setEditandoUsuario] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUsuario, setEditUsuario] = useState("");
  const [editRol, setEditRol] = useState("cocina");
  const [editClave, setEditClave] = useState("");
  const [editSede, setEditSede] = useState("");
  const [editTurno, setEditTurno] = useState("Almuerzo");
  const [editGrado, setEditGrado] = useState("");

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

  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [incidentesFiltro, setIncidentesFiltro] = useState<"todos" | "pendientes" | "resueltos">("todos");
  const [incidenteCargando, setIncidenteCargando] = useState(false);
  const [incidenteError, setIncidenteError] = useState("");
  const [incidenteExito, setIncidenteExito] = useState("");
  const [incidenteEstudiantes, setIncidenteEstudiantes] = useState<
    { documento: string; nombre: string; grado?: string }[]
  >([]);
  const [incidenteDoc, setIncidenteDoc] = useState("");
  const [incidenteTipo, setIncidenteTipo] = useState("Incidente");
  const [incidenteDescripcion, setIncidenteDescripcion] = useState("");
  const [incidenteFecha, setIncidenteFecha] = useState(() => hoyLocal());
  const [incidenteImagen, setIncidenteImagen] = useState("");
  const [incidenteEnviando, setIncidenteEnviando] = useState(false);
  const [incidenteResolviendo, setIncidenteResolviendo] = useState<number | null>(null);
  const [editandoIncidente, setEditandoIncidente] = useState<Incidente | null>(null);
  const [editIncidenteTipo, setEditIncidenteTipo] = useState("Incidente");
  const [editIncidenteDoc, setEditIncidenteDoc] = useState("");
  const [editIncidenteDescripcion, setEditIncidenteDescripcion] = useState("");
  const [editIncidenteFecha, setEditIncidenteFecha] = useState(() => hoyLocal());
  const [editIncidenteImagen, setEditIncidenteImagen] = useState("");
  const [editIncidenteEnviando, setEditIncidenteEnviando] = useState(false);
  const [incidentesDesde, setIncidentesDesde] = useState("");
  const [incidentesHasta, setIncidentesHasta] = useState("");
  const [incidentesBusqueda, setIncidentesBusqueda] = useState("");

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

  const [nombreInst, setNombreInst] = useState("");
  const [instError, setInstError] = useState("");
  const [instExito, setInstExito] = useState("");

  const [nombreSede, setNombreSede] = useState("");
  const [editandoSede, setEditandoSede] = useState<number | null>(null);
  const [editNombreSede, setEditNombreSede] = useState("");
  const [sedeError, setSedeError] = useState("");
  const [sedeExito, setSedeExito] = useState("");

  const [tituloGaleria, setTituloGaleria] = useState("");
  const [descripcionGaleria, setDescripcionGaleria] = useState("");
  const [imagenGaleria, setImagenGaleria] = useState("");
  const [galeriaError, setGaleriaError] = useState("");
  const [galeriaExito, setGaleriaExito] = useState("");

  const [tituloAviso, setTituloAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");
  const [fechaAviso, setFechaAviso] = useState("");
  const [imagenAviso, setImagenAviso] = useState("");
  const [publicarAvisoAhora, setPublicarAvisoAhora] = useState(true);
  const [avisoError, setAvisoError] = useState("");
  const [avisoExito, setAvisoExito] = useState("");

  const [semanaMenu, setSemanaMenu] = useState(1);
  const [diaMenu, setDiaMenu] = useState("Lunes");
  const [jornadaMenu, setJornadaMenu] = useState("Almuerzo");
  const [varianteMenu, setVarianteMenu] = useState("Estandar");
  const [platilloMenu, setPlatilloMenu] = useState("");
  const [descripcionMenu, setDescripcionMenu] = useState("");
  const [caloriasMenu, setCaloriasMenu] = useState("");
  const [imagenMenu, setImagenMenu] = useState("");
  const [publicarMenuAhora, setPublicarMenuAhora] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [menuExito, setMenuExito] = useState("");

  const [docBen, setDocBen] = useState("");
  const [nombreBen, setNombreBen] = useState("");
  const [sedeBen, setSedeBen] = useState("");
  const [turnoBen, setTurnoBen] = useState("Almuerzo");
  const [gradoBen, setGradoBen] = useState("");
  const [pinBen, setPinBen] = useState("");
  const [alergiasBen, setAlergiasBen] = useState("");
  const [prefBen, setPrefBen] = useState("");
  const [benError, setBenError] = useState("");
  const [benExito, setBenExito] = useState("");

  const [pins, setPins] = useState<Record<number, string>>({});

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
        fetch(`${API_URL}/api/avisos/todos`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/contacto`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/beneficiarios`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/notificaciones`, { headers: cabeceras(false) }),
        fetch(`${API_URL}/api/menus/todos`, { headers: cabeceras(false) }),
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
          salir();
          throw new Error("Tu sesión expiró. Vuelve a entrar con la clave.");
        }
        throw new Error(`No se pudieron cargar los datos (${nombre}: ${r.status})`);
      }

      setAvisos(respAvisos.ok ? await respAvisos.json() : []);
      setMensajes(respMensajes.ok ? await respMensajes.json() : []);
      setBeneficiarios(respBeneficiarios.ok ? await respBeneficiarios.json() : []);
      setNotificaciones(respNotificaciones.ok ? await respNotificaciones.json() : []);

      const menus = (await respMenu.json()) as MenuItem[];
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

      setGaleria(respGaleria.ok ? await respGaleria.json() : []);
      setInstituciones(respInstituciones.ok ? await respInstituciones.json() : []);
      setSedes(respSedes.ok ? await respSedes.json() : []);

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
        const respAuditoria = await fetch(`${API_URL}/api/auditoria?limite=150`, {
          headers: cabeceras(false),
        });
        if (respAuditoria.ok) setAuditoria(await respAuditoria.json());
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

  useEffect(() => {
    if (sedes.length === 0) return;
    if (!sedes.some((s) => s.nombre === sedeBen)) setSedeBen(sedes[0].nombre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedes]);

  const cargarPanel = async (fecha: string) => {
    setPanelCargando(true);
    try {
      const [respPanel, respMenu] = await Promise.all([
        fetch(`${API_URL}/api/reservas/panel?fecha=${fecha}`, {
          headers: cabeceras(false),
        }),
        fetch(`${API_URL}/api/menus/hoy?fecha=${fecha}`,
        ),
      ]);
      if (!respPanel.ok) throw new Error("No se pudo cargar el panel");
      setPanelDia(await respPanel.json());
      const menuDatos = (await respMenu.json()) as { platos?: MenuItem[] };
      setMenuDia(menuDatos.platos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setPanelCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarPanel(fechaPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaPanel]);

  const cargarTablero = async (fecha: string) => {
    setTableroCargando(true);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/reservas/tablero?fecha=${fecha}`,
        { headers: cabeceras(false) }
      );
      if (!respuesta.ok) throw new Error("No se pudo cargar el tablero del día");
      setTablero((await respuesta.json()) as TableroDia);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setTableroCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "coordinador")) {
      cargarTablero(fechaTablero);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaTablero]);

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

  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarSobrantes(fechaPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, fechaPanel]);

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
    if (autenticado && (rol === "admin" || rol === "cocina")) cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, desde, hasta]);

  const cargarTendencia = async () => {
    setTendenciaCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/reservas/tendencia`);
      if (!respuesta.ok) throw new Error("No se pudo cargar la tendencia");
      setTendencia(await respuesta.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setTendenciaCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado && (rol === "admin" || rol === "cocina") && pestana === "reportes") {
      cargarTendencia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  useEffect(() => {
    if (!autenticado || pestana !== "mensajes") return;
    refrescarMensajes();
    const intervalo = setInterval(refrescarMensajes, 7000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  useEffect(() => {
    if (!autenticado || pestana !== "asistencia") return;
    if (asistenciaGrupo === null) cargarAsistencia(asistenciaFecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

  useEffect(() => {
    if (!autenticado || pestana !== "incidentes") return;
    cargarIncidentes();
    if (rol === "profesor") cargarEstudiantesIncidente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, pestana]);

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

  const conteoDiario = () => {
    const conteo: Record<string, number> = {};
    for (const r of diaria) {
      conteo[r.turno] = (conteo[r.turno] || 0) + 1;
    }
    return conteo;
  };

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

  const reportarIncidente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidenteError("");
    setIncidenteExito("");
    if (!incidenteDoc) {
      setIncidenteError("Elige al estudiante de tu grupo.");
      return;
    }
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

  const abrirEdicionIncidente = (inc: Incidente) => {
    setEditandoIncidente(inc);
    setEditIncidenteTipo(inc.tipo);
    setEditIncidenteDoc(inc.documento || "");
    setEditIncidenteDescripcion(inc.descripcion);
    setEditIncidenteFecha(inc.fecha);
    setEditIncidenteImagen(inc.imagen || "");
  };

  const guardarIncidenteEditado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoIncidente) return;
    setIncidenteError("");
    setIncidenteExito("");
    if (!editIncidenteDoc) {
      setIncidenteError("Elige al estudiante de tu grupo.");
      return;
    }
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
        ? a.sede < b.sede ? -1 : 1
        : a.fecha < b.fecha ? 1 : -1
    );
  };

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

  const exportarCSV = () => {
    descargarExcel(construirSecciones(), "reporte-pae.xls", opcionesReporte());
  };

  const imprimirDiaria = () => {
    window.print();
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
          estado: publicarAvisoAhora ? "publicado" : "borrador",
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
      setAvisoExito(
        publicarAvisoAhora
          ? "✅ Aviso publicado. Ya aparece en la página y el bot lo conoce."
          : "✅ Aviso guardado como borrador. Se verá cuando alguien lo publique."
      );
      cargarDatos();
    } catch (err) {
      setAvisoError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const cambiarEstadoAviso = async (id: number, estado: string) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/avisos/${id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ estado }),
      });
      if (!respuesta.ok) throw new Error("No se pudo cambiar el estado del aviso");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

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
          variante: varianteMenu,
          platillo: platilloMenu,
          descripcion: descripcionMenu,
          calorias: caloriasMenu ? Number(caloriasMenu) : null,
          imagen: imagenMenu || null,
          estado: publicarMenuAhora ? "publicado" : "borrador",
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
      setMenuExito(
        publicarMenuAhora
          ? "✅ Plato agregado al menú y ya se ve en la web."
          : "✅ Plato guardado como borrador. Se verá cuando alguien lo publique."
      );
      cargarDatos();
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const cambiarEstadoPlato = async (id: number, estado: string) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/menus/${id}`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({ estado }),
      });
      if (!respuesta.ok) throw new Error("No se pudo cambiar el estado del plato");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

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

  const guardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMensaje(null);
    try {
      const cuposNumero: Record<string, number> = {};
      for (const [sede, valor] of Object.entries(cupos)) {
        const numero = valor.trim() === "" ? 0 : Number(valor);
        if (!Number.isInteger(numero) || numero < 0) {
          setConfigMensaje({
            tipo: "error",
            texto: `El cupo de "${sede}" debe ser un número entero (0 o más).`,
          });
          return;
        }
        cuposNumero[sede] = numero;
      }

      const respuesta = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: cabeceras(),
        body: JSON.stringify({
          hora_limite_reserva: horaLimite.trim() || null,
          cupos_sede: cuposNumero,
        }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo guardar la configuración");
      }
      setConfigMensaje({ tipo: "exito", texto: "✅ Configuración guardada." });
      cargarDatos();
    } catch (err) {
      setConfigMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  };

  const asignarTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setTurnosMensaje(null);
    if (!usuarioTurno || !sedeTurno) {
      setTurnosMensaje({ tipo: "error", texto: "Elige el personal de cocina y la sede." });
      return;
    }
    try {
      const respuesta = await fetch(`${API_URL}/api/turnos`, {
        method: "POST",
        headers: cabeceras(),
        body: JSON.stringify({ fecha: fechaTurno, usuario: usuarioTurno, sede: sedeTurno }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo asignar el turno");
      }
      setTurnosMensaje({ tipo: "exito", texto: "✅ Turno asignado." });
      cargarDatos();
    } catch (err) {
      setTurnosMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  };

  const quitarTurno = async (id: number) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/turnos/${id}`, {
        method: "DELETE",
        headers: cabeceras(false),
      });
      if (!respuesta.ok) throw new Error("No se pudo quitar el turno");
      cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

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
          alergias: alergiasBen.trim() || null,
          preferencias: prefBen || null,
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
      setAlergiasBen("");
      setPrefBen("");
      setBenExito("✅ Beneficiario registrado. Ya puede reservar su minuta.");
      cargarDatos();
    } catch (err) {
      setBenError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

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

  const iniciarEdicionSede = (s: Sede) => {
    setEditandoSede(s.id);
    setEditNombreSede(s.nombre);
  };

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

  const borrarUsuarioFunc = async (usuario: Usuario) => {
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
      // sin cambios
    } finally {
      setHiloCargando((c) => ({ ...c, [id]: false }));
    }
  };

  const abrirHilo = (id: number) => {
    setHiloAbierto((a) => {
      const abierto = !a[id];
      if (abierto) cargarHilo(id);
      return { ...a, [id]: abierto };
    });
  };

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

  const refrescarMensajes = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/contacto`, {
        headers: cabeceras(false),
      });
      if (respuesta.ok) setMensajes(await respuesta.json());
    } catch {
      // sin cambios
    }
    for (const id of Object.keys(hilosRef.current)) {
      if (hiloAbiertoRef.current[Number(id)]) cargarHilo(Number(id));
    }
  };

  const iniciarEdicionUsuario = (u: Usuario) => {
    setEditandoUsuario(u.id);
    setEditNombre(u.nombre);
    setEditUsuario(u.usuario);
    setEditRol(u.rol);
    setEditClave("");
    setEditSede(u.sede || "");
    setEditTurno(u.turno || "Almuerzo");
    setEditGrado(u.grado || "");
  };

  const guardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoUsuario === null) return;
    try {
      const cuerpo: Record<string, unknown> = {
        nombre: editNombre,
        usuario: editUsuario,
        rol: editRol,
      };
      if (editClave) cuerpo.clave = editClave;
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
        <TabPanelCocina
          fechaPanel={fechaPanel}
          setFechaPanel={setFechaPanel}
          panelDia={panelDia}
          panelCargando={panelCargando}
          menuDia={menuDia}
          sedes={sedes}
          sobrantesCargando={sobrantesCargando}
          sobrantesGuardando={sobrantesGuardando}
          sobrantesBorrador={sobrantesBorrador}
          sobranteError={sobranteError}
          sobranteExito={sobranteExito}
          cambiarSobrante={cambiarSobrante}
          guardarSobrantes={guardarSobrantes}
        />
      )}

      {!cargando && !error && pestanaActiva === "tablero" && (
        <TabTablero
          fechaTablero={fechaTablero}
          setFechaTablero={setFechaTablero}
          tablero={tablero}
          tableroCargando={tableroCargando}
        />
      )}

      {!cargando && !error && pestanaActiva === "beneficiarios" && (
        <TabBeneficiarios
          beneficiarios={beneficiarios}
          sedes={sedes}
          docBen={docBen}
          setDocBen={setDocBen}
          nombreBen={nombreBen}
          setNombreBen={setNombreBen}
          sedeBen={sedeBen}
          setSedeBen={setSedeBen}
          turnoBen={turnoBen}
          setTurnoBen={setTurnoBen}
          gradoBen={gradoBen}
          setGradoBen={setGradoBen}
          pinBen={pinBen}
          setPinBen={setPinBen}
          alergiasBen={alergiasBen}
          setAlergiasBen={setAlergiasBen}
          prefBen={prefBen}
          setPrefBen={setPrefBen}
          benError={benError}
          benExito={benExito}
          pins={pins}
          setPins={setPins}
          registrarBeneficiario={registrarBeneficiario}
          asignarPin={asignarPin}
          borrarBeneficiario={borrarBeneficiario}
        />
      )}

      {!cargando && !error && pestanaActiva === "asistencia" && (
        <TabAsistencia
          asistenciaFecha={asistenciaFecha}
          setAsistenciaFecha={setAsistenciaFecha}
          asistenciaGrupo={asistenciaGrupo}
          asistenciaReservas={asistenciaReservas}
          asistenciaCargando={asistenciaCargando}
          asistenciaError={asistenciaError}
          asistenciaExito={asistenciaExito}
          cargarAsistencia={cargarAsistencia}
          marcarAsistencia={marcarAsistencia}
          marcarTodosAsistencia={marcarTodosAsistencia}
        />
      )}

      {!cargando && !error && pestanaActiva === "incidentes" && (
        <TabIncidentes
          rol={rol}
          incidentesVisibles={incidentesVisibles}
          incidenteCargando={incidenteCargando}
          incidenteError={incidenteError}
          incidenteExito={incidenteExito}
          incidenteEstudiantes={incidenteEstudiantes}
          incidenteDoc={incidenteDoc}
          setIncidenteDoc={setIncidenteDoc}
          incidenteTipo={incidenteTipo}
          setIncidenteTipo={setIncidenteTipo}
          incidenteDescripcion={incidenteDescripcion}
          setIncidenteDescripcion={setIncidenteDescripcion}
          incidenteFecha={incidenteFecha}
          setIncidenteFecha={setIncidenteFecha}
          incidenteImagen={incidenteImagen}
          setIncidenteImagen={setIncidenteImagen}
          incidenteEnviando={incidenteEnviando}
          incidenteResolviendo={incidenteResolviendo}
          editandoIncidente={editandoIncidente}
          setEditandoIncidente={setEditandoIncidente}
          editIncidenteTipo={editIncidenteTipo}
          setEditIncidenteTipo={setEditIncidenteTipo}
          editIncidenteDoc={editIncidenteDoc}
          setEditIncidenteDoc={setEditIncidenteDoc}
          editIncidenteDescripcion={editIncidenteDescripcion}
          setEditIncidenteDescripcion={setEditIncidenteDescripcion}
          editIncidenteFecha={editIncidenteFecha}
          setEditIncidenteFecha={setEditIncidenteFecha}
          editIncidenteImagen={editIncidenteImagen}
          setEditIncidenteImagen={setEditIncidenteImagen}
          editIncidenteEnviando={editIncidenteEnviando}
          incidentesFiltro={incidentesFiltro}
          setIncidentesFiltro={setIncidentesFiltro}
          incidentesDesde={incidentesDesde}
          setIncidentesDesde={setIncidentesDesde}
          incidentesHasta={incidentesHasta}
          setIncidentesHasta={setIncidentesHasta}
          incidentesBusqueda={incidentesBusqueda}
          setIncidentesBusqueda={setIncidentesBusqueda}
          reportarIncidente={reportarIncidente}
          adjuntarFotoIncidente={adjuntarFotoIncidente}
          resolverIncidente={resolverIncidente}
          abrirEdicionIncidente={abrirEdicionIncidente}
          guardarIncidenteEditado={guardarIncidenteEditado}
          borrarIncidente={borrarIncidente}
        />
      )}

      {!cargando && !error && pestanaActiva === "menu" && (
        <TabMenu
          menu={menu}
          semanaMenu={semanaMenu}
          setSemanaMenu={setSemanaMenu}
          diaMenu={diaMenu}
          setDiaMenu={setDiaMenu}
          jornadaMenu={jornadaMenu}
          setJornadaMenu={setJornadaMenu}
          varianteMenu={varianteMenu}
          setVarianteMenu={setVarianteMenu}
          platilloMenu={platilloMenu}
          setPlatilloMenu={setPlatilloMenu}
          descripcionMenu={descripcionMenu}
          setDescripcionMenu={setDescripcionMenu}
          caloriasMenu={caloriasMenu}
          setCaloriasMenu={setCaloriasMenu}
          imagenMenu={imagenMenu}
          setImagenMenu={setImagenMenu}
          publicarMenuAhora={publicarMenuAhora}
          setPublicarMenuAhora={setPublicarMenuAhora}
          menuError={menuError}
          menuExito={menuExito}
          registrarMenu={registrarMenu}
          cambiarEstadoPlato={cambiarEstadoPlato}
          borrarPlato={borrarPlato}
          subirImagen={subirImagen}
          setMenuError={setMenuError}
        />
      )}

      {!cargando && !error && pestanaActiva === "avisos" && (
        <TabAvisos
          avisos={avisos}
          tituloAviso={tituloAviso}
          setTituloAviso={setTituloAviso}
          textoAviso={textoAviso}
          setTextoAviso={setTextoAviso}
          fechaAviso={fechaAviso}
          setFechaAviso={setFechaAviso}
          imagenAviso={imagenAviso}
          setImagenAviso={setImagenAviso}
          publicarAvisoAhora={publicarAvisoAhora}
          setPublicarAvisoAhora={setPublicarAvisoAhora}
          avisoError={avisoError}
          avisoExito={avisoExito}
          publicarAviso={publicarAviso}
          cambiarEstadoAviso={cambiarEstadoAviso}
          borrarAviso={borrarAviso}
          subirImagen={subirImagen}
        />
      )}

      {!cargando && !error && pestanaActiva === "galeria" && (
        <TabGaleria
          galeria={galeria}
          tituloGaleria={tituloGaleria}
          setTituloGaleria={setTituloGaleria}
          descripcionGaleria={descripcionGaleria}
          setDescripcionGaleria={setDescripcionGaleria}
          imagenGaleria={imagenGaleria}
          setImagenGaleria={setImagenGaleria}
          galeriaError={galeriaError}
          galeriaExito={galeriaExito}
          publicarFotoGaleria={publicarFotoGaleria}
          borrarFotoGaleria={borrarFotoGaleria}
          subirImagen={subirImagen}
        />
      )}

      {!cargando && !error && pestanaActiva === "instituciones" && (
        <TabInstituciones
          instituciones={instituciones}
          nombreInst={nombreInst}
          instError={instError}
          instExito={instExito}
          setNombreInst={setNombreInst}
          registrarInstitucion={registrarInstitucion}
          borrarInstitucion={borrarInstitucion}
        />
      )}

      {!cargando && !error && pestanaActiva === "sedes" && (
        <TabSedes
          sedes={sedes}
          nombreSede={nombreSede}
          editandoSede={editandoSede}
          editNombreSede={editNombreSede}
          sedeError={sedeError}
          sedeExito={sedeExito}
          setNombreSede={setNombreSede}
          setEditNombreSede={setEditNombreSede}
          setEditandoSede={setEditandoSede}
          registrarSede={registrarSede}
          iniciarEdicionSede={iniciarEdicionSede}
          guardarEdicionSede={guardarEdicionSede}
          borrarSede={borrarSede}
        />
      )}

      {!cargando && !error && pestanaActiva === "notificaciones" && (
        <TabNotificaciones notificaciones={notificaciones} />
      )}

      {!cargando && !error && pestanaActiva === "mensajes" && (
        <TabMensajes
          mensajes={mensajes}
          hilos={hilos}
          hiloAbierto={hiloAbierto}
          hiloCargando={hiloCargando}
          hiloEnviando={hiloEnviando}
          borradoresChat={borradoresChat}
          fotosChat={fotosChat}
          borrandoHilo={borrandoHilo}
          alternarLeido={alternarLeido}
          abrirHilo={abrirHilo}
          enviarMensajeAdmin={enviarMensajeAdmin}
          borrarConversacion={borrarConversacion}
          setBorradoresChat={setBorradoresChat}
          setFotosChat={setFotosChat}
        />
      )}

      {!cargando && !error && pestanaActiva === "reportes" && (
        <TabReportes
          desde={desde}
          hasta={hasta}
          setDesde={setDesde}
          setHasta={setHasta}
          rol={rol}
          reporte={reporte}
          sobrantesReporte={sobrantesReporte}
          sobrantesReporteMensaje={sobrantesReporteMensaje}
          editandoSobrantes={editandoSobrantes}
          setEditandoSobrantes={setEditandoSobrantes}
          diaria={diaria}
          fechaDiaria={fechaDiaria}
          setFechaDiaria={setFechaDiaria}
          diariaCargada={diariaCargada}
          exportarCSV={exportarCSV}
          imprimirDiaria={imprimirDiaria}
          cargarDiaria={cargarDiaria}
          conteoDiario={conteoDiario}
          sobrantesPorFechaSede={sobrantesPorFechaSede}
          abrirEdicionSobrantes={abrirEdicionSobrantes}
          cambiarSobranteReporte={cambiarSobranteReporte}
          guardarSobrantesEditados={guardarSobrantesEditados}
          borrarSobrantes={borrarSobrantes}
          construirSecciones={construirSecciones}
          opcionesReporte={opcionesReporte}
          tendencia={tendencia}
          tendenciaCargando={tendenciaCargando}
        />
      )}

      {!cargando && !error && pestanaActiva === "usuarios" && (
        <TabUsuarios
          usuarios={usuarios}
          sedes={sedes}
          nombreUsu={nombreUsu}
          setNombreUsu={setNombreUsu}
          usuarioUsu={usuarioUsu}
          setUsuarioUsu={setUsuarioUsu}
          rolUsu={rolUsu}
          setRolUsu={setRolUsu}
          claveUsu={claveUsu}
          setClaveUsu={setClaveUsu}
          sedeUsu={sedeUsu}
          setSedeUsu={setSedeUsu}
          turnoUsu={turnoUsu}
          setTurnoUsu={setTurnoUsu}
          gradoUsu={gradoUsu}
          setGradoUsu={setGradoUsu}
          usuError={usuError}
          usuExito={usuExito}
          registrarUsuario={registrarUsuario}
          alternarUsuario={alternarUsuario}
          borrarUsuario={borrarUsuarioFunc}
          iniciarEdicionUsuario={iniciarEdicionUsuario}
          editandoUsuario={editandoUsuario}
          setEditandoUsuario={setEditandoUsuario}
          editNombre={editNombre}
          setEditNombre={setEditNombre}
          editUsuario={editUsuario}
          setEditUsuario={setEditUsuario}
          editRol={editRol}
          setEditRol={setEditRol}
          editClave={editClave}
          setEditClave={setEditClave}
          editSede={editSede}
          setEditSede={setEditSede}
          editTurno={editTurno}
          setEditTurno={setEditTurno}
          editGrado={editGrado}
          setEditGrado={setEditGrado}
          guardarEdicionUsuario={guardarEdicionUsuario}
        />
      )}

      {pestana === "config" && (
        <TabConfig
          config={config}
          horaLimite={horaLimite}
          setHoraLimite={setHoraLimite}
          cupos={cupos}
          setCupos={setCupos}
          configMensaje={configMensaje}
          sedes={sedes}
          guardarConfig={guardarConfig}
        />
      )}

      {pestana === "turnos" && (
        <TabTurnos
          turnos={turnos}
          listaCocina={listaCocina}
          fechaTurno={fechaTurno}
          setFechaTurno={setFechaTurno}
          usuarioTurno={usuarioTurno}
          setUsuarioTurno={setUsuarioTurno}
          sedeTurno={sedeTurno}
          setSedeTurno={setSedeTurno}
          turnosMensaje={turnosMensaje}
          sedes={sedes}
          asignarTurno={asignarTurno}
          quitarTurno={quitarTurno}
        />
      )}

      {pestana === "auditoria" && (
        <TabAuditoria auditoria={auditoria} />
      )}
    </section>
  );
}

export default Admin;
