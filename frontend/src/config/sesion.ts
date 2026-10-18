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
// Si el token ya expiro (exp en el payload) se ignora: se trata como
// sesion cerrada para que la pagina pida entrar de nuevo en lugar de
// lanzar una lluvia de 401 al backend.
export function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(SESION_KEY);
    if (!crudo) return null;
    const sesion = JSON.parse(crudo) as Sesion;
    if (!sesion.token || !sesion.rol) return null;
    if (tokenExpirado(sesion.token)) return null;
    return sesion;
  } catch {
    return null;
  }
}

// Decodifica el payload de un token (formato b64url.b64url) y dice si
// su exp ya paso. Devuelve false si el token no tiene exp (o no se
// puede leer) para no cerrarle la sesion a nadie por equivocacion.
function tokenExpirado(token: string): boolean {
  try {
    const [payloadB64] = token.split(".");
    if (!payloadB64) return false;
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const crudo = atob(base64);
    const bytes = new Uint8Array(crudo.length);
    for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
    const texto = new TextDecoder().decode(bytes);
    const payload = JSON.parse(texto) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    return payload.exp < Date.now();
  } catch {
    return false;
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
