// Utilidades para exportar datos del panel con formato bonito.
// Genera un documento HTML con tablas estilizadas (colores de marca,
// encabezados, filas alternadas) y lo guarda con extension .xls para
// que Excel lo abra directamente ya formateado.

export interface SeccionTabla {
  titulo?: string;
  columnas: (string | number)[];
  filas: (string | number)[][];
}

function escapar(texto: string | number): string {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Genera un archivo .xls (HTML de tablas) y lo descarga
export function descargarExcel(secciones: SeccionTabla[], nombreArchivo: string) {
  const cuerpo = secciones
    .filter((seccion) => seccion.columnas.length > 0)
    .map((seccion) => {
      const columnas = seccion.columnas.length;
      const titulo = seccion.titulo
        ? `<tr><td colspan="${columnas}" class="titulo">${escapar(seccion.titulo)}</td></tr>`
        : "";
      const encabezado = `<tr>${seccion.columnas
        .map((c) => `<th>${escapar(c)}</th>`)
        .join("")}</tr>`;
      const filas = seccion.filas
        .map((fila) => {
          const celdas = seccion.columnas
            .map((_, i) => {
              const valor = fila[i] ?? "";
              const clase = typeof valor === "number" ? "num" : "";
              return `<td class="${clase}">${escapar(valor)}</td>`;
            })
            .join("");
          return `<tr>${celdas}</tr>`;
        })
        .join("");
      return `<table>${titulo}${encabezado}${filas}</table>`;
    })
    .join("<div class=\"separador\"></div>");

  const html = `<!DOCTYPE html>
<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Reporte</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body { font-family: "Segoe UI", Arial, sans-serif; }
  table { border-collapse: collapse; margin: 0 0 16px; font-size: 11pt; }
  .separador { height: 12px; }
  tr.titulo, td.titulo { background: #2e7d32; color: #ffffff; font-weight: bold; font-size: 12pt; padding: 8px 10px; }
  th { background: #a5d6a7; color: #1b5e20; font-weight: bold; padding: 6px 12px; border: 1px solid #9ccc9c; }
  td { padding: 5px 12px; border: 1px solid #d5d5d5; }
  tr:nth-child(even) td { background: #f1f8e9; }
  td.num { mso-number-format: 0; text-align: right; }
</style>
</head>
<body>${cuerpo}</body>
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
