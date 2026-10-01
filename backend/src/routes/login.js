// POST /api/login :: "admin" se valida contra ADMIN_CLAVE (env);
// el resto contra la tabla usuarios (clave/PIN hasheado). Devuelve el token.
import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { firmarToken, adminConfigurado } from "../config/auth.js";
import { verificarClave, hashClave } from "../config/password.js";
import { getSupabase } from "../config/supabase.js";
import { limiteLogin } from "../config/rateLimit.js";

const router = Router();

// Hash de una clave que no existe, para gastar el mismo tiempo de CPU cuando el
// usuario no esta en la tabla (ver mas abajo). Es un valor fijo, no un secreto:
// solo sirve para igualar el coste de la verificacion.
const HASH_FICTICIO = hashClave("__usuario_inexistente__");

router.post("/", limiteLogin, async (req, res) => {
  const { usuario, clave } = req.body || {};

  if (!usuario || !clave) {
    return res.status(400).json({ error: "Faltan el usuario y la clave" });
  }

  // --- Caso especial: el administrador (clave en el .env) ---
  if (String(usuario).trim().toLowerCase() === "admin") {
    if (!adminConfigurado()) {
      return res.status(503).json({
        error: "El panel no esta configurado. El administrador debe definir ADMIN_CLAVE.",
      });
    }

    const a = Buffer.from(String(clave));
    const b = Buffer.from(process.env.ADMIN_CLAVE);
    const iguales = a.length === b.length && timingSafeEqual(a, b);

    if (!iguales) {
      return res.status(401).json({ error: "Usuario o clave incorrectos" });
    }

    return res.json({
      token: firmarToken({ usuario: "admin", rol: "admin", nombre: "Administrador" }),
      rol: "admin",
      usuario: "admin",
      nombre: "Administrador",
      expiraEn: "12h",
    });
  }

  // --- Resto de usuarios (tabla "usuarios": cocina, profesor, etc.) ---
  const usuarioLimpio = String(usuario).trim();
  const docNormalizado = usuarioLimpio.replace(/[\s.\-]/g, "");

  let consulta = getSupabase()
    .from("usuarios")
    .select("id, nombre, usuario, clave_hash, rol, activo");

  if (docNormalizado !== usuarioLimpio && /^\d{4,20}$/.test(docNormalizado)) {
    consulta = consulta.or(`usuario.eq.${usuarioLimpio},usuario.eq.${docNormalizado}`);
  } else {
    consulta = consulta.eq("usuario", usuarioLimpio);
  }

  const { data: fila, error } = await consulta.maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Tiempo de respuesta constante: si el usuario no existe (o esta inactivo) se
  // ejecuta igualmente una verificacion scrypt contra un hash ficticio. Asi el
  // fallo responde en el mismo tiempo que un usuario real con clave incorrecta y
  // no se puede enumerar la tabla de usuarios midiendo la respuesta.
  if (!fila || !fila.activo) {
    verificarClave(String(clave), HASH_FICTICIO);
    return res.status(401).json({ error: "Usuario o clave incorrectos" });
  }

  if (!verificarClave(clave, fila.clave_hash)) {
    return res.status(401).json({ error: "Usuario o clave incorrectos" });
  }

  res.json({
    token: firmarToken({ usuario: fila.usuario, rol: fila.rol, nombre: fila.nombre }),
    rol: fila.rol,
    usuario: fila.usuario,
    nombre: fila.nombre,
    expiraEn: "12h",
  });
});

export default router;