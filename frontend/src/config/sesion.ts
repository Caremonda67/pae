// Sesion del panel compartida entre paginas.
// Guarda el token y los datos del usuario que entra (rol, usuario,
// nombre) para que el panel y la reserva usen la misma sesion.
//
// El token se conserva en localStorage para que al recargar la
// pagina la sesion siga abierta. Los datos del usuario se guardan
// para saber que rol entro y que pestañas puede ver.

export interface Sesion {
  token: string;
  rol: string;
  usuario: string;
  nombre?: string;
}

const SESION_KEY = "pae_sesion";

// Nombre del evento que se dispara cuando la sesion cambia (entrar o
// salir). La sidebar lo escucha para actualizar su boton al instante,
// sin necesidad de recargar la pagina.
const EVENTO_SESION = "pae_sesion_cambio";

export const ROLES_LABEL: Record<string, string> = {
  admin: "Administrador",
  cocina: "Cocina",
  profesor: "Profesor",
  coordinador: "Coordinador",
  estudiante: "Estudiante",
};

// Avisa a los componentes que escuchan (misma pestana y otras pestanas
// abiertas) que la sesion guardada cambio.
function notificarCambioSesion() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTO_SESION));
}

// Se suscribe a los cambios de sesion. Devuelve una funcion para dejar
// de escuchar. También reacciona a los cambios de otras pestanas.
export function suscribirseASesion(alCambiar: () => void): () => void {
  const escuchar = () => alCambiar();
  window.addEventListener(EVENTO_SESION, escuchar);
  window.addEventListener("storage", escuchar);
  return () => {
    window.removeEventListener(EVENTO_SESION, escuchar);
    window.removeEventListener("storage", escuchar);
  };
}

// Lee la sesion guardada (o null si no hay sesion valida)
export function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(SESION_KEY);
    if (!crudo) return null;
    const sesion = JSON.parse(crudo) as Sesion;
    if (!sesion.token || !sesion.rol) return null;
    return sesion;
  } catch {
    return null;
  }
}

// Guarda la sesion tras un login correcto
export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
  notificarCambioSesion();
}

// Cierra la sesion (borra todo lo guardado)
export function cerrarSesion() {
  localStorage.removeItem(SESION_KEY);
  notificarCambioSesion();
}

// Cabeceras con el token para llamar a las rutas protegidas
export function cabeceras(cuerpo = true): Record<string, string> {
  const sesion = leerSesion();
  const headers: Record<string, string> = {};
  if (sesion?.token) headers.Authorization = `Bearer ${sesion.token}`;
  if (cuerpo) headers["Content-Type"] = "application/json";
  return headers;
}

// ¿El usuario de la sesion tiene alguno de los roles dados?
export function tieneRol(...roles: string[]): boolean {
  const sesion = leerSesion();
  return Boolean(sesion && roles.includes(sesion.rol));
}
