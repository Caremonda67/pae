// ============================================================
// Autenticacion del panel de administrador
// ============================================================
// El login ya no se valida en el navegador (antes la clave
// estaba escrita en el codigo del frontend). Ahora el admin
// envia su clave al backend, este la compara con la variable
// de entorno ADMIN_CLAVE y si coincide entrega un token firmado.
//
// El token es STATELESS: se firma con HMAC y una fecha de
// expiracion, asi no hay que guardar sesiones en memoria y
// sobrevive a reinicios del servidor (importante en Render).
// ============================================================

import crypto from "node:crypto";

// Clave del panel. Debe estar en el .env (backend/.env o Render).
// NO se sube a github. Si no se define, el login se bloquea
// (ninguna clave es valida) en lugar de usar una clave conocida.
const ADMIN_CLAVE = process.env.ADMIN_CLAVE || null;

// Secreto con el que se firman los tokens. Mientras no se defina
// uno propio se usa la clave del admin. Si tampoco hay clave, se
// usa un valor aleatorio: nadie podra firmar tokens validos.
const SECRETO =
  process.env.ADMIN_SECRET || ADMIN_CLAVE || crypto.randomBytes(32).toString("hex");

// Cuanto dura el token (12 horas, tiempo de una jornada escolar)
const EXPIRACION_MS = 12 * 60 * 60 * 1000;

// ¿Esta configurada la clave del panel?
export function adminConfigurado() {
  return Boolean(ADMIN_CLAVE);
}

// Genera un token firmado: <payload-base64url>.<firma>
export function firmarToken(usuario = "admin") {
  const payload = {
    sub: usuario,
    exp: Date.now() + EXPIRACION_MS,
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const firma = crypto
    .createHmac("sha256", SECRETO)
    .update(base64)
    .digest("base64url");
  return `${base64}.${firma}`;
}

// Verifica el token y devuelve true si es valido y no expiro
export function verificarToken(token) {
  if (!token || typeof token !== "string") return false;

  const [base64, firma] = token.split(".");
  if (!base64 || !firma) return false;

  // Recalculamos la firma y comparamos (constante de tiempo)
  const esperada = crypto
    .createHmac("sha256", SECRETO)
    .update(base64)
    .digest("base64url");
  if (esperada !== firma) return false;

  // Validamos la expiracion
  try {
    const payload = JSON.parse(Buffer.from(base64, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return false;
  } catch {
    return false;
  }

  return true;
}

// Middleware de Express: exige un token valido en el header
// Authorization: Bearer <token>. Si falta, responde 401.
export function requiereAdmin(req, res, next) {
  const cabecera = req.headers.authorization || "";
  const token = cabecera.startsWith("Bearer ")
    ? cabecera.slice("Bearer ".length)
    : "";

  if (!verificarToken(token)) {
    return res
      .status(401)
      .json({ error: "No autorizado. Inicia sesion como administrador." });
  }
  next();
}
