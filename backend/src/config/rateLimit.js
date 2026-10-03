// ============================================================
// Limites de peticiones (rate limiting)
// ============================================================
// Protege los endpoints publicos contra abuso: fuerza bruta en el
// login, spam en el formulario de contacto y en las reservas.
// Express guarda los contadores en memoria (suficiente para este
// proyecto; en Render con varios reinicios se resetea, que esta
// bien para el uso educativo).
// ============================================================

import rateLimit from "express-rate-limit";

// Login del admin: 30 intentos cada 10 minutos por IP,
// suficiente para que varios estudiantes compartan la misma IP
// del colegio sin bloquearse entre si.
export const limiteLogin = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesion. Espera 10 minutos." },
});

// Chat con IA: cada mensaje consulta la base y gasta cuota de
// Gemini. 15 mensajes cada 5 minutos por IP alcanza de sobra para
// conversar y evita que alguien queme la cuota a proposito.
export const limiteChat = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados mensajes al chat. Espera unos minutos e intenta de nuevo." },
});

// Formularios publicos (contacto y reservas): moderado.
// 30 peticiones cada 10 minutos por IP.
export const limiteFormularios = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Espera unos minutos e intenta de nuevo." },
});
