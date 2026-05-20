// ============================================================
// Hash de contraseñas (scrypt)
// ============================================================
// Usamos el scrypt de Node (no hace falta instalar bcrypt) para
// guardar las claves/PIN de los usuarios. El hash se guarda con su
// sal: formato "sal:hash". Nunca se almacena la clave en texto plano.
// ============================================================

import crypto from "node:crypto";

// Parametros de scrypt: 64 bytes de derivacion, coste por defecto
const LONGITUD = 64;

// Devuelve el hash en formato "sal:hash" (hex)
export function hashClave(clave) {
  const sal = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(clave), sal, LONGITUD).toString("hex");
  return `${sal}:${hash}`;
}

// Compara una clave en texto plano contra un hash guardado.
// Devuelve true si coincide. Usa timingSafeEqual para no filtrar
// cuanto del hash coincide.
export function verificarClave(clave, almacenado) {
  if (typeof almacenado !== "string" || !almacenado.includes(":")) return false;
  const [sal, hash] = almacenado.split(":");
  const derivada = crypto.scryptSync(String(clave), sal, LONGITUD);
  const esperada = Buffer.from(hash, "hex");
  return (
    derivada.length === esperada.length && crypto.timingSafeEqual(derivada, esperada)
  );
}
