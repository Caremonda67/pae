// ============================================================
// Notificaciones del programa
// ============================================================
// Cuando un estudiante reserva, se guarda una notificacion en la
// base. Si el servidor tiene configurado RESEND_API_KEY se envia
// un email real de confirmacion (via HTTP, puerto 443, que no
// esta bloqueado en Render). Si no esta configurado, la
// notificacion queda como "pendiente" y el admin la puede ver
// desde el panel.
//
// Lectura: solo admin. Escritura: interna (al reservar).
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereAdmin } from "../config/auth.js";
import { enviarEmail, correoConfigurado } from "../config/email.js";

const router = Router();

// Crea una notificacion en la base y, si hay RESEND_API_KEY,
// intenta enviar el correo. Usada al momento de reservar.
export async function crearNotificacion({ tipo, destinatario, mensaje, mensajeHtml }) {
  const supabase = getSupabase();

  const fila = {
    tipo,
    destinatario,
    mensaje,
    enviado: false,
  };

  // 1. Intentamos enviar el email si hay API key configurada
  if (correoConfigurado() && destinatario) {
    const enviado = await enviarEmail(
      destinatario,
      "PAE · Confirmación de minuta",
      mensaje,
      mensajeHtml
    );
    fila.enviado = enviado;
  }

  // 2. Guardamos la notificacion siempre (para el historial)
  const { data, error } = await supabase
    .from("notificaciones")
    .insert([fila])
    .select()
    .single();

  if (error) {
    console.error("Error al guardar notificacion:", error.message);
    return null;
  }
  return data;
}

// GET /api/notificaciones
// Lista las notificaciones (solo admin)
router.get("/", requiereAdmin, async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("notificaciones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
