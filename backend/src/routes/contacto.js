// ============================================================
// Rutas de Contacto
// ============================================================
// Guarda los mensajes que los usuarios envian desde el formulario
// de contacto de la pagina web.
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";

const router = Router();

// POST /api/contacto
// Recibe el formulario de contacto
// Cuerpo esperado: { nombre, correo, mensaje }
router.post("/", async (req, res) => {
  const { nombre, correo, mensaje } = req.body;

  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const { data, error } = await getSupabase()
    .from("contactos")
    .insert([{ nombre, correo, mensaje }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
