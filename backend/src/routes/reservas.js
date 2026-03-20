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
  const { data, error } = await getSupabase()
    .from("reservas")
    .select("fecha, asistio");
  if (error) return res.status(500).json({ error: error.message });

  // Contamos cuantas reservas hay por cada fecha y cuantas asistieron
  const totales = {};
  for (const reserva of data) {
    const fecha = reserva.fecha;
    if (!totales[fecha]) {
      totales[fecha] = { reservas: 0, asistieron: 0 };
    }
    totales[fecha].reservas += 1;
    if (reserva.asistio) {
      totales[fecha].asistieron += 1;
    }
  }

  res.json(totales);
});

// GET /api/reservas/reporte
// Reporte de desperdicio: cuantas minutas se reservaron, cuantas
// se sirvieron y cuantas se desperdiciaron por no asistir.
router.get("/reporte", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("reservas")
    .select("fecha, asistio");
  if (error) return res.status(500).json({ error: error.message });

  let total = 0;
  let asistieron = 0;
  for (const reserva of data) {
    total += 1;
    if (reserva.asistio) asistieron += 1;
  }

  const desperdicio = total - asistieron;

  // porcentaje de desperdicio, evitando dividir entre cero
  let porcentaje = 0;
  if (total > 0) {
    porcentaje = Math.round((desperdicio / total) * 100);
  }

  res.json({
    totalReservas: total,
    minutasServidas: asistieron,
    minutasDesperdiciadas: desperdicio,
    porcentajeDesperdicio: porcentaje,
  });
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
