// ============================================================
// Login del administrador
// ============================================================
// POST /api/admin/login
// Cuerpo esperado: { clave: "..." }
// Compara la clave con ADMIN_CLAVE (variable de entorno) y si
// coincide devuelve un token firmado que el frontend guarda y
// envia en cada peticion protegida (Authorization: Bearer ...).
// ============================================================

import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { firmarToken } from "../config/auth.js";

const router = Router();

// La clave que aceptamos (misma que usa auth.js para firmar)
const ADMIN_CLAVE = process.env.ADMIN_CLAVE || "pae2026";

router.post("/login", (req, res) => {
  const { clave } = req.body || {};

  if (!clave) {
    return res.status(400).json({ error: "Falta la clave" });
  }

  // Comparacion en tiempo constante para no filtrar informacion
  const a = Buffer.from(String(clave));
  const b = Buffer.from(ADMIN_CLAVE);
  const iguales = a.length === b.length && timingSafeEqual(a, b);

  if (!iguales) {
    return res.status(401).json({ error: "Clave incorrecta" });
  }

  res.json({ token: firmarToken("admin"), expiraEn: "12h" });
});

export default router;
