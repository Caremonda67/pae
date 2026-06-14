// guarda los mensajes que llegan por el formulario de contacto

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol } from "../config/auth.js";
import { enviarEmail, correoConfigurado } from "../config/email.js";
import { limiteFormularios } from "../config/rateLimit.js";

const router = Router();

// GET /api/contacto
// lista los mensajes recibidos (solo para el panel de administrador)
router.get("/", requiereRol("admin", "coordinador"), async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("contactos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/contacto
// Recibe el formulario de contacto
// Cuerpo esperado: { nombre, correo, mensaje }
router.post("/", limiteFormularios, async (req, res) => {
  const { nombre, correo, mensaje } = req.body;

  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  // El correo debe tener un formato minimo valido
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim())) {
    return res.status(400).json({ error: "Correo no válido" });
  }

  const { data, error } = await getSupabase()
    .from("contactos")
    .insert([{ nombre: String(nombre).trim(), correo: String(correo).trim(), mensaje: String(mensaje).trim() }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Avisamos al administrador por email si esta configurado
  if (correoConfigurado() && process.env.ADMIN_EMAIL) {
    await enviarEmail(
      process.env.ADMIN_EMAIL,
      `PAE · Mensaje de ${nombre}`,
      `Nuevo mensaje del formulario de contacto:\n\nDe: ${nombre} <${correo}>\n\n${mensaje}`,
      `<h2>Nuevo mensaje de contacto</h2><p><strong>De:</strong> ${nombre} (${correo})</p><p>${mensaje}</p>`
    );
  }

  res.status(201).json(data);
});

export default router;
