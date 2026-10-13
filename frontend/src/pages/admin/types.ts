// Interfaces compartidas del panel de administrador
// Cada pestana las usa para tipar sus datos.

export interface Aviso {
  id: number;
  titulo: string;
  texto: string;
  fecha?: string;
  imagen?: string;
  estado?: string;
}

export interface MenuItem {
  id: number;
  semana: number;
  dia: string;
  jornada: string;
  platillo: string;
  descripcion: string;
  calorias?: number;
  imagen?: string;
  estado?: string;
}

export interface Configuracion {
  hora_limite_reserva: string | null;
  cupos_sede: Record<string, number>;
}

export interface TurnoCocina {
  id: number;
  fecha: string;
  usuario: string;
  sede: string;
  creado_por?: string | null;
}

export interface UsuarioCocina {
  id: number;
  usuario: string;
  nombre: string;
  sede?: string | null;
}

export interface AuditoriaEntrada {
  id: number;
  usuario?: string | null;
  rol?: string | null;
  accion: string;
  detalle?: string | null;
  created_at: string;
}

export interface PanelCocina {
  fecha: string;
  porJornada: Record<string, number>;
  porSede: Record<string, number>;
  total: number;
}

export interface Sobrante {
  id: number;
  fecha: string;
  sede: string;
  turno: string;
  porciones: number | null;
  peso_kg: number | null;
  creado_por?: string;
}

export const TURNOS_SOBRANTES = ["Almuerzo", "Refrigerio"] as const;

export interface Reporte {
  totalReservas: number;
  minutasServidas: number;
  minutasDesperdiciadas: number;
  porcentajeDesperdicio: number;
  porSede: Record<string, { reservas: number; asistieron: number }>;
  porTurno: Record<string, { reservas: number; asistieron: number }>;
}

export interface ReservaDiaria {
  id: number;
  estudiante: string;
  documento: string;
  sede: string;
  turno: string;
  fecha: string;
  asistio: boolean;
  grado?: string | null;
}

export interface TableroDia {
  fecha: string;
  total: number;
  asistidos: number;
  sinMarcar: number;
  porSede: Record<string, { total: number; asistidos: number }>;
  porTurno: Record<string, { total: number; asistidos: number }>;
  porSedeTurno: { sede: string; turno: string; total: number; asistidos: number }[];
  reservas: ReservaDiaria[];
}

export interface ReservaAsistencia {
  id: number;
  estudiante: string;
  documento: string;
  grado?: string | null;
  turno: string;
  asistio: boolean;
}

export interface Incidente {
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

export interface MenuDia {
  dia: string;
  platos: MenuItem[];
}

export interface MenuSemanaAdmin {
  semana: number;
  dias: MenuDia[];
}

export interface Institucion {
  id: number;
  nombre: string;
}

export interface Sede {
  id: number;
  nombre: string;
}

export interface FotoGaleria {
  id: number;
  titulo: string;
  imagen: string;
  descripcion?: string;
}

export interface Mensaje {
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

export interface MensajeChat {
  id: number | string;
  remitente: "estudiante" | "admin";
  texto: string;
  imagen?: string | null;
  created_at?: string;
}

export interface Beneficiario {
  id: number;
  documento: string;
  nombre: string;
  sede: string;
  turno: string;
  grado?: string;
}

export interface Notificacion {
  id: number;
  tipo: string;
  destinatario: string;
  mensaje: string;
  enviado: boolean;
  created_at: string;
}

export interface Usuario {
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

export type Pestana =
  | "panel"
  | "tablero"
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
  | "usuarios"
  | "config"
  | "turnos"
  | "auditoria";
