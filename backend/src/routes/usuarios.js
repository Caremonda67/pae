// ============================================================
// Usuarios del sistema (cuentas con rol)
// ============================================================
// Solo el administrador crea/borra cuentas. Cada cuenta tiene un
// usuario (para estudiantes es su documento) y una clave/PIN que
// se guarda hasheada.
//
//   GET    /api/usuarios          lista cuentas (sin el hash)
//   POST   /api/usuarios          crea una cuenta
//   PUT    /api/usuarios/:id      activa/desactiva o cambia la clave
//   DELETE /api/usuarios/:id      borra una cuenta
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol, ROLES } from "../config/auth.js";
import { hashClave } from "../config/password.js";

const router = Router();

// GET /api/usuarios
// Lista las cuentas (sin clave_hash). Solo admin.
router.get("/", requiereRol("admin"), async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("usuarios")
    .select("id, nombre, usuario, rol, activo, created_at")
    .order("nombre", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/usuarios
// Crea una cuenta. Cuerpo: { nombre, usuario, clave, rol }
// Para un estudiante, usuario = su documento y clave = su PIN.
router.post("/", requiereRol("admin"), async (req, res) => {
  const { nombre, usuario, clave, rol } = req.body || {};

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: "Falta el nombre" });
  }
  if (!usuario || !String(usuario).trim()) {
    return res.status(400).json({ error: "Falta el usuario" });
  }
  if (!clave || String(clave).length < 4) {
    return res.status(400).json({ error: "La clave o PIN debe tener al menos 4 caracteres" });
  }
  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: `Rol invalido. Usa uno de: ${ROLES.join(", ")}` });
  }

  // El usuario no se debe repetir (documento de estudiante unico)
  const { data: existente, error: errExiste } = await getSupabase()
    .from("usuarios")
    .select("id")
    .eq("usuario", String(usuario).trim())
    .maybeSingle();

  if (errExiste) return res.status(500).json({ error: errExiste.message });
  if (existente) {
    return res.status(400).json({ error: "Ese usuario ya tiene cuenta" });
  }

  const { data, error } = await getSupabase()
    .from("usuarios")
    .insert([
      {
        nombre: String(nombre).trim(),
        usuario: String(usuario).trim(),
        clave_hash: hashClave(clave),
        rol,
      },
    ])
    .select("id, nombre, usuario, rol, activo, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/usuarios/:id
// Cambia la clave o activa/desactiva una cuenta. Solo admin.
// Cuerpo: { activo?, clave? }
router.put("/:id", requiereRol("admin"), async (req, res) => {
  const { activo, clave } = req.body || {};

  const cambios = {};
  if (typeof activo === "boolean") cambios.activo = activo;
  if (clave) cambios.clave_hash = hashClave(clave);

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: "No hay nada que actualizar" });
  }

  const { data, error } = await getSupabase()
    .from("usuarios")
    .update(cambios)
    .eq("id", req.params.id)
    .select("id, nombre, usuario, rol, activo, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/usuarios/:id
// Borra una cuenta. Solo admin.
router.delete("/:id", requiereRol("admin"), async (req, res) => {
  const { error } = await getSupabase()
    .from("usuarios")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
