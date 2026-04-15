// ============================================================
// Notificaciones del programa
// ============================================================
// Cuando un estudiante reserva, se guarda una notificacion en la
// base. Si el servidor tiene configurado un correo SMTP (variables
// SMTP_* en el .env) se envia un email real de confirmacion.
// Si no esta configurado, la notificacion queda como "pendiente"
// y el admin la puede ver desde el panel.
//
// Lectura: solo admin. Escritura: interna (al reservar).
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereAdmin } from "../config/auth.js";

const router = Router();

// Crea una notificacion en la base y, si hay SMTP configurado,
// intenta enviar el correo. Usada al momento de reservar.
export async function crearNotificacion({ tipo, destinatario, mensaje }) {
  const supabase = getSupabase();

  const fila = {
    tipo,
    destinatario,
    mensaje,
    enviado: false,
  };

  // 1. Intentamos enviar el email si hay SMTP configurado
  const smtpConfigurado =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM;

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

// Envia un email con SMTP (nodemailer). Devuelve true si salio bien.
async function enviarEmail(destinatario, mensaje) {
  try {
    const { createTransport } = await import("nodemailer");

    const transportador = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transportador.sendMail({
      from: process.env.SMTP_FROM,
      to: destinatario,
      subject: "PAE · Confirmación de minuta",
      text: mensaje,
    });

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
