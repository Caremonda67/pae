// Subida de imagenes a Supabase Storage. El frontend la manda en
// base64, aqui se guarda en el bucket "imagenes" y se devuelve la URL.
import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol } from "../config/auth.js";

const router = Router();

// POST /api/archivos/subir
// Cuerpo esperado: { base64: "data:image/png;base64,....", nombre: "foto.png" }
// Devuelve: { url: "https://....supabase.co/storage/v1/object/public/imagenes/...." }
router.post("/subir", requiereRol("admin", "cocina", "coordinador", "profesor"), async (req, res) => {
  const { base64, nombre } = req.body || {};

  if (!base64 || !nombre) {
    return res.status(400).json({ error: "Faltan la imagen o el nombre" });
  }

  // El base64 viene como "data:image/png;base64,XXXX" o solo "XXXX"
  const coincide = String(base64).match(/^data:(image\/\w+);base64,(.+)$/s);
  const mime = coincide ? coincide[1] : "image/png";
  const datos = coincide ? coincide[2] : String(base64);

  // Tamaño maximo razonable (5 MB) para evitar abusos
  const bytes = Buffer.from(datos, "base64");
  if (bytes.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: "La imagen supera los 5 MB" });
  }

  try {
    // Nombre unico: fecha + numero aleatorio + extension.
    // La extension se valida contra una lista blanca (imagenes comunes):
    // rechaza nombres raros, rutas y caracteres problematicos del upload.
    const extension = (String(nombre).match(/\.([a-z0-9]{1,5})$/i)?.[1] || "png").toLowerCase();
    if (!["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
      return res.status(400).json({ error: "Formato de imagen no permitido" });
    }
    const ruta = `pae/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await getSupabase()
      .storage.from("imagenes")
      .upload(ruta, bytes, { contentType: mime });

    if (error) {
      console.error("Error al subir imagen:", error.message);
      return res.status(500).json({ error: "No se pudo subir la imagen" });
    }

    const { data: urlPublica } = getSupabase()
      .storage.from("imagenes")
      .getPublicUrl(ruta);

    res.status(201).json({ url: urlPublica.publicUrl });
  } catch (err) {
    console.error("Subida de imagen:", err);
    res.status(500).json({ error: "Error interno al subir la imagen" });
  }
});

export default router;
