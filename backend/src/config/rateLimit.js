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

// Login del admin: pocos intentos, falla rapido.
// 10 intentos cada 10 minutos por IP.
export const limiteLogin = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesion. Espera 10 minutos." },
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
