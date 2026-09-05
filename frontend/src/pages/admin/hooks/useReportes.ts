import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import { cabeceras } from "../../../config/sesion";
import { fechaCorta } from "../../../config/fechas";
import { descargarExcel } from "../../../config/exportar";
import type { SeccionTabla, OpcionesExportar } from "../../../config/exportar";
import type { Reporte, ReservaDiaria, Sobrante, Tendencia } from "../types";
import { TURNOS_SOBRANTES } from "../types";

function hoyLocal() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

// Estado y operaciones del tab "reportes": totales, reporte de desperdicio,
// sobrantes por fecha/sede, tendencia y tabla diaria. Vive fuera de Admin.tsx
// para que el panel no concentre logica de todos los tabs en un solo archivo.
export function useReportes(opts: {
  rol: string;
  autenticado: boolean;
  pestana: string;
  setError: (v: string) => void;
}) {
  const { rol, autenticado, pestana, setError } = opts;

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

  return {
    desde,
    setDesde,
    hasta,
    setHasta,
    rol,
    reporte,
    sobrantesReporte,
    sobrantesReporteMensaje,
    editandoSobrantes,
    setEditandoSobrantes,
    diaria,
    fechaDiaria,
    setFechaDiaria,
    diariaCargada,
    exportarCSV,
    imprimirDiaria,
    cargarDiaria,
    conteoDiario,
    sobrantesPorFechaSede,
    abrirEdicionSobrantes,
    cambiarSobranteReporte,
    guardarSobrantesEditados,
    borrarSobrantes,
    construirSecciones,
    opcionesReporte,
    tendencia,
    tendenciaCargando,
  };
}
