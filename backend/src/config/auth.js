// ============================================================
// Autenticacion del panel con roles
// ============================================================
// Los usuarios entran con usuario + clave (o documento + PIN los
// estudiantes) y el backend entrega un token firmado con el rol.
// Cada rol solo puede acceder a las rutas que le corresponden.
//
// El token es STATELESS: se firma con HMAC y una fecha de
// expiracion, asi no hay que guardar sesiones en memoria y
// sobrevive a reinicios del servidor (importante en Render).
// ============================================================

import crypto from "node:crypto";

// Clave del panel de admin. Debe estar en el .env (backend/.env o
// Render). NO se sube a github. Si no se define, el login del admin
// se bloquea (ninguna clave es valida) en lugar de usar una conocida.
const ADMIN_CLAVE = process.env.ADMIN_CLAVE || null;

// Secreto con el que se firman los tokens. Mientras no se defina
// uno propio se usa la clave del admin. Si tampoco hay clave, se
// usa un valor aleatorio: nadie podra firmar tokens validos.
const SECRETO =
  process.env.ADMIN_SECRET || ADMIN_CLAVE || crypto.randomBytes(32).toString("hex");

// Cuanto dura el token (12 horas, tiempo de una jornada escolar)
const EXPIRACION_MS = 12 * 60 * 60 * 1000;

// Roles que existen en el sistema
export const ROLES = ["admin", "cocina", "profesor", "coordinador", "estudiante"];

// ¿Esta configurada la clave del panel?
export function adminConfigurado() {
  return Boolean(ADMIN_CLAVE);
}

// Genera un token firmado: <payload-base64url>.<firma>
// El payload lleva el rol para saber que puede hacer cada usuario.
export function firmarToken({ usuario, rol, nombre }) {
  const payload = {
    sub: usuario,
    rol,
    nombre,
    exp: Date.now() + EXPIRACION_MS,
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const firma = crypto
    .createHmac("sha256", SECRETO)
    .update(base64)
    .digest("base64url");
  return `${base64}.${firma}`;
}

// Verifica el token y devuelve el payload si es valido (null si no)
export function verificarToken(token) {
  if (!token || typeof token !== "string") return null;

  const [base64, firma] = token.split(".");
  if (!base64 || !firma) return null;

  // Recalculamos la firma y comparamos en tiempo constante:
  // comparar texto con === filtra informacion sobre la firma esperada
  const esperada = crypto
    .createHmac("sha256", SECRETO)
    .update(base64)
    .digest("base64url");
  const firmoA = Buffer.from(esperada);
  const firmoB = Buffer.from(firma);
  const firmaValida =
    firmoA.length === firmoB.length && crypto.timingSafeEqual(firmoA, firmoB);
  if (!firmaValida) return null;

  // Validamos la expiracion
  try {
    const payload = JSON.parse(Buffer.from(base64, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Lee el payload del token del header Authorization: Bearer <token>
export function leerToken(req) {
  const cabecera = req.headers.authorization || "";
  const token = cabecera.startsWith("Bearer ")
    ? cabecera.slice("Bearer ".length)
    : "";
  return verificarToken(token);
}

// Middleware de Express: exige un token valido Y que el rol del
// usuario este entre los permitidos. Ej: requiereRol("admin", "cocina")
export function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    const payload = leerToken(req);
    if (!payload) {
      return res.status(401).json({ error: "No autorizado. Inicia sesion." });
    }
    if (!rolesPermitidos.includes(payload.rol)) {
      return res.status(403).json({
        error: "Tu rol no tiene permiso para esta accion.",
      });
    }
    // Dejamos el usuario en la peticion para las rutas que lo necesiten
    req.usuario = payload;
    next();
  };
}

// Atajo para las rutas que solo puede usar el administrador
export const requiereAdmin = requiereRol("admin");

// Middleware para rutas que solo necesitan una sesion valida
// (cualquier rol que haya entrado). Por ejemplo, un estudiante
// consultando sus propios mensajes de contacto.
export const requiereSesion = requiereRol(...ROLES);
