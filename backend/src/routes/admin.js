// ============================================================
// Login del administrador
// ============================================================
// POST /api/admin/login
// Cuerpo esperado: { clave: "..." }
// Compara la clave con ADMIN_CLAVE (variable de entorno) y si
// coincide devuelve un token firmado con rol "admin" que el
// frontend guarda y envia en cada peticion protegida
// (Authorization: Bearer ...).
// ============================================================

import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { firmarToken, adminConfigurado } from "../config/auth.js";
import { limiteLogin } from "../config/rateLimit.js";

const router = Router();

router.post("/login", limiteLogin, (req, res) => {
  const { clave } = req.body || {};

  if (!clave) {
    return res.status(400).json({ error: "Falta la clave" });
  }

  // Si no hay ADMIN_CLAVE configurada en el servidor, nadie puede
  // entrar (no existe una clave por defecto que se pueda adivinar).
  if (!adminConfigurado()) {
    console.warn("Login bloqueado: falta ADMIN_CLAVE en el .env del servidor.");
    return res.status(503).json({
      error: "El panel no esta configurado. El administrador debe definir ADMIN_CLAVE.",
    });
  }

  // Comparacion en tiempo constante para no filtrar informacion
  const a = Buffer.from(String(clave));
  const b = Buffer.from(process.env.ADMIN_CLAVE);
  const iguales = a.length === b.length && timingSafeEqual(a, b);

  if (!iguales) {
    return res.status(401).json({ error: "Clave incorrecta" });
  }

  res.json({
    token: firmarToken({ usuario: "admin", rol: "admin", nombre: "Administrador" }),
    rol: "admin",
    usuario: "admin",
    nombre: "Administrador",
    expiraEn: "12h",
  });
});

export default router;
