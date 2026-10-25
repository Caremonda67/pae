// Registro de estudiantes del PAE. Lectura publica; alta/edicion con
// rol admin, coordinador o profesor. La reserva valida el documento aqui.
import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol } from "../config/auth.js";
import { hashClave } from "../config/password.js";
import { auditar } from "../config/auditoria.js";

const router = Router();

// GET /api/beneficiarios
// Lista todos los beneficiarios del programa
// Lista completa de beneficiarios. SOLO para el panel (admin,
// coordinador y profesor): trae datos personales como documento y
// PIN. La web publica usa /resumen, que devuelve solo conteos.
router.get("/", requiereRol("admin", "coordinador", "profesor"), async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("beneficiarios")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/beneficiarios/resumen
// Conteo de beneficiarios por sede, PUBLICO. Lo usa la Home para
// el registro por sede sin exponer nombres ni documentos.
router.get("/resumen", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("beneficiarios")
    .select("sede");
  if (error) return res.status(500).json({ error: error.message });
  const conteo = {};
  for (const fila of data || []) {
    const sede = fila.sede || "Sin sede";
    conteo[sede] = (conteo[sede] || 0) + 1;
  }
  res.json(Object.entries(conteo).map(([sede, total]) => ({ sede, total })));
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
  // Nunca devolvemos el PIN: este endpoint es publico (autocompleta
  // el formulario de reserva) y el PIN se valida solo en el login.
  const copia = { ...data };
  delete copia.pin;
  res.json(copia);
});

// PUT /api/beneficiarios/mi-perfil
// El estudiante actualiza sus propios datos de alimento: alergias y
// preferencias (menu alternativo). Solo puede tocar esos dos campos y
// solo para su propio documento (el de la sesion).
// Cuerpo: { alergias?, preferencias? }
router.put("/mi-perfil", requiereRol("estudiante"), async (req, res) => {
  const { alergias, preferencias } = req.body || {};
  const documento = String(req.usuario.sub || "").trim();
  if (!documento) {
    return res.status(400).json({ error: "No hay sesión de estudiante" });
  }

  const { data: ben, error: errBen } = await getSupabase()
    .from("beneficiarios")
    .select("id")
    .eq("documento", documento)
    .maybeSingle();
  if (errBen) return res.status(500).json({ error: errBen.message });
  if (!ben) return res.status(404).json({ error: "Beneficiario no encontrado" });

  const cambios = {};
  if (alergias !== undefined) cambios.alergias = String(alergias).trim();
  if (preferencias !== undefined) cambios.preferencias = String(preferencias).trim();
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: "No hay nada que actualizar" });
  }

  const { error } = await getSupabase()
    .from("beneficiarios")
    .update(cambios)
    .eq("id", ben.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, ...cambios });
});

// POST /api/beneficiarios
// Registra un beneficiario nuevo (admin, coordinador o profesor).
// Si llega un PIN, tambien se crea su cuenta de estudiante
// (usuario = documento, rol = estudiante) para que pueda entrar
// a reservar con documento + PIN.
// Cuerpo esperado: { documento, nombre, sede, turno, grado?, pin?, alergias?, preferencias? }
router.post("/", requiereRol("admin", "coordinador", "profesor"), async (req, res) => {
  const { documento, nombre, sede, turno, grado, pin, alergias, preferencias } = req.body;

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
    .insert([
      {
        documento, nombre, sede, turno, grado,
        alergias: alergias || null,
        preferencias: preferencias || null,
      },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Si el admin/profesor da un PIN, creamos la cuenta de estudiante
  if (pin && String(pin).trim()) {
    const pinLimpio = String(pin).trim();
    if (pinLimpio.length < 4) {
      return res.status(400).json({
        error: "El PIN debe tener al menos 4 caracteres",
      });
    }
    const { error: errUsuario } = await getSupabase().from("usuarios").insert([
      {
        nombre,
        usuario: String(documento).trim(),
        clave_hash: hashClave(pinLimpio),
        rol: "estudiante",
      },
    ]);
    if (errUsuario) {
      return res
        .status(500)
        .json({ error: `El beneficiario se guardó, pero no la cuenta: ${errUsuario.message}` });
    }
  }

  auditar(req, "beneficiarios:crear", `${documento} | ${nombre} | ${sede} | ${turno}`);
  res.status(201).json(data);
});

// PUT /api/beneficiarios/:id/pin
// Asigna (o renueva) el PIN de un beneficiario que ya esta registrado.
// Crea su cuenta de estudiante si todavia no tiene, o le actualiza el
// PIN a la existente. Solo admin, coordinador o profesor.
// Cuerpo: { pin: "1234" }
router.put("/:id/pin", requiereRol("admin", "coordinador", "profesor"), async (req, res) => {
  const { pin } = req.body || {};
  const pinLimpio = pin ? String(pin).trim() : "";
  if (!pinLimpio) {
    return res.status(400).json({ error: "Escribe un PIN" });
  }
  if (pinLimpio.length < 4) {
    return res.status(400).json({ error: "El PIN debe tener al menos 4 caracteres" });
  }

  const { data: ben, error: errBen } = await getSupabase()
    .from("beneficiarios")
    .select("id, nombre, documento")
    .eq("id", req.params.id)
    .maybeSingle();

  if (errBen) return res.status(500).json({ error: errBen.message });
  if (!ben) return res.status(404).json({ error: "Beneficiario no encontrado" });

  const documento = String(ben.documento).trim();

  // Si el estudiante ya tiene cuenta (usuario = documento), solo se
  // renueva el PIN; si no, se crea la cuenta con rol estudiante.
  const { data: existente } = await getSupabase()
    .from("usuarios")
    .select("id")
    .eq("usuario", documento)
    .maybeSingle();

  if (existente) {
    const { error } = await getSupabase()
      .from("usuarios")
      .update({ clave_hash: hashClave(pinLimpio) })
      .eq("id", existente.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const { error } = await getSupabase().from("usuarios").insert([
      {
        nombre: ben.nombre,
        usuario: documento,
        clave_hash: hashClave(pinLimpio),
        rol: "estudiante",
      },
    ]);
    if (error) return res.status(500).json({ error: error.message });
  }

  auditar(req, "beneficiarios:pin", `documento ${documento} | nuevo PIN asignado`);
  res.json({ ok: true, documento });
});

// PUT /api/beneficiarios/:id
// Actualiza los datos de un beneficiario (admin, coordinador o profesor).
// Permite corregir nombre/sede/turno/grado y los campos de alimento
// (alergias y preferencias).
// Cuerpo: { nombre?, sede?, turno?, grado?, alergias?, preferencias? }
router.put("/:id", requiereRol("admin", "coordinador", "profesor"), async (req, res) => {
  const { nombre, sede, turno, grado, alergias, preferencias } = req.body || {};

  const { data: ben, error: errBen } = await getSupabase()
    .from("beneficiarios")
    .select("id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (errBen) return res.status(500).json({ error: errBen.message });
  if (!ben) return res.status(404).json({ error: "Beneficiario no encontrado" });

  const cambios = {};
  if (nombre !== undefined) cambios.nombre = String(nombre).trim();
  if (sede !== undefined) cambios.sede = String(sede).trim();
  if (turno !== undefined) cambios.turno = String(turno).trim();
  if (grado !== undefined) cambios.grado = grado ? String(grado).trim() : null;
  if (alergias !== undefined) cambios.alergias = alergias ? String(alergias).trim() : null;
  if (preferencias !== undefined) cambios.preferencias = preferencias ? String(preferencias).trim() : null;
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: "No hay nada que actualizar" });
  }

  const { error } = await getSupabase()
    .from("beneficiarios")
    .update(cambios)
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  auditar(req, "beneficiarios:editar", `id ${req.params.id} | cambiaron ${Object.keys(cambios).join(", ")}`);
  res.json({ ok: true });
});

// DELETE /api/beneficiarios/:id
// Elimina un beneficiario (solo admin)
router.delete("/:id", requiereRol("admin"), async (req, res) => {
  const { data: ben } = await getSupabase()
    .from("beneficiarios")
    .select("documento, nombre")
    .eq("id", req.params.id)
    .maybeSingle();

  if (!ben) return res.status(404).json({ error: "Beneficiario no encontrado" });

  const { error } = await getSupabase()
    .from("beneficiarios")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  auditar(req, "beneficiarios:borrar", `id ${req.params.id} | "${ben?.nombre || ""}" (${ben?.documento || ""})`);
  res.status(204).end();
});

export default router;
