export interface Juego {
  id: number;
  titulo: string;
  descripcion: string | null;
  instrucciones: string | null;
  categoria: string;
  tipo: "scratch" | "html_archivo" | "zip" | string;
  url_recurso: string;
  portada_url: string | null;
  autor_documento: string;
  autor_nombre: string;
  autor_grado: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  motivo_rechazo?: string | null;
  vistas: number;
  dispositivo: "pc" | "movil" | "ambos" | string;
  version?: string | null;
  novedades?: string | null;
  actualizado_en?: string | null;
  actualizacion_pendiente?: {
    estado: "pendiente" | "rechazado";
    tipo?: string;
    url_recurso?: string;
    portada_url?: string;
    dispositivo?: string;
    version?: string;
    novedades?: string;
    motivo?: string;
    solicitado_en?: string;
    decidido_en?: string;
    decidido_por?: string;
  } | null;
  created_at: string;
}

export interface VersionJuego {
  id: number;
  juego_id: number;
  version: string;
  novedades: string | null;
  url_recurso: string | null;
  portada_url: string | null;
  dispositivo: string;
  creada_en: string;
}

export const CATEGORIAS_JUEGOS = [
  "Todas",
  "Nutrición y Salud",
  "Cero Desperdicio",
  "Trivia y Preguntas",
  "Arcade y Acción",
  "Puzzles y Lógica",
] as const;

export const DISPOSITIVOS_JUEGOS = [
  { valor: "ambos", etiqueta: "PC y Celular", icono: "🖥️📱" },
  { valor: "pc", etiqueta: "Solo PC / Escritorio", icono: "🖥️" },
  { valor: "movil", etiqueta: "Solo Celular / Tablet", icono: "📱" },
] as const;

export function etiquetaDispositivo(dispositivo?: string | null): string {
  if (dispositivo === "pc") return "🖥️ PC";
  if (dispositivo === "movil") return "📱 Celular";
  return "🖥️📱 PC y Celular";
}
