// Utilidades para exportar datos del panel en formato CSV
// (se abre directo en Excel). Devuelve un archivo descargable.

function escapar(celda: string | number): string {
  return `"${String(celda).replace(/"/g, '""')}"`;
}

// Genera un archivo CSV y lo descarga con el nombre indicado
export function descargarCSV(filas: (string | number)[][], nombreArchivo: string) {
  const texto = filas.map((fila) => fila.map(escapar).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + texto], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
