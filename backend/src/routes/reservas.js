// rutas de las reservas
// el estudiante reserva su comida y aca se guarda en la base,
// tambien se calcula cuantas minutas hay por fecha para la cocina

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";

const router = Router();

// GET /api/reservas
// Lista todas las reservas
router.get("/", async (_req, res) => {
  const { data, error } = await getSupabase().from("reservas").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/reservas/hoy
// Total de reservas agrupadas por fecha (para que cocina sepa cuantas minutas preparar)
router.get("/totales", async (_req, res) => {
  const { data, error } = await getSupabase().from("reservas").select("fecha");
  if (error) return res.status(500).json({ error: error.message });

  // Contamos cuantas reservas hay por cada fecha
  const totales = {};
  for (const reserva of data) {
    const fecha = reserva.fecha;
    totales[fecha] = (totales[fecha] || 0) + 1;
  }

  res.json(totales);
});

// GET /api/reservas/:id
// Busca una reserva por su id
router.get("/:id", async (req, res) => {
  const { data, error } = await getSupabase()
    .from("reservas")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Reserva no encontrada" });
  res.json(data);
});

// POST /api/reservas
// Crea una reserva nueva
// Cuerpo esperado: { estudiante, documento, sede, turno, fecha }
router.post("/", async (req, res) => {
  const { estudiante, documento, sede, turno, fecha } = req.body;

  // Validacion basica de datos obligatorios
  if (!estudiante || !documento || !sede || !turno || !fecha) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const { data, error } = await getSupabase()
    .from("reservas")
    .insert([{ estudiante, documento, sede, turno, fecha }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/reservas/:id
// Actualiza el estado de una reserva (por ejemplo: asistio o no)
router.put("/:id", async (req, res) => {
  const { data, error } = await getSupabase()
    .from("reservas")
    .update(req.body)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/reservas/:id
// Elimina una reserva
router.delete("/:id", async (req, res) => {
  const { error } = await getSupabase().from("reservas").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
