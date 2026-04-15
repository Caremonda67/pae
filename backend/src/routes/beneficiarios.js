// ============================================================
// Beneficiarios del programa
// ============================================================
// Registro de estudiantes que reciben el PAE. La pagina de
// beneficiarios lee esta tabla (antes eran datos fijos) y la
// reserva valida que el documento exista aqui antes de guardar.
//
// Lectura: publica (todos ven el registro)
// Escritura (crear/borrar): solo admin con token valido
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereAdmin } from "../config/auth.js";

const router = Router();

// GET /api/beneficiarios
// Lista todos los beneficiarios del programa
router.get("/", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("beneficiarios")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/beneficiarios/buscar?documento=...
// Busca un beneficiario por su documento (para la reserva)
router.get("/buscar", async (req, res) => {
  const { documento } = req.query;
  if (!documento) {
    return res.status(400).json({ error: "Falta el documento" });
  }

  const { data, error } = await getSupabase()
    .from("beneficiarios")
    .select("*")
    .eq("documento", String(documento).trim())
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  if (!data) {
    return res.status(404).json({ error: "Documento no registrado" });
  }
  res.json(data);
});

// POST /api/beneficiarios
// Registra un beneficiario nuevo (solo admin)
// Cuerpo esperado: { documento, nombre, sede, turno, grado? }
router.post("/", requiereAdmin, async (req, res) => {
  const { documento, nombre, sede, turno, grado } = req.body;

  if (!documento || !nombre || !sede || !turno) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  // No permitir documentos duplicados
  const { data: existente } = await getSupabase()
    .from("beneficiarios")
    .select("id")
    .eq("documento", String(documento).trim())
    .maybeSingle();

  if (existente) {
    return res.status(400).json({ error: "Ese documento ya está registrado" });
  }

  const { data, error } = await getSupabase()
    .from("beneficiarios")
    .insert([{ documento, nombre, sede, turno, grado }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/beneficiarios/:id
// Elimina un beneficiario (solo admin)
router.delete("/:id", requiereAdmin, async (req, res) => {
  const { error } = await getSupabase()
    .from("beneficiarios")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
