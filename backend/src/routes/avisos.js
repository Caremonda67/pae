// rutas de los avisos
// el administrador publica avisos y estos aparecen en la
// pagina de inicio, tambien los lee el bot para responder

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";

const router = Router();

// GET /api/avisos
// lista todos los avisos, los mas nuevos primero
router.get("/", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("avisos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/avisos
// crea un aviso nuevo
// cuerpo esperado: { titulo, texto, fecha }
router.post("/", async (req, res) => {
  const { titulo, texto, fecha } = req.body;

  if (!titulo || !texto) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const { data, error } = await getSupabase()
    .from("avisos")
    .insert([{ titulo, texto, fecha }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/avisos/:id
// elimina un aviso
router.delete("/:id", async (req, res) => {
  const { error } = await getSupabase()
    .from("avisos")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
