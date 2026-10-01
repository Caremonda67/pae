// Subida de archivos a Supabase Storage (imagenes y videojuegos del
// Arcade). El frontend los manda en base64; la validacion y el guardado
// viven en config/almacenamiento.js.
import { Router } from "express";
import { requiereRol } from "../config/auth.js";
import { getSupabase } from "../config/supabase.js";
import { subirImagen, subirArchivoJuego, ErrorValidacion } from "../config/almacenamiento.js";

const router = Router();

// POST /api/archivos/subir
// Cuerpo esperado: { base64: "data:image/png;base64,....", nombre: "foto.png" }
// Devuelve: { url: "https://....supabase.co/storage/v1/object/public/imagenes/...." }
router.post("/subir", requiereRol("admin", "cocina", "coordinador", "profesor", "estudiante"), async (req, res) => {
  const { base64, nombre } = req.body || {};

  if (!base64 || !nombre) {
    return res.status(400).json({ error: "Faltan la imagen o el nombre" });
  }

  try {
    const url = await subirImagen(base64, nombre, "pae");
    res.status(201).json({ url });
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Subida de imagen:", err);
    res.status(500).json({ error: "Error interno al subir la imagen" });
  }
});

// GET /api/archivos/servir-juego?url=...
// Supabase sirve los .html publicos como text/plain (anti-XSS), lo que
// haria que el iframe del Reproductor los mostrara como texto. Esta ruta
// lee el archivo del bucket "juegos" con la service role key y lo sirve
// con Content-Type text/html. Solo acepta URLs de NUESTRO bucket "juegos".
const SUPA_PROYECTO = "aeortsskfobulpzcjdpu.supabase.co";
const PREFIJO_JUEGOS = "/storage/v1/object/public/juegos/";

router.get("/servir-juego", async (req, res) => {
  const { url } = req.query || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Falta el parámetro url" });
  }

  // Validación estricta: solo archivos del bucket "juegos" de nuestro proyecto
  let destino;
  try {
    destino = new URL(url);
  } catch {
    return res.status(400).json({ error: "URL inválida" });
  }
  if (destino.hostname !== SUPA_PROYECTO) {
    return res.status(400).json({ error: "Origen no permitido" });
  }
  if (!destino.pathname.startsWith(PREFIJO_JUEGOS)) {
    return res.status(400).json({ error: "Solo se permiten archivos del bucket de juegos" });
  }
  const ruta = destino.pathname.slice(PREFIJO_JUEGOS.length);
  if (!ruta || !/^[A-Za-z0-9/_.-]+$/.test(ruta)) {
    return res.status(400).json({ error: "Ruta inválida" });
  }

  // Solo se sirven juegos con estado "aprobado". Sin esta comprobacion, cualquiera
  // podria pedir la URL de un juego pendiente (o de un archivo recien subido y aun
  // sin revisar) y ejecutarlo como HTML desde el origen de la API.
  try {
    const { data: juegos, error: errorJuego } = await getSupabase()
      .from("juegos")
      .select("id, url_recurso, estado")
      .eq("url_recurso", url)
      .limit(1);
    if (errorJuego) {
      console.error("No se pudo comprobar el estado del juego:", errorJuego.message);
      return res.status(503).json({ error: "No se pudo verificar el juego" });
    }
    const juego = juegos?.[0];
    if (!juego || juego.estado !== "aprobado") {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }
  } catch (err) {
    console.error("Error comprobando el estado del juego:", err);
    return res.status(503).json({ error: "No se pudo verificar el juego" });
  }

  try {
    const { data, error } = await getSupabase()
      .storage.from("juegos")
      .download(ruta);
    if (error || !data) {
      console.error("No se pudo descargar el juego:", error?.message);
      return res.status(404).json({ error: "Archivo no encontrado" });
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    // Los juegos son HTML+JS legitimo que debe ejecutarse, asi que no se puede
    // quitar el script (el Arcade dejaria de funcionar). Aislamos en su lugar el
    // origen: CSP "sandbox" SIN allow-same-origin mete el documento en un origen
    // opaco, sin acceso a cookies, localStorage ni al resto de la API. Asi un
    // juego malicioso no puede tocar la sesion aunque se sirva como text/html.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Security-Policy",
      "sandbox allow-scripts allow-popups; script-src 'self' https: 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; " +
        "media-src 'self' data: https:; connect-src 'none'; frame-src 'none'"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch (err) {
    console.error("Error sirviendo el juego:", err);
    res.status(500).json({ error: "Error al servir el juego" });
  }
});

// POST /api/archivos/subir-juego
// Sube el archivo HTML de un videojuego del Arcade.
// Cuerpo esperado: { base64: "data:text/html;base64,....", nombre: "juego.html" }
// Devuelve: { url: "https://....supabase.co/storage/v1/object/public/juegos/...." }
// Cualquier rol con sesion puede subir el archivo, pero el HTML se sanea antes de
// guardarse (ver config/almacenamiento.js) y /servir-juego solo entrega juegos con
// estado "aprobado", asi que un juego estudiantil queda pendiente de moderacion y no
// es ejecutable hasta que un coordinador lo aprueba.
router.post("/subir-juego", requiereRol("estudiante", "admin", "coordinador"), async (req, res) => {
  const { base64, nombre } = req.body || {};

  if (!base64 || !nombre) {
    return res.status(400).json({ error: "Faltan el archivo o el nombre" });
  }

  try {
    const url = await subirArchivoJuego(base64, nombre);
    res.status(201).json({ url });
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Subida de juego:", err);
    res.status(500).json({ error: "Error interno al subir el juego" });
  }
});

export default router;