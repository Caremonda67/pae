// rutas de las reservas
// el estudiante reserva su comida y aca se guarda en la base,
// tambien se calcula cuantas minutas hay por fecha para la cocina

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereAdmin } from "../config/auth.js";
import { crearNotificacion } from "./notificaciones.js";

const router = Router();

// GET /api/reservas
// Lista todas las reservas (solo admin, es informacion interna)
router.get("/", requiereAdmin, async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("reservas")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/reservas/totales
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

// GET /api/reservas/mis?documento=...
// Reservas propias de un estudiante (para la pagina "Mis reservas")
// IMPORTANTE: debe ir ANTES de la ruta /:id para que "mis" no se confunda
router.get("/mis", async (req, res) => {
  const { documento } = req.query;
  if (!documento) {
    return res.status(400).json({ error: "Falta el documento" });
  }

  const { data, error } = await getSupabase()
    .from("reservas")
    .select("*")
    .eq("documento", String(documento).trim())
    .order("fecha", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/reservas/reporte
// Reporte de desperdicio: cuantas minutas se reservaron, cuantas
// se sirvieron y cuantas se desperdiciaron por no asistir.
// Incluye desglose por sede y por turno para cocina.
router.get("/reporte", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("reservas")
    .select("fecha, asistio, sede, turno");
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

  // Desglose por sede: cuantas reservas y cuantas asistieron en cada una
  const porSede = {};
  // Desglose por turno: almuerzo / refrigerio
  const porTurno = {};
  for (const reserva of data) {
    const sede = reserva.sede || "Sin sede";
    if (!porSede[sede]) porSede[sede] = { reservas: 0, asistieron: 0 };
    porSede[sede].reservas += 1;
    if (reserva.asistio) porSede[sede].asistieron += 1;

    const turno = reserva.turno || "Sin turno";
    if (!porTurno[turno]) porTurno[turno] = { reservas: 0, asistieron: 0 };
    porTurno[turno].reservas += 1;
    if (reserva.asistio) porTurno[turno].asistieron += 1;
  }

  res.json({
    totalReservas: total,
    minutasServidas: asistieron,
    minutasDesperdiciadas: desperdicio,
    porcentajeDesperdicio: porcentaje,
    porSede,
    porTurno,
  });
});

// GET /api/reservas/diario?fecha=...
// Lista de reservas de un dia concreto, para que la cocina sepa
// cuantas minutas preparar por turno y sede (tabla diaria).
router.get("/diario", async (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  const { data, error } = await getSupabase()
    .from("reservas")
    .select("*")
    .eq("fecha", fecha);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ fecha, reservas: data });
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

  // La fecha no puede ser anterior a hoy
  const hoy = new Date().toISOString().slice(0, 10);
  if (fecha < hoy) {
    return res
      .status(400)
      .json({ error: "La fecha no puede ser anterior a hoy" });
  }

  // El documento debe estar registrado como beneficiario del programa.
  // Asi la reserva solo la pueden hacer estudiantes matriculados.
  const { data: beneficiario, error: errBen } = await getSupabase()
    .from("beneficiarios")
    .select("nombre, documento")
    .eq("documento", String(documento).trim())
    .maybeSingle();

  if (errBen) return res.status(500).json({ error: errBen.message });

  if (!beneficiario) {
    return res
      .status(400)
      .json({ error: "Documento no registrado en el programa" });
  }

  // Si no nos pasaron el nombre, lo tomamos del registro
  const nombreFinal = estudiante || beneficiario.nombre;

  // Evitar que el mismo documento reserve dos veces la misma fecha
  const { data: existente, error: errExistente } = await getSupabase()
    .from("reservas")
    .select("id")
    .eq("documento", documento)
    .eq("fecha", fecha)
    .maybeSingle();

  if (errExistente) {
    return res.status(500).json({ error: errExistente.message });
  }
  if (existente) {
    return res
      .status(400)
      .json({ error: "Ya tienes una reserva para esa fecha" });
  }

  const { data, error } = await getSupabase()
    .from("reservas")
    .insert([{ estudiante: nombreFinal, documento, sede, turno, fecha }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Registramos una notificacion de confirmacion (email si hay SMTP)
  crearNotificacion({
    tipo: "reserva",
    destinatario: req.body.correo || "",
    mensaje: `Hola ${nombreFinal}, tu minuta quedó reservada para el ${fecha} (${turno} en ${sede}). ¡Te esperamos!`,
  });

  res.status(201).json(data);
});

// DELETE /api/reservas/mis/:id?documento=...
// Cancelacion propia: solo se puede borrar si el documento de la
// consulta coincide con el dueño de la reserva.
router.delete("/mis/:id", async (req, res) => {
  const { documento } = req.query;
  if (!documento) {
    return res.status(400).json({ error: "Falta el documento" });
  }

  const { data: reserva, error: errReserva } = await getSupabase()
    .from("reservas")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (errReserva) return res.status(500).json({ error: errReserva.message });
  if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });

  // Solo el dueño puede cancelar su propia reserva
  if (reserva.documento !== String(documento).trim()) {
    return res
      .status(403)
      .json({ error: "No puedes cancelar la reserva de otra persona" });
  }

  const { error } = await getSupabase()
    .from("reservas")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// PUT /api/reservas/:id
// Actualiza el estado de una reserva (por ejemplo: asistio o no)
// Solo administrador.
router.put("/:id", requiereAdmin, async (req, res) => {
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
// Elimina una reserva (solo administrador)
router.delete("/:id", requiereAdmin, async (req, res) => {
  const { error } = await getSupabase().from("reservas").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
