// URL base de la API del backend.
//
// Se lee de VITE_API_URL (configurada en frontend/.env o en Render).
// Si no esta definida se asume que el backend corre en localhost:4000
// (desarrollo). En produccion hay que definir VITE_API_URL con la
// direccion del backend desplegado, ej: https://pae-api.onrender.com

export const API_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");

// URL pública del bucket "juegos" de Supabase. Supabase sirve los .html
// como text/plain (anti-XSS), así que los archivos subidos a ese bucket se
// cargan a través del proxy del backend (archivos.js), que responde con
// Content-Type text/html y los renderiza bien en el iframe del Reproductor.
const PREFIJO_BUCKET_JUEGOS = "https://aeortsskfobulpzcjdpu.supabase.co/storage/v1/object/public/juegos/";

// Devuelve la URL que reproducirá el iframe para un enlace dado: usa el
// proxy para archivos de nuestro bucket "juegos" y deja los enlaces
// externos (Scratch, TurboWarp, hosting propio) sin tocar.
export function urlReproduccionJuego(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith(PREFIJO_BUCKET_JUEGOS)) {
    return `${API_URL}/api/archivos/servir-juego?url=${encodeURIComponent(url)}`;
  }
  return url;
}
