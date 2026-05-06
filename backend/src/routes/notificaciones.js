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

const router = Router();

// Crea una notificacion en la base y, si hay RESEND_API_KEY,
// intenta enviar el correo. Usada al momento de reservar.
export async function crearNotificacion({ tipo, destinatario, mensaje }) {
  const supabase = getSupabase();

  const fila = {
    tipo,
    destinatario,
    mensaje,
    enviado: false,
  };

  // 1. Intentamos enviar el email si hay API key configurada
  const smtpConfigurado = process.env.RESEND_API_KEY && process.env.RESEND_FROM;

  if (smtpConfigurado && destinatario) {
    const enviado = await enviarEmail(destinatario, mensaje);
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

// Envia un email con Resend (API por HTTP). Devuelve true si salio bien.
async function enviarEmail(destinatario, mensaje) {
  try {
    const { Resend } = await import("resend");

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: destinatario,
      subject: "PAE · Confirmación de minuta",
      text: mensaje,
    });

    if (error) {
      console.error("Resend rechazo el email:", error.message);
      return false;
    }

    console.log("Email de notificacion enviado a", destinatario);
    return true;
  } catch (err) {
    console.error("No se pudo enviar el email:", err.message);
    return false;
  }
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
