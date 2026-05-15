// ============================================================
// Envio de correos con Resend (compartido entre modulos)
// ============================================================
// Resend envia por HTTP (puerto 443), que no esta bloqueado en
// Render (plan gratis). Requiere RESEND_API_KEY y RESEND_FROM.
// Si faltan, las funciones devuelven false sin lanzar error.

// Envia un email. Devuelve true si salio bien, false si no.
export async function enviarEmail(destinatario, asunto, texto, html) {
  try {
    if (!destinatario) return false;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: destinatario,
      subject: asunto,
      text: texto,
      html: html || undefined,
    });

    if (error) {
      console.error("Resend rechazo el email:", error.message);
      return false;
    }

    console.log("Email enviado a", destinatario);
    return true;
  } catch (err) {
    console.error("No se pudo enviar el email:", err.message);
    return false;
  }
}

// ¿Esta configurado el envio? (sin key ni remitente no hay nada que hacer)
export function correoConfigurado() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}
