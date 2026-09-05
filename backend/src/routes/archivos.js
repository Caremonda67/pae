// Subida de imagenes a Supabase Storage. El frontend la manda en
// base64; la validacion y el guardado viven en config/almacenamiento.js.
import { Router } from "express";
import { requiereRol } from "../config/auth.js";
import { subirImagen, ErrorValidacion } from "../config/almacenamiento.js";

const router = Router();

// POST /api/archivos/subir
// Cuerpo esperado: { base64: "data:image/png;base64,....", nombre: "foto.png" }
// Devuelve: { url: "https://....supabase.co/storage/v1/object/public/imagenes/...." }
router.post("/subir", requiereRol("admin", "cocina", "coordinador", "profesor"), async (req, res) => {
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

export default router;