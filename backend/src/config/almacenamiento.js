// Subida de imagenes a Supabase Storage. El frontend la manda en
// base64; aqui se valida el tamano y la extension, se guarda en el
// bucket "imagenes" y se devuelve la URL publica. Rutas como
// archivos.js y contacto.js la reutilizan para no duplicar la logica.
import { getSupabase } from "./supabase.js";

// Error de validacion del pedido: la ruta responde 400, no 500.
export class ErrorValidacion extends Error {}

// Sube una imagen (base64) con validacion de tamano (5 MB) y de
// extension (lista blanca de imagenes comunes). "prefijo" organiza la
// ruta dentro del bucket (pae/, contacto/, etc.). Devuelve la URL.
// Lanza ErrorValidacion si el pedido no es una imagen valida y un
// Error generico si falla la subida a Supabase.
export async function subirImagen(base64, nombre, prefijo = "pae") {
  // El base64 viene como "data:image/png;base64,XXXX" o solo "XXXX"
  const coincide = String(base64).match(/^data:(image\/\w+);base64,(.+)$/s);
  const mime = coincide ? coincide[1] : "image/png";
  const datos = coincide ? coincide[2] : String(base64);

  // Tamano maximo razonable (5 MB) para evitar abusos
  const bytes = Buffer.from(datos, "base64");
  if (bytes.length > 5 * 1024 * 1024) {
    throw new ErrorValidacion("La imagen supera los 5 MB");
  }

  // Nombre unico: fecha + numero aleatorio + extension.
  // La extension se valida contra una lista blanca (imagenes comunes):
  // rechaza nombres raros, rutas y caracteres problematicos del upload.
  const extension = (String(nombre).match(/\.([a-z0-9]{1,5})$/i)?.[1] || "png").toLowerCase();
  if (!["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
    throw new ErrorValidacion("Formato de imagen no permitido");
  }
  const ruta = `${prefijo}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await getSupabase()
    .storage.from("imagenes")
    .upload(ruta, bytes, { contentType: mime });

  if (error) {
    console.error(`Error al subir imagen (${prefijo}):`, error.message);
    throw new Error("No se pudo subir la imagen");
  }

  const { data: urlPublica } = getSupabase()
    .storage.from("imagenes")
    .getPublicUrl(ruta);

  return urlPublica.publicUrl;
}

// Sube el archivo HTML de un videojuego del Arcade al bucket publico
// "juegos". Valida extension .html y tamano (2 MB). El juego se reproduce
// en el iframe del Reproductor desde esta URL publica.

// Saneado del HTML de un juego.
//
// Nota importante sobre el alcance: los juegos del Arcade son HTML+JS legitimo que
// NECESITA <script> (muchos cargan three.js u otros CDN desde <script src>), asi
// que aqui NO se quitan las etiquetas <script>: hacerlo dejaria el Arcade sin
// funcionar. La contencion real del XSS no la da este saneado, sino que la da
// /servir-juego, que sirve el documento con la CSP "sandbox" sin allow-same-origin
// (origen opaco: sin acceso a cookies, localStorage ni a la API) y solo entrega
// juegos con estado "aprobado".
//
// Lo que si se neutraliza aqui son los vectores que lets escaparian del sandbox o
// que permitirian redirigir/inyectar fuera del juego: manejadores on*, URLs
// javascript:/data:/vbscript:, <meta http-equiv=refresh> y plugins <object>/
// <embed>/<applet>, que pueden cargar un documento externo.
const MANEJADORES = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
// Acepta comillas o no: <meta http-equiv=refresh content=0;url=javascript:...>
const URLS_EJECUCION =
  /\b(href|src|xlink:href|formaction|action|poster|data)\s*=\s*(?:"\s*(?:javascript|data|vbscript):[^"]*"|'\s*(?:javascript|data|vbscript):[^']*'|(?:javascript|data|vbscript):[^\s>]+)/gi;
// srcset es una lista de URLs separadas por comas.
const URLS_EJECUCION_LISTA =
  /\ssrcset\s*=\s*(?:"[^"]*(?:javascript|data|vbscript):[^"]*"|'[^']*(?:javascript|data|vbscript):[^']*')/gi;
// Redireccion por meta: puede sacar al juego del sandbox hacia otro documento.
const META_REFRESH = /<\s*meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi;
// Plugins que cargan un documento embebido.
const PLUGINS = /<\s*\/?\s*(?:object|embed|applet)[\s\S]*?(?:<\s*\/\s*(?:object|embed|applet)\s*>|>)/gi;

export function sanearHtmlJuego(html) {
  return String(html)
    .replace(MANEJADORES, "")
    .replace(URLS_EJECUCION, "")
    .replace(URLS_EJECUCION_LISTA, "")
    .replace(META_REFRESH, "")
    .replace(PLUGINS, "");
}

export async function subirArchivoJuego(base64, nombre) {
  const coincide = String(base64).match(/^data:(text\/html);base64,(.+)$/s);
  const datos = coincide ? coincide[2] : String(base64);
  const mime = coincide ? coincide[1] : "text/html";
  const bytes = Buffer.from(datos, "base64");

  if (bytes.length <= 0) {
    throw new ErrorValidacion("El archivo está vacío");
  }
  if (bytes.length > 2 * 1024 * 1024) {
    throw new ErrorValidacion("El archivo HTML supera los 2 MB");
  }

  const nombreLimpio = String(nombre).trim().toLowerCase();
  if (!/\.html?$/.test(nombreLimpio)) {
    throw new ErrorValidacion("El archivo del juego debe ser .html");
  }

  // Se sanea antes de guardar: un .html con <script> se convertiria en XSS
  // almacenado servido desde el origen de la API.
  const saneado = Buffer.from(sanearHtmlJuego(bytes.toString("utf8")), "utf8");
  if (saneado.length > 2 * 1024 * 1024) {
    throw new ErrorValidacion("El archivo HTML supera los 2 MB");
  }

  const ruta = `juegos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.html`;

  const { error } = await getSupabase()
    .storage.from("juegos")
    .upload(ruta, saneado, { contentType: mime, upsert: false });

  if (error) {
    console.error("Error al subir juego HTML:", error.message);
    throw new Error("No se pudo subir el juego");
  }

  const { data: urlPublica } = getSupabase()
    .storage.from("juegos")
    .getPublicUrl(ruta);

  return urlPublica.publicUrl;
}