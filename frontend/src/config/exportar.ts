// Utilidades para exportar datos del panel con formato bonito.
// Genera un documento HTML con tablas estilizadas (colores de marca,
// encabezados, filas alternadas) y lo guarda con extension .xls para
// que Excel lo abra directamente ya formateado.

export interface SeccionTabla {
  titulo?: string;
  columnas: (string | number)[];
  filas: (string | number)[][];
}

export interface OpcionesExportar {
  titulo?: string;
  subtitulo?: string;
}

function escapar(texto: string | number): string {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Fecha de hoy legible (p. ej. "viernes, 21 de agosto de 2026")
function fechaLegible(): string {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Calcula el ancho recomendado (en puntos) de cada columna según su
// contenido mas largo, para que las tablas queden proporcionadas.
function anchosColumnas(columnas: (string | number)[], filas: (string | number)[][]) {
  return columnas.map((col, i) => {
    let maxLargo = String(col).length;
    for (const fila of filas) {
      maxLargo = Math.max(maxLargo, String(fila[i] ?? "").length);
    }
    return Math.max(12, maxLargo * 1.1 + 6);
  });
}

function renderizarTabla(seccion: SeccionTabla): string {
  const total = seccion.columnas.length;
  const anchos = anchosColumnas(seccion.columnas, seccion.filas);

  const colgroup = `<colgroup>${anchos
    .map((ancho) => `<col style="width:${ancho.toFixed(1)}pt" />`)
    .join("")}</colgroup>`;

  const titulo = seccion.titulo
    ? `<tr><td colspan="${total}" class="seccion">${escapar(seccion.titulo)}</td></tr>`
    : "";

  const encabezado = `<tr>${seccion.columnas
    .map((c, i) => `<th class="col-${i % 2}">${escapar(c)}</th>`)
    .join("")}</tr>`;

  const filas = seccion.filas
    .map((fila) => {
      const celdas = seccion.columnas
        .map((_, i) => {
          const valor = fila[i] ?? "";
          const esNumero = typeof valor === "number";
          const clase = esNumero ? "num" : "";
          return `<td class="${clase}">${escapar(valor)}</td>`;
        })
        .join("");
      return `<tr>${celdas}</tr>`;
    })
    .join("");

  return `<table>${colgroup}${titulo}${encabezado}${filas}</table>`;
}

// Genera un archivo .xls (HTML de tablas) y lo descarga
export function descargarExcel(
  secciones: SeccionTabla[],
  nombreArchivo: string,
  opciones: OpcionesExportar = {}
) {
  const cuerpo = secciones
    .filter((seccion) => seccion.columnas.length > 0)
    .map(renderizarTabla)
    .join("<div class=\"espacio\"></div>");

  const html = `<!DOCTYPE html>
<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Reporte</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body { font-family: "Segoe UI", "Calibri", Arial, sans-serif; margin: 0; }

  /* Encabezado del documento */
  .portada { width: 100%; border-collapse: collapse; }
  .portada td { border: none; }
  .portada .franja { background-color: #2e7d32; }
  .portada .titulo-doc { background-color: #2e7d32; color: #ffffff; font-size: 20pt; font-weight: bold; padding: 14px 16px; }
  .portada .sub-doc { background-color: #2e7d32; color: #c8e6c9; font-size: 11pt; padding: 2px 16px 10px; }
  .portada .linea { border: none; border-top: 6px solid #ffb300; }

  /* Tablas de datos */
  table { border-collapse: collapse; margin: 0 0 14px; font-size: 11pt; }
  .espacio { height: 18px; }
  td.seccion { background-color: #1b5e20; color: #ffffff; font-size: 13pt; font-weight: bold; padding: 9px 12px; }
  th { padding: 7px 12px; border: 1px solid #8bc34a; font-weight: bold; }
  th.col-0 { background-color: #a5d6a7; color: #1b5e20; }
  th.col-1 { background-color: #c8e6c9; color: #2e7d32; }
  td { padding: 6px 12px; border: 1px solid #d7e8c8; color: #263238; }
  tr:nth-child(even) td { background-color: #f7fbf2; }
  td.num { mso-number-format: "0"; text-align: right; font-weight: 600; }

  /* Pie de pagina */
  .pie { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .pie td { border: none; background-color: #f1f8e9; color: #558b2f; font-size: 9.5pt; padding: 8px 12px; }
</style>
</head>
<body>
  <table class="portada">
    <tr><td class="titulo-doc">PAE · ${escapar(opciones.titulo || "Reporte")}</td></tr>
    <tr><td class="sub-doc">${escapar(opciones.subtitulo || "Programa de Alimentación Escolar")}</td></tr>
    <tr><td class="linea"></td></tr>
  </table>

  ${cuerpo}

  <table class="pie">
    <tr><td>Documento generado el ${escapar(fechaLegible())} · PAE · Programa de Alimentación Escolar</td></tr>
  </table>
</body>
</html>`;

  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
