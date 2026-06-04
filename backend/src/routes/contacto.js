// Guarda los mensajes que llegan por el formulario de contacto.
// El admin (o coordinador) los lee, los marca como leidos y puede
// responderle a un estudiante registrado: ese estudiante ve su
// mensaje y la respuesta cuando entra con su sesion.

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol, requiereSesion } from "../config/auth.js";
import { enviarEmail, correoConfigurado } from "../config/email.js";
import { limiteFormularios } from "../config/rateLimit.js";

const router = Router();

// Sube una imagen (base64) al bucket "imagenes" y devuelve su URL
// publica. Misma logica que /api/archivos/subir, pero sin exigir
// token: el formulario de contacto es publico (limiteFormularios
// ya protege la ruta contra abusos).
async function subirImagen(base64, nombre) {
  const coincide = String(base64).match(/^data:(image\/\w+);base64,(.+)$/s);
  const mime = coincide ? coincide[1] : "image/png";
  const datos = coincide ? coincide[2] : String(base64);

  // Tamano maximo razonable (5 MB) para evitar abusos
  const bytes = Buffer.from(datos, "base64");
  if (bytes.length > 5 * 1024 * 1024) {
    throw new Error("La imagen supera los 5 MB");
  }

  // Nombre unico: fecha + numero aleatorio + extension
  const extension = String(nombre).split(".").pop() || "png";
  const ruta = `contacto/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await getSupabase()
    .storage.from("imagenes")
    .upload(ruta, bytes, { contentType: mime });
  if (error) {
    console.error("Error al subir imagen de contacto:", error.message);
    throw new Error("No se pudo subir la imagen");
  }

  const { data: urlPublica } = getSupabase()
    .storage.from("imagenes")
    .getPublicUrl(ruta);
  return urlPublica.publicUrl;
}

// GET /api/contacto
// lista los mensajes recibidos (solo para el panel de administrador)
router.get("/", requiereRol("admin", "coordinador"), async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("contactos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/contacto/mios
// Mensajes de un estudiante registrado: los suyos + la respuesta que
// le haya dado el admin. Solo necesita una sesion valida; devuelve
// los mensajes cuyo documento coincide con el usuario de la sesion.
router.get("/mios", requiereSesion, async (req, res) => {
  const { data, error } = await getSupabase()
    .from("contactos")
    .select("*")
    .eq("documento", req.usuario.sub)
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/contacto
// Recibe el formulario de contacto
// Cuerpo esperado: { nombre, correo, mensaje, documento?, imagenBase64?, imagenNombre? }
router.post("/", limiteFormularios, async (req, res) => {
  const { nombre, correo, mensaje, documento, imagenBase64, imagenNombre } = req.body || {};

  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  // El correo debe tener un formato minimo valido
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim())) {
    return res.status(400).json({ error: "Correo no válido" });
  }

  const fila = {
    nombre: String(nombre).trim(),
    correo: String(correo).trim(),
    mensaje: String(mensaje).trim(),
    // Si el remitente es un estudiante registrado, su documento
    // vincula el mensaje para que luego vea la respuesta del admin.
    documento: documento ? String(documento).trim() : null,
  };

  // Si el estudiante adjunta una foto, la subimos primero
  if (imagenBase64) {
    try {
      fila.imagen = await subirImagen(imagenBase64, imagenNombre || "foto.png");
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  const { data, error } = await getSupabase()
    .from("contactos")
    .insert([fila])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Avisamos al administrador por email si esta configurado
  if (correoConfigurado() && process.env.ADMIN_EMAIL) {
    await enviarEmail(
      process.env.ADMIN_EMAIL,
      `PAE · Mensaje de ${nombre}`,
      `Nuevo mensaje del formulario de contacto:\n\nDe: ${nombre} <${correo}>\n\n${mensaje}`,
      `<h2>Nuevo mensaje de contacto</h2><p><strong>De:</strong> ${nombre} (${correo})</p><p>${mensaje}</p>`
    );
  }

  res.status(201).json(data);
});

// PUT /api/contacto/:id
// Marca un mensaje como leido (o no leido). Solo admin/coordinador.
// Cuerpo: { leido: true }
router.put("/:id", requiereRol("admin", "coordinador"), async (req, res) => {
  const { leido } = req.body || {};
  if (typeof leido !== "boolean") {
    return res.status(400).json({ error: "Falta el campo leido (true/false)" });
  }

  const { data, error } = await getSupabase()
    .from("contactos")
    .update({ leido })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/contacto/:id/respuesta
// El admin/coordinador responde un mensaje. Si el mensaje era de un
// estudiante registrado (tiene documento), el estudiante verá esta
// respuesta al entrar con su sesion. Responder tambien marca el
// mensaje como leido.
// Cuerpo: { respuesta: "texto" }
router.put("/:id/respuesta", requiereRol("admin", "coordinador"), async (req, res) => {
  const { respuesta } = req.body || {};
  if (!respuesta || !String(respuesta).trim()) {
    return res.status(400).json({ error: "Escribe una respuesta" });
  }

  const { data, error } = await getSupabase()
    .from("contactos")
    .update({
      respuesta: String(respuesta).trim(),
      respuesta_at: new Date().toISOString(),
      leido: true,
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
