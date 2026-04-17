// rutas de las reservas
// el estudiante reserva su comida y aca se guarda en la base,
// tambien se calcula cuantas minutas hay por fecha para la cocina

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereAdmin } from "../config/auth.js";
import { crearNotificacion } from "./notificaciones.js";

const router = Router();

// Valida que una fecha sea real (YYYY-MM-DD) y este dentro del rango
// permitido (desde hoy hasta 60 dias). Devuelve un mensaje o null.
// Esto protege la base: si llega un año con demasiados digitos o una
// fecha imposible, se rechaza antes de guardar.
function validarFecha(fecha) {
  // Debe tener exactamente el formato YYYY-MM-DD
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return "La fecha debe tener el formato año-mes-día (ej: 2026-08-10).";
  }

  // Verifica que sea una fecha real: 2026-02-31 no existe
  const [año, mes, dia] = fecha.split("-").map(Number);
  const fechaObj = new Date(año, mes - 1, dia);
  if (
    fechaObj.getFullYear() !== año ||
    fechaObj.getMonth() !== mes - 1 ||
    fechaObj.getDate() !== dia
  ) {
    return "Esa fecha no existe.";
  }

  // Rango permitido: desde hoy hasta 60 dias
  const hoy = new Date();
  const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const max = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 60);
  const maxTexto = `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, "0")}-${String(max.getDate()).padStart(2, "0")}`;

  if (fecha < hoyTexto) {
    return "La fecha no puede ser anterior a hoy.";
  }
  if (fecha > maxTexto) {
    return "Solo se pueden reservar hasta 60 días antes de la fecha.";
  }

  return null;
}

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

// GET /api/reservas/plan?dias=7
// Cuantas minutas hay que servir por fecha y por turno en los
// proximos N dias. La cocina lo usa para saber con antelacion
// cuanto preparar (las reservas se hacen dias antes).
router.get("/plan", async (req, res) => {
  const dias = Math.min(14, Math.max(1, Number(req.query.dias) || 7));
  const hoy = new Date();
  const fechas = [];
  for (let i = 0; i < dias; i++) {
    const f = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    fechas.push(
      `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`
    );
  }

  const primera = fechas[0];
  const ultima = fechas[fechas.length - 1];

  const { data, error } = await getSupabase()
    .from("reservas")
    .select("fecha, turno")
    .gte("fecha", primera)
    .lte("fecha", ultima);

  if (error) return res.status(500).json({ error: error.message });

  // Agrupamos por fecha y turno
  const porFecha = {};
  for (const r of data) {
    if (!porFecha[r.fecha]) porFecha[r.fecha] = {};
    porFecha[r.fecha][r.turno] = (porFecha[r.fecha][r.turno] || 0) + 1;
  }

  // Armamos la respuesta solo con los dias que hay reservas
  const plan = fechas
    .map((fecha) => ({
      fecha,
      porTurno: porFecha[fecha] || {},
      total: Object.values(porFecha[fecha] || {}).reduce((a, b) => a + b, 0),
    }))
    .filter((d) => d.total > 0);

  res.json(plan);
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

  // La fecha debe ser real y estar dentro del rango permitido
  const errorFecha = validarFecha(fecha);
  if (errorFecha) {
    return res.status(400).json({ error: errorFecha });
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
  // Y EL MISMO TURNO. Un estudiante puede comer en dos jornadas
  // (Almuerzo y Refrigerio) el mismo dia, asi que solo se bloquea
  // la reserva repetida de la misma fecha + turno.
  const { data: existente, error: errExistente } = await getSupabase()
    .from("reservas")
    .select("id")
    .eq("documento", documento)
    .eq("fecha", fecha)
    .eq("turno", turno)
    .maybeSingle();

  if (errExistente) {
    return res.status(500).json({ error: errExistente.message });
  }
  if (existente) {
    return res
      .status(400)
      .json({ error: "Ya tienes una reserva para esa fecha y ese turno" });
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
