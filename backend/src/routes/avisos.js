// rutas de los avisos
// el administrador publica avisos y estos aparecen en la
// pagina de inicio, tambien los lee el bot para responder

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol } from "../config/auth.js";

const router = Router();

// GET /api/avisos
// lista todos los avisos, los mas nuevos primero (publico)
router.get("/", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("avisos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/avisos
// crea un aviso nuevo (solo admin)
// cuerpo esperado: { titulo, texto, fecha, imagen }
//   - imagen: URL publica de la foto (opcional)
router.post("/", requiereRol("admin", "coordinador", "profesor"), async (req, res) => {
  const { titulo, texto, fecha, imagen } = req.body;

  if (!titulo || !texto) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const { data, error } = await getSupabase()
    .from("avisos")
    .insert([{ titulo, texto, fecha, imagen: imagen || null }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/avisos/:id
// elimina un aviso (solo admin)
router.delete("/:id", requiereRol("admin", "coordinador", "profesor"), async (req, res) => {
  const { error } = await getSupabase()
    .from("avisos")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
