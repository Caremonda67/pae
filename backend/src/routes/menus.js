// ============================================================
// Rutas de Menus
// ============================================================
// CRUD del menu semanal del PAE. La cocina publica que se sirve
// cada dia y los estudiantes ven el catalogo desde la app.
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";

const router = Router();

// GET /api/menus
// Lista todos los menus del programa
router.get("/", async (_req, res) => {
  const { data, error } = await getSupabase().from("menus").select("*").order("dia", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/menus
// Crea un menu nuevo
// Cuerpo esperado: { dia, platillo, descripcion, calorias }
router.post("/", async (req, res) => {
  const { dia, platillo, descripcion, calorias } = req.body;

  if (!dia || !platillo) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const { data, error } = await getSupabase()
    .from("menus")
    .insert([{ dia, platillo, descripcion, calorias }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
