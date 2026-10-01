// Limites de peticiones por IP para los endpoints publicos.
import rateLimit from "express-rate-limit";

// La clave se toma de la IP real del socket (no de req.ip ni de
// X-Forwarded-For). Si la clave saliera de una cabecera manipulable, un atacante
// podria rotarla en cada peticion y evadir todos los limites, que es justo lo que
// este limite debe impedir.
const clavePorIp = (req) => req.socket?.remoteAddress || "desconocida";

// Comunes a los tres limites.
const comun = {
  windowMs: 10 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clavePorIp,
};

// Login: 30 intentos / 10 min por IP (varias maquinas del colegio comparten IP).
export const limiteLogin = rateLimit({
  ...comun,
  max: 30,
  message: { error: "Demasiados intentos de inicio de sesion. Espera 10 minutos." },
});

// Chat: 15 mensajes / 5 min por IP (cada mensaje gasta cuota de Gemini).
export const limiteChat = rateLimit({
  ...comun,
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { error: "Demasiados mensajes al chat. Espera unos minutos e intenta de nuevo." },
});

// Formularios publicos (contacto y reservas): 30 peticiones / 10 min por IP.
export const limiteFormularios = rateLimit({
  ...comun,
  max: 30,
  message: { error: "Demasiadas peticiones. Espera unos minutos e intenta de nuevo." },
});